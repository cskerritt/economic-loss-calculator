import {
  Algebraic,
  CaseInfo,
  DateCalc,
  EarningsParams,
  HhServices,
  HhsData,
  LcpData,
  LcpItem,
  Projection,
  ScenarioProjection,
} from "./types";

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

export function computeDateCalc(caseInfo: CaseInfo, today: Date = new Date()): DateCalc {
  if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) {
    return { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 0 };
  }

  const dob = new Date(caseInfo.dob);
  const doi = new Date(caseInfo.dateOfInjury);
  const dot = new Date(caseInfo.dateOfTrial);

  const getAge = (d: Date) => (d.getTime() - dob.getTime()) / MS_PER_YEAR;
  const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / MS_PER_YEAR);

  const targetRetirementDate = new Date(dob);
  targetRetirementDate.setFullYear(dob.getFullYear() + caseInfo.retirementAge);
  const derivedYFS = Math.max(0, (targetRetirementDate.getTime() - dot.getTime()) / MS_PER_YEAR);

  return {
    ageInjury: getAge(doi).toFixed(1),
    ageTrial: getAge(dot).toFixed(1),
    currentAge: getAge(today).toFixed(1),
    pastYears,
    derivedYFS,
  };
}

export function computeWorkLifeFactor(earningsParams: EarningsParams, derivedYFS: number): number {
  if (derivedYFS <= 0) return 0;
  return (earningsParams.wle / derivedYFS) * 100;
}

export function computeAlgebraic(
  earningsParams: EarningsParams,
  dateCalc: DateCalc,
  isUnionMode: boolean,
): Algebraic {
  const yfs = dateCalc.derivedYFS;
  const wlf = yfs > 0 ? earningsParams.wle / yfs : 0;
  const unempFactor =
    1 - (earningsParams.unemploymentRate / 100) * (1 - earningsParams.uiReplacementRate / 100);
  const afterTaxFactor = (1 - earningsParams.fedTaxRate / 100) * (1 - earningsParams.stateTaxRate / 100);

  let fringeFactor = 1;
  let flatFringeAmount = 0;

  if (isUnionMode) {
    flatFringeAmount =
      earningsParams.pension +
      earningsParams.healthWelfare +
      earningsParams.annuity +
      earningsParams.clothingAllowance +
      earningsParams.otherBenefits;
    const effectiveFringeRate =
      earningsParams.baseEarnings > 0 ? flatFringeAmount / earningsParams.baseEarnings : 0;
    fringeFactor = 1 + effectiveFringeRate;
  } else {
    fringeFactor = 1 + earningsParams.fringeRate / 100;
  }

  const fullMultiplier = wlf * unempFactor * afterTaxFactor * fringeFactor;
  const realizedMultiplier = afterTaxFactor * fringeFactor;
  const combinedTaxRate = 1 - afterTaxFactor;

  return {
    wlf,
    unempFactor,
    afterTaxFactor,
    fringeFactor,
    fullMultiplier,
    realizedMultiplier,
    yfs,
    flatFringeAmount,
    combinedTaxRate,
  };
}

export function computeProjection(
  caseInfo: CaseInfo,
  earningsParams: EarningsParams,
  algebraic: Algebraic,
  pastActuals: Record<number, string>,
  dateCalc: DateCalc,
): Projection {
  const pastSchedule: Projection["pastSchedule"] = [];
  const futureSchedule: Projection["futureSchedule"] = [];
  let totalPastLoss = 0;
  let totalFutureNominal = 0;
  let totalFuturePV = 0;

  if (!caseInfo.dateOfInjury) {
    return { pastSchedule, futureSchedule, totalPastLoss, totalFutureNominal, totalFuturePV };
  }

  const startYear = new Date(caseInfo.dateOfInjury).getFullYear();
  const fullPast = Math.floor(dateCalc.pastYears);
  const partialPast = dateCalc.pastYears % 1;

  for (let i = 0; i <= fullPast; i++) {
    const fraction =
      i === fullPast && partialPast > 0 ? partialPast : i === fullPast && partialPast === 0 ? 0 : 1;
    if (fraction <= 0) continue;

    const currentYear = startYear + i;
    const growth = Math.pow(1 + earningsParams.wageGrowth / 100, i);
    const grossBase = earningsParams.baseEarnings * growth * fraction;
    const netButFor = grossBase * algebraic.fullMultiplier;

    let netActual = 0;
    let grossActual = 0;
    let isManual = false;

    if (pastActuals[currentYear] !== undefined && pastActuals[currentYear] !== "") {
      grossActual = parseFloat(pastActuals[currentYear]);
      netActual = grossActual * algebraic.realizedMultiplier;
      isManual = true;
    } else {
      grossActual = earningsParams.residualEarnings * growth * fraction;
      netActual = grossActual * algebraic.fullMultiplier;
    }

    const netLoss = netButFor - netActual;
    totalPastLoss += netLoss;
    pastSchedule.push({
      year: currentYear,
      label: `Past-${i + 1}`,
      grossBase,
      grossActual,
      netLoss,
      isManual,
      fraction,
    });
  }

  const futureYears = Math.ceil(algebraic.yfs);
  for (let i = 0; i < futureYears; i++) {
    const growth = Math.pow(1 + earningsParams.wageGrowth / 100, i);
    const discount = 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5);
    const grossBase = earningsParams.baseEarnings * growth;
    const netButFor = grossBase * algebraic.fullMultiplier;
    const grossRes = earningsParams.residualEarnings * growth;
    const netActual = grossRes * algebraic.fullMultiplier;
    const netLoss = netButFor - netActual;
    const pv = netLoss * discount;

    totalFutureNominal += netLoss;
    totalFuturePV += pv;
    futureSchedule.push({ year: i + 1, gross: grossBase, netLoss, pv });
  }

  return { pastSchedule, futureSchedule, totalPastLoss, totalFutureNominal, totalFuturePV };
}

