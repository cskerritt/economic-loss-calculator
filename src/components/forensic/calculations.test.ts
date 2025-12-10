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
    // Combined tax: 20% + 5% = 25% (simple additive method per forensic economics standard)
    // WLF 0.8 × Unemp 0.965 × (1 - Tax 0.25) × Fringe 1.0 = 0.579
    expect(algebraic.fullMultiplier).toBeCloseTo(0.579, 5);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.75);
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
    // Combined tax: 20% + 5% = 25% (simple additive method)
    // WLF 0.8 × Unemp 0.965 × Fringe 1.2 = 0.9264, then subtract tax on base (0.772 × 0.25 = 0.193)
    // Result: 0.9264 - 0.193 = 0.7334
    expect(algebraic.fullMultiplier).toBeCloseTo(0.7334, 6);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.9);
    expect(algebraic.flatFringeAmount).toBe(20000);
  });
});

/**
 * Tinari Algebraic Method Tests
 * 
 * The Tinari formula is:
 * AIF = {[((GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL} × (1 - PC)
 * 
 * Step-by-step breakdown:
 * 1. Start with Gross Earnings (GE) = 100%
 * 2. × Work Life Factor (WLF) = Worklife-Adjusted Base
 * 3. × (1 - Unemployment Factor) = Unemployment-Adjusted Base
 * 4. × (1 + Fringe Benefits) = Gross Compensation with Fringes
 * 5. - Tax Liabilities (on base earnings only, NOT on fringe benefits)
 * 6. × (1 - Personal Consumption) = Adjusted Income Factor (AIF) [for wrongful death]
 * 
 * Key insight: Fringe benefits are NOT subject to income taxes (pre-tax benefits like 401k, health insurance)
 */
