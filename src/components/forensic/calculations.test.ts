import { describe, expect, it } from "vitest";
import {
  computeAgeAtInjury,
  computeAlgebraic,
  computeDateCalc,
  computeGrandTotal,
  computeHhsData,
  computeLcpData,
  computeProjection,
  computeScenarioProjections,
  computeWorkLifeFactor,
} from "./calculations";
import {
  CaseInfo,
  DEFAULT_CASE_INFO,
  DEFAULT_EARNINGS_PARAMS,
  DEFAULT_HH_SERVICES,
  EarningsParams,
} from "./types";

describe("computeDateCalc", () => {
  it("returns zeros when required dates are missing", () => {
    const result = computeDateCalc(DEFAULT_CASE_INFO);
    expect(result).toEqual({ ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 0 });
  });

  it("computes ages, past years, and derived YFS deterministically", () => {
    const caseInfo: CaseInfo = {
      ...DEFAULT_CASE_INFO,
      dob: "1990-01-01",
      dateOfInjury: "2020-01-01",
      dateOfTrial: "2024-01-01",
      retirementAge: 67,
    };

    const result = computeDateCalc(caseInfo, new Date("2025-01-01"));
    expect(result.ageInjury).toBe("30.0");
    expect(result.ageTrial).toBe("34.0");
    expect(result.currentAge).toBe("35.0");
    expect(result.pastYears).toBeCloseTo(4);
    expect(result.derivedYFS).toBeCloseTo(33);
  });
});

describe("computeWorkLifeFactor", () => {
  it("is zero when derivedYFS is not positive", () => {
    const result = computeWorkLifeFactor({ ...DEFAULT_EARNINGS_PARAMS, wle: 15 }, 0);
    expect(result).toBe(0);
  });
});

describe("computeAlgebraic", () => {
  const dateCalc = { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 25 };

  it("calculates multipliers in non-union mode", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 20,
      fringeRate: 0,
      unemploymentRate: 5,
      uiReplacementRate: 30,
      fedTaxRate: 20,
      stateTaxRate: 5,
      pension: 10000,
      healthWelfare: 5000,
      annuity: 4000,
      clothingAllowance: 1000,
      otherBenefits: 0,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    expect(algebraic.wlf).toBeCloseTo(0.8);
    expect(algebraic.fringeFactor).toBeCloseTo(1);
    expect(algebraic.fullMultiplier).toBeCloseTo(0.58672, 5);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.76);
    expect(algebraic.flatFringeAmount).toBe(0);
  });

  it("uses flat fringe amounts in union mode", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 20,
      fringeRate: 0,
      unemploymentRate: 5,
      uiReplacementRate: 30,
      fedTaxRate: 20,
      stateTaxRate: 5,
      pension: 10000,
      healthWelfare: 5000,
      annuity: 4000,
      clothingAllowance: 1000,
      otherBenefits: 0,
    };

    const algebraic = computeAlgebraic(params, dateCalc, true);
    expect(algebraic.fringeFactor).toBeCloseTo(1.2);
    expect(algebraic.fullMultiplier).toBeCloseTo(0.704064, 6);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.912);
    expect(algebraic.flatFringeAmount).toBe(20000);
  });
});

describe("computeProjection", () => {
  it("handles partial past years, manual actuals, and future PV", () => {
    const caseInfo: CaseInfo = { ...DEFAULT_CASE_INFO, dateOfInjury: "2020-01-01T12:00:00Z" };
    const dateCalc = { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 2.5, derivedYFS: 10 };
    const earningsParams: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      residualEarnings: 25000,
      wle: 15,
      wageGrowth: 2,
      discountRate: 3,
      fringeRate: 10,
      unemploymentRate: 5,
      uiReplacementRate: 50,
      fedTaxRate: 10,
      stateTaxRate: 5,
    };

    const algebraic = computeAlgebraic(earningsParams, dateCalc, false);
    expect(algebraic.wlf).toBeCloseTo(1.5);
    expect(algebraic.fullMultiplier).toBeCloseTo(1.37548125, 6);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.9405, 4);
    const projection = computeProjection(caseInfo, earningsParams, algebraic, { 2021: "15000" }, dateCalc);

    expect(projection.pastSchedule).toHaveLength(3);
    const manualRow = projection.pastSchedule.find((row) => row.year === 2021);
    expect(manualRow?.isManual).toBe(true);
    expect(projection.pastSchedule[2].fraction).toBeCloseTo(0.5);
    expect(projection.totalPastLoss).toBeCloseTo(283017.08221875, 6);

    expect(projection.futureSchedule).toHaveLength(10);
    const firstFuture = projection.futureSchedule[0];
    const expectedFirstPV = firstFuture.netLoss / Math.pow(1 + earningsParams.discountRate / 100, 0.5);
    expect(firstFuture.pv).toBeCloseTo(expectedFirstPV, 6);
  });
});

