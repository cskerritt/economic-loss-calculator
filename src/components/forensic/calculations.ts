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

// Parse date from MM/DD/YYYY format (or fallback to ISO format for backwards compatibility)
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  
  // Check for MM/DD/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to ISO format (YYYY-MM-DD) for backwards compatibility
  return new Date(dateStr);
}

export function computeDateCalc(caseInfo: CaseInfo, today: Date = new Date()): DateCalc {
  if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) {
    return { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 0 };
  }

  const dob = parseDate(caseInfo.dob);
  const doi = parseDate(caseInfo.dateOfInjury);
  const dot = parseDate(caseInfo.dateOfTrial);

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

/**
 * Tinari Algebraic Method Implementation
 * 
 * Formula: AIF = {[((GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL} × (1 - PC)
 * 
 * Key insight: Fringe benefits are added AFTER unemployment adjustment, but taxes are only 
 * applied to the BASE EARNINGS portion (not on fringe benefits, since they're typically pre-tax).
 * 
 * Step-by-step:
 * 1. Start with 100% of Gross Earnings
 * 2. × Work Life Factor = Worklife-Adjusted Base
 * 3. × (1 - Unemployment Factor) = Unemployment-Adjusted Base
 * 4. × (1 + Fringe Benefits) = Gross Compensation with Fringes
 * 5. - Tax Liabilities (on base earnings only, NOT on fringe benefits)
 * 6. × (1 - Personal Consumption) = Adjusted Income Factor (AIF) [for wrongful death]
 */