export function computeHhsData(hhServices: HhServices, derivedYFS: number): HhsData {
  if (!hhServices.active) return { totalNom: 0, totalPV: 0 };

  let totalNom = 0;
  let totalPV = 0;
  const years = Math.ceil(derivedYFS);

  for (let i = 0; i < years; i++) {
    const annualValue =
      hhServices.hoursPerWeek *
      52 *
      hhServices.hourlyRate *
      Math.pow(1 + hhServices.growthRate / 100, i);
    const disc = 1 / Math.pow(1 + hhServices.discountRate / 100, i + 0.5);
    totalNom += annualValue;
    totalPV += annualValue * disc;
  }

  return { totalNom, totalPV };
}

export function computeLcpData(lcpItems: LcpItem[], discountRate: number): LcpData {
  let totalNom = 0;
  let totalPV = 0;

  const processed = lcpItems.map((item) => {
    let itemNominal = 0;
    let itemPV = 0;

    const baseStartYear = Math.max(1, item.startYear || 1);
    const endYear = Math.max(item.endYear || 0, baseStartYear + item.duration - 1);
    const duration = Math.max(0, endYear - baseStartYear + 1);
    const useCustom = item.useCustomYears && item.customYears && item.customYears.length > 0;

    if (useCustom) {
      const years = Array.from(new Set(item.customYears.filter((y) => y > 0))).sort((a, b) => a - b);
      for (const year of years) {
        const t = year - 1;
        const inflated = item.baseCost * Math.pow(1 + item.cpi / 100, t);
        const discount = 1 / Math.pow(1 + discountRate / 100, t + 0.5);
        itemNominal += inflated;
        itemPV += inflated * discount;
      }
    } else {
      const interval = Math.max(1, item.recurrenceInterval || 1);
      for (let t = 0; t < duration; t++) {
        let active = false;
        if (item.freqType === "annual") active = true;
        else if (item.freqType === "onetime") active = t === 0;
        else if (item.freqType === "recurring") active = t % interval === 0;

        if (active) {
          const absoluteYearIndex = baseStartYear - 1 + t;
          const inflated = item.baseCost * Math.pow(1 + item.cpi / 100, absoluteYearIndex);
          const discount = 1 / Math.pow(1 + discountRate / 100, absoluteYearIndex + 0.5);
          itemNominal += inflated;
          itemPV += inflated * discount;
        }
      }
    }

    totalNom += itemNominal;
    totalPV += itemPV;

    return { ...item, totalNom: itemNominal, totalPV: itemPV };
  });

  return { items: processed, totalNom, totalPV };
}

export function computeAgeAtInjury(caseInfo: CaseInfo): number {
  if (!caseInfo.dob || !caseInfo.dateOfInjury) return 0;
  const dobDate = new Date(caseInfo.dob);
  const injuryDate = new Date(caseInfo.dateOfInjury);
  return (injuryDate.getTime() - dobDate.getTime()) / MS_PER_YEAR;
}

interface ScenarioProjectionInput {
  caseInfo: CaseInfo;
  ageAtInjury: number;
  earningsParams: EarningsParams;
  dateCalc: DateCalc;
  pastActuals: Record<number, string>;
  isUnionMode: boolean;
  hhServices: HhServices;
  hhsData: HhsData;
  lcpData: LcpData;
}