describe("computeHhsData", () => {
  it("returns zero totals when inactive", () => {
    const result = computeHhsData({ ...DEFAULT_HH_SERVICES, active: false }, 10);
    expect(result).toEqual({ totalNom: 0, totalPV: 0 });
  });

  it("discounts annual household services with growth", () => {
    const result = computeHhsData(
      { ...DEFAULT_HH_SERVICES, active: true, hoursPerWeek: 10, hourlyRate: 20, growthRate: 3, discountRate: 5 },
      2,
    );

    expect(result.totalNom).toBeCloseTo(21112);
    const expectedPV =
      (10 * 52 * 20) / Math.pow(1.05, 0.5) +
      (10 * 52 * 20 * 1.03) / Math.pow(1.05, 1.5);
    expect(result.totalPV).toBeCloseTo(expectedPV, 6);
  });
});

describe("computeLcpData", () => {
  it("supports annual, one-time, and recurring schedules", () => {
    const items = [
      {
        id: 1,
        categoryId: "evals",
        name: "Annual therapy",
        baseCost: 1000,
        freqType: "annual",
        duration: 2,
        startYear: 1,
        endYear: 2,
        cpi: 2,
        recurrenceInterval: 1,
        useCustomYears: false,
        customYears: [],
      },
      {
        id: 2,
        categoryId: "rx",
        name: "One-time surgery",
        baseCost: 5000,
        freqType: "onetime",
        duration: 3,
        startYear: 1,
        endYear: 1,
        cpi: 0,
        recurrenceInterval: 1,
        useCustomYears: false,
        customYears: [],
      },
      {
        id: 3,
        categoryId: "home",
        name: "Recurring device",
        baseCost: 2000,
        freqType: "recurring",
        duration: 4,
        startYear: 1,
        endYear: 4,
        cpi: 0,
        recurrenceInterval: 2,
        useCustomYears: false,
        customYears: [],
      },
    ];

    const result = computeLcpData(items, 3);
    expect(result.items).toHaveLength(3);

    const annualItem = result.items[0];
    const expectedAnnualPV =
      (1000 * Math.pow(1.02, 0)) / Math.pow(1.03, 0.5) +
      (1000 * Math.pow(1.02, 1)) / Math.pow(1.03, 1.5);
    expect(annualItem.totalPV).toBeCloseTo(expectedAnnualPV, 6);

    const oneTime = result.items[1];
    const expectedOneTimePV = 5000 / Math.pow(1.03, 0.5);
    expect(oneTime.totalPV).toBeCloseTo(expectedOneTimePV, 6);

    const recurring = result.items[2];
    const recurringPV =
      2000 / Math.pow(1.03, 0.5) + 2000 / Math.pow(1.03, 2.5);
    expect(recurring.totalPV).toBeCloseTo(recurringPV, 6);

    expect(result.totalPV).toBeCloseTo(annualItem.totalPV + oneTime.totalPV + recurring.totalPV, 6);
  });

  it("supports manual custom years and clamps start/end years", () => {
    const items = [
      {
        id: 10,
        categoryId: "therapy",
        name: "Custom year therapy",
        baseCost: 1000,
        freqType: "annual",
        duration: 5,
        startYear: 0, // should clamp to year 1
        endYear: 10, // extended range, but custom years drive inclusion
        cpi: 0,
        recurrenceInterval: 1,
        useCustomYears: true,
        customYears: [1, 3, 5],
      },
    ];

    const result = computeLcpData(items, 0);
    const item = result.items[0];
    expect(item.totalNom).toBe(3000);
    expect(item.totalPV).toBeCloseTo(3000, 6);
    expect(item.totalPV).toBeLessThan(result.totalNom + 1e-6);
    expect(result.totalPV).toBeCloseTo(3000, 6);
  });
});