describe("computeAlgebraic - Tinari Method", () => {
  const dateCalc = { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 25 };

  it("implements Tinari formula: taxes apply only to base earnings, not fringe benefits", () => {
    // Example from Tinari paper (simplified)
    // GE = $100,000, WLF = 0.919, UF = 3.5%, FB = 21.5%, Tax = 12%
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 22.975, // Results in WLF = 0.919 when derivedYFS = 25
      fringeRate: 21.5,
      unemploymentRate: 3.5,
      uiReplacementRate: 50,
      fedTaxRate: 8,
      stateTaxRate: 4,
      isWrongfulDeath: false,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    
    // Step 1: WLF = WLE / YFS = 22.975 / 25 = 0.919
    expect(algebraic.wlf).toBeCloseTo(0.919, 3);
    
    // Step 2: Worklife-Adjusted Base = 100% × 0.919 = 91.9%
    expect(algebraic.worklifeAdjustedBase).toBeCloseTo(0.919, 3);
    
    // Step 3: Unemployment Factor = 3.5% × (1 - 50%) = 1.75%
    // Unemployment-Adjusted Base = 91.9% × (1 - 1.75%) = 90.29%
    const expectedUnempFactor = 0.035 * (1 - 0.5); // 1.75%
    expect(algebraic.unemploymentAdjustedBase).toBeCloseTo(0.919 * (1 - expectedUnempFactor), 4);
    
    // Step 4: Gross Compensation = Unemp-Adjusted × (1 + FB) = 90.29% × 1.215 = 109.70%
    expect(algebraic.fringeFactor).toBeCloseTo(1.215, 3);
    expect(algebraic.grossCompensationWithFringes).toBeCloseTo(
      algebraic.unemploymentAdjustedBase * 1.215, 4
    );
    
    // Step 5: Tax only on base (not fringe): Tax = Unemp-Adjusted × 12% = 90.29% × 0.12 = 10.83%
    expect(algebraic.taxOnBaseEarnings).toBeCloseTo(
      algebraic.unemploymentAdjustedBase * 0.12, 4
    );
    
    // Step 6: After-Tax = Gross Comp - Tax on Base = 109.70% - 10.83% = 98.87%
    expect(algebraic.afterTaxCompensation).toBeCloseTo(
      algebraic.grossCompensationWithFringes - algebraic.taxOnBaseEarnings, 4
    );
    
    // Final AIF (no personal consumption for personal injury)
    expect(algebraic.era1PersonalConsumptionFactor).toBe(0);
    expect(algebraic.fullMultiplier).toBeCloseTo(algebraic.afterTaxCompensation, 4);
  });

  it("applies personal consumption deduction for wrongful death cases", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 20,
      fringeRate: 20,
      unemploymentRate: 5,
      uiReplacementRate: 50,
      fedTaxRate: 15,
      stateTaxRate: 5,
      isWrongfulDeath: true,
      era1PersonalConsumption: 25, // 25% personal consumption
      era2PersonalConsumption: 20,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    
    // WLF = 20/25 = 0.8
    expect(algebraic.wlf).toBeCloseTo(0.8, 4);
    
    // Verify personal consumption factors are captured
    expect(algebraic.era1PersonalConsumptionFactor).toBeCloseTo(0.25, 4);
    expect(algebraic.era2PersonalConsumptionFactor).toBeCloseTo(0.20, 4);
    
    // AIF = AfterTax × (1 - PC)
    const afterTaxBeforePC = algebraic.afterTaxCompensation;
    expect(algebraic.era1AIF).toBeCloseTo(afterTaxBeforePC * (1 - 0.25), 4);
    expect(algebraic.era2AIF).toBeCloseTo(afterTaxBeforePC * (1 - 0.20), 4);
    
    // fullMultiplier should use era1AIF (primary)
    expect(algebraic.fullMultiplier).toBeCloseTo(algebraic.era1AIF, 4);
  });

  it("handles era-based wage growth with different rates", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 80000,
      wle: 20,
      useEraSplit: true,
      eraSplitYear: 2024,
      era1WageGrowth: 3,
      era2WageGrowth: 2,
      fringeRate: 15,
      unemploymentRate: 4,
      uiReplacementRate: 40,
      fedTaxRate: 12,
      stateTaxRate: 3,
      isWrongfulDeath: false,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    
    // Verify era-specific AIFs are calculated
    expect(algebraic.era1AIF).toBeDefined();
    expect(algebraic.era2AIF).toBeDefined();
    
    // Without personal consumption, era1AIF and era2AIF should be equal
    expect(algebraic.era1AIF).toBeCloseTo(algebraic.era2AIF, 4);
    expect(algebraic.era1AIF).toBeCloseTo(algebraic.afterTaxCompensation, 4);
  });

  it("calculates union mode with flat fringe amounts correctly", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 75000,
      wle: 18,
      fringeRate: 0, // ignored in union mode
      pension: 8000,
      healthWelfare: 12000,
      annuity: 5000,
      clothingAllowance: 500,
      otherBenefits: 1500,
      unemploymentRate: 4,
      uiReplacementRate: 45,
      fedTaxRate: 18,
      stateTaxRate: 6,
      isWrongfulDeath: false,
    };

    const algebraic = computeAlgebraic(params, dateCalc, true);
    
    // Total flat fringes = 8000 + 12000 + 5000 + 500 + 1500 = 27000
    expect(algebraic.flatFringeAmount).toBe(27000);
    
    // Fringe factor = (75000 + 27000) / 75000 = 1.36
    expect(algebraic.fringeFactor).toBeCloseTo(1.36, 4);
    
    // WLF = 18/25 = 0.72
    expect(algebraic.wlf).toBeCloseTo(0.72, 4);
  });

  it("handles zero values gracefully", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 50000,
      wle: 15,
      fringeRate: 0,
      unemploymentRate: 0,
      uiReplacementRate: 0,
      fedTaxRate: 0,
      stateTaxRate: 0,
      isWrongfulDeath: false,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    
    // WLF = 15/25 = 0.6
    expect(algebraic.wlf).toBeCloseTo(0.6, 4);
    
    // No unemployment, no tax, no fringe = 60% AIF
    expect(algebraic.unemploymentAdjustedBase).toBeCloseTo(0.6, 4);
    expect(algebraic.fringeFactor).toBe(1);
    expect(algebraic.grossCompensationWithFringes).toBeCloseTo(0.6, 4);
    expect(algebraic.taxOnBaseEarnings).toBe(0);
    expect(algebraic.afterTaxCompensation).toBeCloseTo(0.6, 4);
    expect(algebraic.fullMultiplier).toBeCloseTo(0.6, 4);
  });

  it("verifies tax is NOT applied to fringe benefits (Tinari key principle)", () => {
    // This test explicitly validates that taxes are only on base earnings
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 25, // WLF = 1.0 for simplicity
      fringeRate: 30, // 30% fringe benefits
      unemploymentRate: 0, // no unemployment for simplicity
      uiReplacementRate: 0,
      fedTaxRate: 20,
      stateTaxRate: 10, // 30% total tax
      isWrongfulDeath: false,
    };

    const algebraic = computeAlgebraic(params, { ...dateCalc, derivedYFS: 25 }, false);
    
    // WLF = 25/25 = 1.0
    expect(algebraic.wlf).toBeCloseTo(1.0, 4);
    
    // Unemployment-adjusted = 100% (no unemployment)
    expect(algebraic.unemploymentAdjustedBase).toBeCloseTo(1.0, 4);
    
    // Gross comp = 100% × 1.30 = 130%
    expect(algebraic.grossCompensationWithFringes).toBeCloseTo(1.30, 4);
    
    // Tax on base only = 100% × 30% = 30%
    expect(algebraic.taxOnBaseEarnings).toBeCloseTo(0.30, 4);
    
    // After-tax = 130% - 30% = 100%
    // (This shows fringes are preserved, taxes only hit the base)
    expect(algebraic.afterTaxCompensation).toBeCloseTo(1.00, 4);
    
    // If taxes were incorrectly applied to the full compensation (wrong method):
    // Wrong: 130% - (130% × 30%) = 130% - 39% = 91% ← INCORRECT
    // Correct (Tinari): 130% - (100% × 30%) = 130% - 30% = 100% ← CORRECT
  });

  it("calculates wrongful death with era split and different consumption rates", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 120000,
      wle: 20,
      useEraSplit: true,
      eraSplitYear: 2023,
      era1WageGrowth: 3,
      era2WageGrowth: 2.5,
      fringeRate: 18,
      unemploymentRate: 3,
      uiReplacementRate: 50,
      fedTaxRate: 22,
      stateTaxRate: 5,
      isWrongfulDeath: true,
      era1PersonalConsumption: 30,
      era2PersonalConsumption: 25,
    };

    const algebraic = computeAlgebraic(params, dateCalc, false);
    
    // WLF = 20/25 = 0.8
    expect(algebraic.wlf).toBeCloseTo(0.8, 4);
    
    // Personal consumption factors
    expect(algebraic.era1PersonalConsumptionFactor).toBeCloseTo(0.30, 4);
    expect(algebraic.era2PersonalConsumptionFactor).toBeCloseTo(0.25, 4);
    
    // Era 1 AIF < Era 2 AIF (higher consumption in era 1)
    expect(algebraic.era1AIF).toBeLessThan(algebraic.era2AIF);
    
    // Verify the relationship: era2AIF = afterTax × (1 - 0.25) vs era1AIF = afterTax × (1 - 0.30)
    const afterTax = algebraic.afterTaxCompensation;
    expect(algebraic.era1AIF).toBeCloseTo(afterTax * 0.70, 4);
    expect(algebraic.era2AIF).toBeCloseTo(afterTax * 0.75, 4);
  });

  it("respects enableFringeBenefits toggle when OFF", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 25,
      fringeRate: 30, // 30% fringe benefits (but should be ignored)
      unemploymentRate: 0,
      uiReplacementRate: 0,
      fedTaxRate: 20,
      stateTaxRate: 5,
      isWrongfulDeath: false,
      enableFringeBenefits: false, // TOGGLE OFF
    };

    const algebraic = computeAlgebraic(params, { ...dateCalc, derivedYFS: 25 }, false);
    
    // WLF = 25/25 = 1.0
    expect(algebraic.wlf).toBeCloseTo(1.0, 4);
    
    // Fringe factor should be 1.0 (no fringes applied)
    expect(algebraic.fringeFactor).toBeCloseTo(1.0, 4);
    
    // Gross compensation should equal unemployment-adjusted base (no fringe addition)
    expect(algebraic.grossCompensationWithFringes).toBeCloseTo(1.0, 4);
    
    // Tax on base = 100% × 25% = 25%
    expect(algebraic.taxOnBaseEarnings).toBeCloseTo(0.25, 4);
    
    // After-tax = 100% - 25% = 75%
    expect(algebraic.afterTaxCompensation).toBeCloseTo(0.75, 4);
  });

  it("respects enableFringeBenefits toggle when ON", () => {
    const params: EarningsParams = {
      ...DEFAULT_EARNINGS_PARAMS,
      baseEarnings: 100000,
      wle: 25,
      fringeRate: 30, // 30% fringe benefits
      unemploymentRate: 0,
      uiReplacementRate: 0,
      fedTaxRate: 20,
      stateTaxRate: 5,
      isWrongfulDeath: false,
      enableFringeBenefits: true, // TOGGLE ON
    };

    const algebraic = computeAlgebraic(params, { ...dateCalc, derivedYFS: 25 }, false);
    
    // Fringe factor should be 1.30 (30% fringes applied)
    expect(algebraic.fringeFactor).toBeCloseTo(1.30, 4);
    
    // Gross compensation = 100% × 1.30 = 130%
    expect(algebraic.grossCompensationWithFringes).toBeCloseTo(1.30, 4);
    
    // Tax on base only = 100% × 25% = 25%
    expect(algebraic.taxOnBaseEarnings).toBeCloseTo(0.25, 4);
    
    // After-tax = 130% - 25% = 105%
    expect(algebraic.afterTaxCompensation).toBeCloseTo(1.05, 4);
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
    // Combined tax: 10% + 5% = 15% (simple additive method)
    // WLF 1.5 × Unemp 0.975 × Fringe 1.1 = 1.61438, then subtract tax on base (1.4625 × 0.15 = 0.219375)
    // Result: 1.61438 - 0.219375 = 1.389375
    expect(algebraic.fullMultiplier).toBeCloseTo(1.389375, 6);
    expect(algebraic.realizedMultiplier).toBeCloseTo(0.935, 4);
    const projection = computeProjection(caseInfo, earningsParams, algebraic, { 2021: "15000" }, dateCalc);

    expect(projection.pastSchedule).toHaveLength(3);
    const manualRow = projection.pastSchedule.find((row) => row.year === 2021);
    expect(manualRow?.isManual).toBe(true);
    expect(projection.pastSchedule[2].fraction).toBeCloseTo(0.5);
    // With simple additive tax (15%), AIF = 1.389375, realized = 0.935
    // Year 0: (100000 - 25000) × 1.389375 = 104203.125
    // Year 1: 102000 × 1.389375 - 15000 × 0.935 = 127691.25 (manual actual)
    // Year 2: (52020 - 13005) × 1.389375 = 54206.465625
    // Total: 286100.84
    expect(projection.totalPastLoss).toBeCloseTo(286100.84, 2);

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

  it("respects enablePresentValue=false (no discounting)", () => {
    const result = computeHhsData(
      { ...DEFAULT_HH_SERVICES, active: true, hoursPerWeek: 10, hourlyRate: 20, growthRate: 3, discountRate: 5 },
      2,
      false, // Present value disabled
    );

    // Nominal values should be the same
    expect(result.totalNom).toBeCloseTo(21112);
    
    // PV should equal nominal (no discounting applied)
    expect(result.totalPV).toBeCloseTo(result.totalNom, 6);
  });

  it("respects enablePresentValue=true (with discounting)", () => {
    const result = computeHhsData(
      { ...DEFAULT_HH_SERVICES, active: true, hoursPerWeek: 10, hourlyRate: 20, growthRate: 3, discountRate: 5 },
      2,
      true, // Present value enabled
    );

    // PV should be less than nominal due to discounting
    expect(result.totalPV).toBeLessThan(result.totalNom);
    
    // Verify the discount is applied correctly
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

  it("respects enablePresentValue=false (no discounting for LCP)", () => {
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
    ];

    const result = computeLcpData(items, 5, false); // PV disabled
    
    // PV should equal nominal (no discounting)
    expect(result.totalPV).toBeCloseTo(result.totalNom, 6);
    expect(result.items[0].totalPV).toBeCloseTo(result.items[0].totalNom, 6);
  });

  it("respects enablePresentValue=true (with discounting for LCP)", () => {
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
    ];

    const result = computeLcpData(items, 5, true); // PV enabled
    
    // PV should be less than nominal due to discounting
    expect(result.totalPV).toBeLessThan(result.totalNom);
    
    // Verify the discount calculation
    const expectedPV =
      (1000 * Math.pow(1.02, 0)) / Math.pow(1.05, 0.5) +
      (1000 * Math.pow(1.02, 1)) / Math.pow(1.05, 1.5);
    expect(result.totalPV).toBeCloseTo(expectedPV, 6);
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