export function computeScenarioProjections({
  caseInfo,
  ageAtInjury,
  earningsParams,
  dateCalc,
  pastActuals,
  isUnionMode,
  hhServices,
  hhsData,
  lcpData,
}: ScenarioProjectionInput): ScenarioProjection[] {
  if (!caseInfo.dateOfInjury || !caseInfo.dob || ageAtInjury <= 0 || !earningsParams.wle) return [];

  const calculateScenarioProjection = (
    scenarioId: string,
    label: string,
    retirementAge: number,
  ): ScenarioProjection => {
    const yfs = Math.max(0, retirementAge - ageAtInjury);
    const wlf = yfs > 0 ? earningsParams.wle / yfs : 0;
    const wlfPercent = wlf * 100;

    const unempFactor =
      1 - (earningsParams.unemploymentRate / 100) * (1 - earningsParams.uiReplacementRate / 100);
    const afterTaxFactor = (1 - earningsParams.fedTaxRate / 100) * (1 - earningsParams.stateTaxRate / 100);
    let fringeFactor = 1;

    if (isUnionMode) {
      const flatFringe =
        earningsParams.pension +
        earningsParams.healthWelfare +
        earningsParams.annuity +
        earningsParams.clothingAllowance +
        earningsParams.otherBenefits;
      fringeFactor = earningsParams.baseEarnings > 0 ? 1 + flatFringe / earningsParams.baseEarnings : 1;
    } else {
      fringeFactor = 1 + earningsParams.fringeRate / 100;
    }

    const fullMultiplier = wlf * unempFactor * afterTaxFactor * fringeFactor;
    const realizedMultiplier = afterTaxFactor * fringeFactor;

    let totalPastLoss = 0;
    const startYear = new Date(caseInfo.dateOfInjury!).getFullYear();
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;

    for (let i = 0; i <= fullPast; i++) {
      const fraction =
        i === fullPast && partialPast > 0 ? partialPast : i === fullPast && partialPast === 0 ? 0 : 1;
      if (fraction <= 0) continue;

      const currentYear = startYear + i;
      const growth = Math.pow(1 + earningsParams.wageGrowth / 100, i);
      const grossBase = earningsParams.baseEarnings * growth * fraction;
      const netButFor = grossBase * fullMultiplier;

      let netActual = 0;
      if (pastActuals[currentYear] !== undefined && pastActuals[currentYear] !== "") {
        const grossActual = parseFloat(pastActuals[currentYear]);
        netActual = grossActual * realizedMultiplier;
      } else {
        const grossActual = earningsParams.residualEarnings * growth * fraction;
        netActual = grossActual * fullMultiplier;
      }

      totalPastLoss += netButFor - netActual;
    }

    let totalFuturePV = 0;
    const futureYears = Math.ceil(yfs);
    for (let i = 0; i < futureYears; i++) {
      const growth = Math.pow(1 + earningsParams.wageGrowth / 100, i);
      const discount = 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5);
      const grossBase = earningsParams.baseEarnings * growth;
      const netButFor = grossBase * fullMultiplier;
      const grossRes = earningsParams.residualEarnings * growth;
      const netActual = grossRes * fullMultiplier;
      const netLoss = netButFor - netActual;
      totalFuturePV += netLoss * discount;
    }

    const totalEarningsLoss = totalPastLoss + totalFuturePV;
    const grandTotal = totalEarningsLoss + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV;

    return {
      id: scenarioId,
      label,
      retirementAge,
      yfs,
      wlf,
      wlfPercent,
      totalPastLoss,
      totalFuturePV,
      totalEarningsLoss,
      grandTotal,
      included: true,
    };
  };

  const scenarios: ScenarioProjection[] = [];
  const wleRetAge = ageAtInjury + earningsParams.wle;
  if (wleRetAge > 0) {
    scenarios.push(calculateScenarioProjection("wle", `WLE (Age ${wleRetAge.toFixed(1)})`, wleRetAge));
  }

  const standardAges = [
    { id: "age65", label: "Age 65", retirementAge: 65 },
    { id: "age67", label: "Age 67", retirementAge: 67 },
    { id: "age70", label: "Age 70", retirementAge: 70 },
  ];

  for (const scenario of standardAges) {
    scenarios.push(calculateScenarioProjection(scenario.id, scenario.label, scenario.retirementAge));
  }

  if (earningsParams.enablePJI) {
    scenarios.push(
      calculateScenarioProjection("pji", `PJI (Age ${earningsParams.pjiAge})`, earningsParams.pjiAge),
    );
  }

  return scenarios;
}

export function computeGrandTotal(
  projection: Projection,
  hhServices: HhServices,
  hhsData: HhsData,
  lcpData: LcpData,
): number {
  return projection.totalPastLoss + projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV;
}