describe("computeScenarioProjections", () => {
  const caseInfo: CaseInfo = {
    ...DEFAULT_CASE_INFO,
    dob: "1990-01-01",
    dateOfInjury: "2020-01-01",
    dateOfTrial: "2022-01-01",
    retirementAge: 67,
  };
  const earningsParams: EarningsParams = {
    ...DEFAULT_EARNINGS_PARAMS,
    baseEarnings: 100000,
    residualEarnings: 0,
    wle: 5,
    wageGrowth: 0,
    discountRate: 0,
    fringeRate: 0,
    unemploymentRate: 0,
    uiReplacementRate: 0,
    fedTaxRate: 0,
    stateTaxRate: 0,
    enablePJI: false,
  };
  const dateCalc = computeDateCalc(caseInfo);
  const ageAtInjury = computeAgeAtInjury(caseInfo);

  it("builds standard scenarios and rolls in household and LCP totals", () => {
    const projections = computeScenarioProjections({
      caseInfo,
      ageAtInjury,
      earningsParams,
      dateCalc,
      pastActuals: {},
      isUnionMode: false,
      hhServices: { ...DEFAULT_HH_SERVICES, active: true },
      hhsData: { totalNom: 0, totalPV: 5000 },
      lcpData: { totalNom: 0, totalPV: 2000, items: [] },
    });

    const ids = projections.map((p) => p.id);
    expect(ids).toEqual(["wle", "age65", "age67", "age70"]);

    const wle = projections.find((p) => p.id === "wle")!;
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;
    const countedPastYears = fullPast + (partialPast > 0 ? partialPast : 0);
    const expectedPastLoss = wle.wlf * earningsParams.baseEarnings * countedPastYears;
    const expectedFuturePV = wle.wlf * earningsParams.baseEarnings * Math.ceil(wle.yfs);
    const expectedGrandTotal = expectedPastLoss + expectedFuturePV + 5000 + 2000;

    expect(wle.wlf).toBeCloseTo(1);
    expect(wle.totalPastLoss).toBeCloseTo(expectedPastLoss, 6);
    expect(wle.totalFuturePV).toBeCloseTo(expectedFuturePV, 6);
    expect(wle.grandTotal).toBeCloseTo(expectedGrandTotal, 4);

    const age65 = projections.find((p) => p.id === "age65")!;
    expect(age65.grandTotal).toBeLessThan(wle.grandTotal);
    expect(age65.included).toBe(true);
  });

  it("includes a PJI scenario only when enabled", () => {
    const withPji = computeScenarioProjections({
      caseInfo,
      ageAtInjury,
      earningsParams: { ...earningsParams, enablePJI: true, pjiAge: 60 },
      dateCalc,
      pastActuals: {},
      isUnionMode: false,
      hhServices: { ...DEFAULT_HH_SERVICES, active: false },
      hhsData: { totalNom: 0, totalPV: 0 },
      lcpData: { totalNom: 0, totalPV: 0, items: [] },
    });

    expect(withPji.some((p) => p.id === "pji")).toBe(true);

    const withoutPji = computeScenarioProjections({
      caseInfo,
      ageAtInjury,
      earningsParams,
      dateCalc,
      pastActuals: {},
      isUnionMode: false,
      hhServices: { ...DEFAULT_HH_SERVICES, active: false },
      hhsData: { totalNom: 0, totalPV: 0 },
      lcpData: { totalNom: 0, totalPV: 0, items: [] },
    });

    expect(withoutPji.some((p) => p.id === "pji")).toBe(false);
  });
});

describe("computeGrandTotal", () => {
  it("sums projection, household, and LCP totals with activity check", () => {
    const total = computeGrandTotal(
      { pastSchedule: [], futureSchedule: [], totalPastLoss: 1000, totalFutureNominal: 0, totalFuturePV: 2000 },
      { ...DEFAULT_HH_SERVICES, active: true },
      { totalNom: 0, totalPV: 500 },
      { totalNom: 0, totalPV: 300, items: [] },
    );
    expect(total).toBe(3800);
  });
});