export function computeAlgebraic(
  earningsParams: EarningsParams,
  dateCalc: DateCalc,
  isUnionMode: boolean,
): Algebraic {
  const yfs = dateCalc.derivedYFS;
  const wlf = yfs > 0 ? earningsParams.wle / yfs : 0;
  
  // Unemployment factor: (1 - UF × (1 - UI replacement))
  const unempFactor =
    1 - (earningsParams.unemploymentRate / 100) * (1 - earningsParams.uiReplacementRate / 100);
  
  // After-tax factor for base earnings
  const afterTaxFactor = (1 - earningsParams.fedTaxRate / 100) * (1 - earningsParams.stateTaxRate / 100);
  const combinedTaxRate = 1 - afterTaxFactor;

  // Fringe benefits factor: (1 + FB)
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

  // Personal consumption factors (for wrongful death cases)
  const era1PersonalConsumptionFactor = earningsParams.isWrongfulDeath 
    ? (1 - earningsParams.era1PersonalConsumption / 100) 
    : 1;
  const era2PersonalConsumptionFactor = earningsParams.isWrongfulDeath 
    ? (1 - earningsParams.era2PersonalConsumption / 100) 
    : 1;

  // Tinari step-by-step breakdown (as percentages of gross earnings)
  const worklifeAdjustedBase = wlf; // 100% × WLF
  const unemploymentAdjustedBase = worklifeAdjustedBase * unempFactor; // × (1 - UF)
  const grossCompensationWithFringes = unemploymentAdjustedBase * fringeFactor; // × (1 + FB)
  
  // CRITICAL: Tax is applied only to the BASE EARNINGS portion, not fringe benefits
  // Tax liability = (base earnings portion) × tax rate
  // In the Tinari formula, this means we subtract taxes from the base, not from fringes
  const taxOnBaseEarnings = unemploymentAdjustedBase * combinedTaxRate;
  const afterTaxCompensation = grossCompensationWithFringes - taxOnBaseEarnings;

  // Era-specific AIFs (with personal consumption for wrongful death)
  const era1AIF = afterTaxCompensation * era1PersonalConsumptionFactor;
  const era2AIF = afterTaxCompensation * era2PersonalConsumptionFactor;

  // Legacy full multiplier (for backward compatibility)
  // Note: The old formula was incorrect - it applied tax to everything including fringes
  // New Tinari formula: AIF = [(base × WLF × (1-UF)) × (1+FB)] - [(base × WLF × (1-UF)) × TL] × (1-PC)
  const fullMultiplier = afterTaxCompensation; // Without personal consumption (PI cases)
  const realizedMultiplier = afterTaxFactor * fringeFactor;

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
    era1PersonalConsumptionFactor,
    era2PersonalConsumptionFactor,
    era1AIF,
    era2AIF,
    worklifeAdjustedBase,
    unemploymentAdjustedBase,
    grossCompensationWithFringes,
    taxOnBaseEarnings,
    afterTaxCompensation,
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

  const startYear = parseDate(caseInfo.dateOfInjury).getFullYear();
  const fullPast = Math.floor(dateCalc.pastYears);
  const partialPast = dateCalc.pastYears % 1;
  
  // Determine era split year (defaults to trial year)
  const eraSplitYear = earningsParams.useEraSplit 
    ? earningsParams.eraSplitYear 
    : (caseInfo.dateOfTrial ? parseDate(caseInfo.dateOfTrial).getFullYear() : startYear + fullPast);

  // Use era-specific wage growth if era split is enabled
  const getWageGrowth = (year: number, isPast: boolean) => {
    if (!earningsParams.useEraSplit) return earningsParams.wageGrowth;
    return isPast ? earningsParams.era1WageGrowth : earningsParams.era2WageGrowth;
  };

  // Get AIF based on era (for wrongful death cases)
  const getAIF = (isPast: boolean) => {
    return isPast ? algebraic.era1AIF : algebraic.era2AIF;
  };

  // Past schedule calculations
  for (let i = 0; i <= fullPast; i++) {
    const fraction =
      i === fullPast && partialPast > 0 ? partialPast : i === fullPast && partialPast === 0 ? 0 : 1;
    if (fraction <= 0) continue;

    const currentYear = startYear + i;
    const wageGrowthRate = getWageGrowth(currentYear, true);
    const growth = Math.pow(1 + wageGrowthRate / 100, i);
    const grossBase = earningsParams.baseEarnings * growth * fraction;
    
    // Use Era 1 AIF for past losses
    const aif = getAIF(true);
    const netButFor = grossBase * aif;

    let netActual = 0;
    let grossActual = 0;
    let isManual = false;

    if (pastActuals[currentYear] !== undefined && pastActuals[currentYear] !== "") {
      grossActual = parseFloat(pastActuals[currentYear]);
      netActual = grossActual * algebraic.realizedMultiplier;
      isManual = true;
    } else {
      grossActual = earningsParams.residualEarnings * growth * fraction;
      netActual = grossActual * aif;
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

  // Future schedule calculations
  const futureYears = Math.ceil(algebraic.yfs);
  for (let i = 0; i < futureYears; i++) {
    const wageGrowthRate = getWageGrowth(eraSplitYear + i, false);
    const growth = Math.pow(1 + wageGrowthRate / 100, i);
    const discount = 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5);
    const grossBase = earningsParams.baseEarnings * growth;
    
    // Use Era 2 AIF for future losses
    const aif = getAIF(false);
    const netButFor = grossBase * aif;
    const grossRes = earningsParams.residualEarnings * growth;
    const netActual = grossRes * aif;
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
  const dobDate = parseDate(caseInfo.dob);
  const injuryDate = parseDate(caseInfo.dateOfInjury);
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
    const combinedTaxRate = 1 - afterTaxFactor;
    
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

    // Tinari method: AIF calculation
    const unemploymentAdjustedBase = wlf * unempFactor;
    const grossCompensationWithFringes = unemploymentAdjustedBase * fringeFactor;
    const taxOnBaseEarnings = unemploymentAdjustedBase * combinedTaxRate;
    const afterTaxCompensation = grossCompensationWithFringes - taxOnBaseEarnings;

    // Personal consumption factors (for wrongful death)
    const era1PC = earningsParams.isWrongfulDeath ? (1 - earningsParams.era1PersonalConsumption / 100) : 1;
    const era2PC = earningsParams.isWrongfulDeath ? (1 - earningsParams.era2PersonalConsumption / 100) : 1;
    
    const era1AIF = afterTaxCompensation * era1PC;
    const era2AIF = afterTaxCompensation * era2PC;
    
    const realizedMultiplier = afterTaxFactor * fringeFactor;

    let totalPastLoss = 0;
    const startYear = parseDate(caseInfo.dateOfInjury!).getFullYear();
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;

    // Era split year
    const eraSplitYear = earningsParams.useEraSplit 
      ? earningsParams.eraSplitYear 
      : (caseInfo.dateOfTrial ? parseDate(caseInfo.dateOfTrial).getFullYear() : startYear + fullPast);

    for (let i = 0; i <= fullPast; i++) {
      const fraction =
        i === fullPast && partialPast > 0 ? partialPast : i === fullPast && partialPast === 0 ? 0 : 1;
      if (fraction <= 0) continue;

      const currentYear = startYear + i;
      const wageGrowthRate = earningsParams.useEraSplit ? earningsParams.era1WageGrowth : earningsParams.wageGrowth;
      const growth = Math.pow(1 + wageGrowthRate / 100, i);
      const grossBase = earningsParams.baseEarnings * growth * fraction;
      const netButFor = grossBase * era1AIF;

      let netActual = 0;
      if (pastActuals[currentYear] !== undefined && pastActuals[currentYear] !== "") {
        const grossActual = parseFloat(pastActuals[currentYear]);
        netActual = grossActual * realizedMultiplier;
      } else {
        const grossActual = earningsParams.residualEarnings * growth * fraction;
        netActual = grossActual * era1AIF;
      }

      totalPastLoss += netButFor - netActual;
    }

    let totalFuturePV = 0;
    const futureYears = Math.ceil(yfs);
    for (let i = 0; i < futureYears; i++) {
      const wageGrowthRate = earningsParams.useEraSplit ? earningsParams.era2WageGrowth : earningsParams.wageGrowth;
      const growth = Math.pow(1 + wageGrowthRate / 100, i);
      const discount = 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5);
      const grossBase = earningsParams.baseEarnings * growth;
      const netButFor = grossBase * era2AIF;
      const grossRes = earningsParams.residualEarnings * growth;
      const netActual = grossRes * era2AIF;
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

// Detailed year-over-year schedule for a scenario
export interface DetailedScheduleRow {
  yearNum: number;
  calendarYear: number;
  grossEarnings: number;
  netLoss: number;
  presentValue: number;
  cumPV: number;
  isPast: boolean;
}

export function computeDetailedScenarioSchedule(
  caseInfo: CaseInfo,
  earningsParams: EarningsParams,
  retirementAge: number,
  ageAtInjury: number,
  isUnionMode: boolean,
  baseCalendarYear: number
): DetailedScheduleRow[] {
  if (!caseInfo.dateOfInjury || !caseInfo.dob || ageAtInjury <= 0) return [];

  const yfs = Math.max(0, retirementAge - ageAtInjury);
  const wlf = yfs > 0 ? earningsParams.wle / yfs : 0;

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
  const schedule: DetailedScheduleRow[] = [];
  let cumPV = 0;

  const futureYears = Math.ceil(yfs);
  for (let i = 0; i < futureYears; i++) {
    const growth = Math.pow(1 + earningsParams.wageGrowth / 100, i);
    const discount = 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5);
    const grossBase = earningsParams.baseEarnings * growth;
    const grossRes = earningsParams.residualEarnings * growth;
    const netButFor = grossBase * fullMultiplier;
    const netActual = grossRes * fullMultiplier;
    const netLoss = netButFor - netActual;
    const pv = netLoss * discount;
    cumPV += pv;

    schedule.push({
      yearNum: i + 1,
      calendarYear: baseCalendarYear + i,
      grossEarnings: grossBase,
      netLoss,
      presentValue: pv,
      cumPV,
      isPast: false,
    });
  }

  return schedule;
}

// Detailed year-over-year schedule for LCP items
export interface DetailedLcpScheduleRow {
  calendarYear: number;
  yearNum: number;
  items: { name: string; baseCost: number; inflatedCost: number; pv: number }[];
  totalInflated: number;
  totalPV: number;
  cumPV: number;
}

export function computeDetailedLcpSchedule(
  lcpItems: LcpItem[],
  discountRate: number,
  baseCalendarYear: number,
  maxYears: number = 50
): DetailedLcpScheduleRow[] {
  const yearMap: Map<number, DetailedLcpScheduleRow> = new Map();
  let cumPV = 0;

  for (const item of lcpItems) {
    const baseStartYear = Math.max(1, item.startYear || 1);
    const endYear = Math.max(item.endYear || 0, baseStartYear + item.duration - 1);
    const duration = Math.max(0, endYear - baseStartYear + 1);
    const useCustom = item.useCustomYears && item.customYears && item.customYears.length > 0;

    const yearsToProcess: number[] = [];

    if (useCustom) {
      yearsToProcess.push(...Array.from(new Set(item.customYears.filter((y) => y > 0))).sort((a, b) => a - b));
    } else {
      const interval = Math.max(1, item.recurrenceInterval || 1);
      for (let t = 0; t < duration; t++) {
        let active = false;
        if (item.freqType === 'annual') active = true;
        else if (item.freqType === 'onetime') active = t === 0;
        else if (item.freqType === 'recurring') active = t % interval === 0;
        if (active) yearsToProcess.push(baseStartYear + t);
      }
    }

    for (const yearNum of yearsToProcess) {
      const t = yearNum - 1;
      const inflated = item.baseCost * Math.pow(1 + item.cpi / 100, t);
      const discount = 1 / Math.pow(1 + discountRate / 100, t + 0.5);
      const pv = inflated * discount;
      const calendarYear = baseCalendarYear + t;

      if (!yearMap.has(yearNum)) {
        yearMap.set(yearNum, {
          calendarYear,
          yearNum,
          items: [],
          totalInflated: 0,
          totalPV: 0,
          cumPV: 0,
        });
      }

      const row = yearMap.get(yearNum)!;
      row.items.push({ name: item.name, baseCost: item.baseCost, inflatedCost: inflated, pv });
      row.totalInflated += inflated;
      row.totalPV += pv;
    }
  }

  const sortedRows = Array.from(yearMap.values()).sort((a, b) => a.yearNum - b.yearNum);
  for (const row of sortedRows) {
    cumPV += row.totalPV;
    row.cumPV = cumPV;
  }

  return sortedRows;
}

// Detailed household services year-over-year schedule
export interface DetailedHhsScheduleRow {
  yearNum: number;
  calendarYear: number;
  annualValue: number;
  presentValue: number;
  cumPV: number;
}

export function computeDetailedHhsSchedule(
  hhServices: HhServices,
  derivedYFS: number,
  baseCalendarYear: number
): DetailedHhsScheduleRow[] {
  if (!hhServices.active) return [];

  const schedule: DetailedHhsScheduleRow[] = [];
  let cumPV = 0;
  const years = Math.ceil(derivedYFS);

  for (let i = 0; i < years; i++) {
    const annualValue =
      hhServices.hoursPerWeek *
      52 *
      hhServices.hourlyRate *
      Math.pow(1 + hhServices.growthRate / 100, i);
    const disc = 1 / Math.pow(1 + hhServices.discountRate / 100, i + 0.5);
    const pv = annualValue * disc;
    cumPV += pv;

    schedule.push({
      yearNum: i + 1,
      calendarYear: baseCalendarYear + i,
      annualValue,
      presentValue: pv,
      cumPV,
    });
  }

  return schedule;
}
