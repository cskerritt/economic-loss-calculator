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

/**
 * Milliseconds per year constant (accounting for leap years)
 * 365.25 days accounts for the average across leap year cycles
 */
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

/**
 * Parse date from MM/DD/YYYY format (or fallback to ISO format for backwards compatibility)
 * 
 * @param dateStr - Date string in MM/DD/YYYY or YYYY-MM-DD format
 * @returns Date object or invalid date if parsing fails
 * 
 * Example: parseDate("3/15/2020") → Date object for March 15, 2020
 */
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

/**
 * Compute all date-based calculations for the case
 * 
 * Calculates:
 * - Age at injury: How old the plaintiff was when injured
 * - Age at trial: How old at the trial/valuation date
 * - Current age: How old today
 * - Past years: Time elapsed from injury to trial (for past loss calculations)
 * - Derived YFS: Years to Final Separation from injury to retirement
 * 
 * Years to Final Separation (YFS) Definition:
 * YFS is the chronological time from the date of injury until the expected retirement age.
 * Unlike WLE (which is probability-weighted), YFS represents the full remaining career
 * horizon assuming continuous labor force participation.
 * 
 * Per Tinari (2016): "YFS yields a higher number than WLE because it includes all years
 * until the expected retirement date, regardless of short-term unemployment."
 * 
 * @param caseInfo - Case information containing dates
 * @param today - Current date (defaults to now, can be overridden for testing)
 * @returns DateCalc object with all computed age and time values
 * 
 * Example:
 *   DOB: 1/15/1985, DOI: 3/10/2020, DOT: 6/15/2023, Retirement Age: 67
 *   Age at injury: 35.2
 *   YFS = 67 - 35.2 = 31.8 years (from injury to retirement)
 *   Past years = 3.3 (injury to trial)
 *   Future years = YFS - Past years = 28.5 years
 */
export function computeDateCalc(caseInfo: CaseInfo, today: Date = new Date()): DateCalc {
  if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) {
    return { ageInjury: "0", ageTrial: "0", currentAge: "0", pastYears: 0, derivedYFS: 0 };
  }

  const dob = parseDate(caseInfo.dob);
  const doi = parseDate(caseInfo.dateOfInjury);
  const dot = parseDate(caseInfo.dateOfTrial);

  // Calculate age at any date by converting milliseconds to years
  const getAge = (d: Date) => (d.getTime() - dob.getTime()) / MS_PER_YEAR;
  
  // Age at injury (used for YFS calculation)
  const ageAtInjury = getAge(doi);
  
  // Past years = time from injury to trial (can include partial years)
  const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / MS_PER_YEAR);

  // Years to Final Separation (YFS) = retirement age minus age at injury
  // This represents the full career horizon from injury to expected retirement
  // Per Tinari method: YFS is chronological years, not probability-weighted
  const derivedYFS = Math.max(0, caseInfo.retirementAge - ageAtInjury);

  return {
    ageInjury: ageAtInjury.toFixed(1),
    ageTrial: getAge(dot).toFixed(1),
    currentAge: getAge(today).toFixed(1),
    pastYears,
    derivedYFS,
  };
}

/**
 * Compute the Work Life Factor (WLF)
 * 
 * Work Life Expectancy (WLE) vs Years to Final Separation (YFS):
 * 
 * WLE (Work Life Expectancy):
 * - Probability-weighted expected years of labor force participation
 * - Derived from Markov worklife tables (Skoog, Ciecka, & Krueger, 2010)
 * - Accounts for mortality, disability, unemployment, and retirement probabilities
 * - Represents EXPECTED working years, not chronological time
 * 
 * YFS (Years to Final Separation):
 * - Chronological years from injury to expected retirement age
 * - Represents the full remaining career horizon
 * - YFS > WLE because it doesn't weight for labor force exits
 * 
 * Formula: WLF = WLE / YFS
 * 
 * The WLF adjusts gross earnings to reflect the statistical probability of
 * actual labor force participation over the remaining career.
 * 
 * @param earningsParams - Parameters including work life expectancy (WLE)
 * @param derivedYFS - Years to Final Separation (from injury to retirement)
 * @returns Work Life Factor as a percentage (e.g., 87.4 means 87.4%)
 * 
 * Example:
 *   WLE = 25 years (from Skoog-Ciecka actuarial tables)
 *   YFS = 31.8 years (from age 35.2 at injury to retirement at 67)
 *   WLF = (25 / 31.8) × 100 = 78.62%
 *   
 *   Interpretation: Plaintiff would have worked 78.62% of the chronological
 *   years remaining, with 21.38% lost to unemployment, disability, or early exit.
 * 
 * References:
 *   Skoog, G.R., Ciecka, J.E., & Krueger, K.V. (2010). The Markov model of labor force activity.
 *   Tinari, F.D. (2016). Worklife expectancy and retirement assumptions in forensic economic analysis.
 */
export function computeWorkLifeFactor(earningsParams: EarningsParams, derivedYFS: number): number {
  if (derivedYFS <= 0) return 0;
  return (earningsParams.wle / derivedYFS) * 100;
}

/**
 * Tinari Algebraic Method Implementation
 * 
 * The Tinari Method is a widely accepted forensic economics approach for calculating the
 * Adjusted Income Factor (AIF), which converts gross earnings into compensable net loss.
 * 
 * Complete Formula:
 * AIF = {[((GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL} × (1 - PC)
 * 
 * Where:
 * - GE = Gross Earnings (100% or $1.00)
 * - WLF = Work Life Factor (as decimal, e.g., 0.8741)
 * - UF = Unemployment Factor = UR × (1 - UI Replacement Rate)
 * - FB = Fringe Benefits Rate (as decimal, e.g., 0.215 for 21.5%)
 * - TL = Tax Liability (combined federal & state)
 * - PC = Personal Consumption (wrongful death only, e.g., 0.25 for 25%)
 * 
 * Key Insight (Tinari's Innovation):
 * Fringe benefits are added AFTER unemployment adjustment, but taxes are ONLY applied
 * to the BASE EARNINGS portion (not on fringe benefits). This is because most fringe
 * benefits (health insurance, pension, etc.) are pre-tax or tax-advantaged.
 * 
 * Sequential Steps:
 * 1. Start with 100% of Gross Earnings (GE)
 * 2. Multiply by Work Life Factor → Worklife-Adjusted Base
 * 3. Multiply by (1 - Unemployment Factor) → Unemployment-Adjusted Base
 * 4. Multiply by (1 + Fringe Benefits) → Gross Compensation with Fringes
 * 5. Subtract Tax Liability (computed on base earnings only, NOT fringes)
 * 6. Multiply by (1 - Personal Consumption) → Final AIF [wrongful death only]
 * 
 * Example Calculation:
 *   WLF = 0.8741, UF = 0.0252, FB = 0.215, Fed Tax = 15%, State Tax = 4.5%
 *   
 *   Step 1: Base = 1.0000
 *   Step 2: Worklife = 1.0000 × 0.8741 = 0.8741
 *   Step 3: Unemployment = 0.8741 × 0.9748 = 0.8521
 *   Step 4: With Fringes = 0.8521 × 1.215 = 1.0353
 *   Step 5: Combined Tax = 0.15 + 0.045 = 0.195 (simple additive method)
 *            Tax on Base = 0.8521 × 0.195 = 0.1662
 *            After Tax = 1.0353 - 0.1662 = 0.8691
 *   
 *   Result: For every $1 of gross earnings lost, compensable loss is $0.8691
 * 
 * @param earningsParams - All earnings-related parameters
 * @param dateCalc - Date calculations including YFS
 * @param isUnionMode - If true, use flat-dollar fringe amounts instead of percentage
 * @returns Algebraic object with all intermediate values and final AIF
 */
export function computeAlgebraic(
  earningsParams: EarningsParams,
  dateCalc: DateCalc,
  isUnionMode: boolean,
): Algebraic {
  // Step 1 & 2: Calculate Work Life Factor (WLF)
  // WLF = WLE / YFS (as decimal, not percentage)
  const yfs = dateCalc.derivedYFS;
  const wlf = yfs > 0 ? earningsParams.wle / yfs : 0;
  
  // Step 3: Calculate Unemployment Factor
  // Formula: (1 - UF) where UF = Unemployment Rate × (1 - UI Replacement Rate)
  // Example: 4.2% unemployment × (1 - 40% replacement) = 2.52% net unemployment loss
  // Result: 1 - 0.0252 = 0.9748 (97.48% of earnings retained after unemployment)
  const unempFactor =
    1 - (earningsParams.unemploymentRate / 100) * (1 - earningsParams.uiReplacementRate / 100);
  
  // Step 5a: Calculate Combined Tax Rate for base earnings
  // Forensic economics standard: Use simple additive method for combined taxes
  // Formula: Combined Tax Rate = Federal Tax Rate + State Tax Rate
  // Example: 15% federal + 4.5% state = 19.5% combined
  // Note: This is the standard approach in forensic economics, treating taxes as additive
  const combinedTaxRate = (earningsParams.fedTaxRate + earningsParams.stateTaxRate) / 100;
  const afterTaxFactor = 1 - combinedTaxRate;

  // Step 4: Calculate Fringe Benefits Factor (1 + FB)
  // Two modes: Union mode uses flat dollar amounts, standard mode uses percentage
  // Can be disabled via enableFringeBenefits toggle per Tinari methodology option
  let fringeFactor = 1;
  let flatFringeAmount = 0;

  if (earningsParams.enableFringeBenefits) {
    if (isUnionMode) {
      // Union Mode: Flat dollar fringe benefits (common in union contracts)
      // Example: Pension $5,000 + Health $8,000 + Other $2,000 = $15,000 total
      // If base earnings = $75,000, effective rate = $15,000 / $75,000 = 20%
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
      // Standard Mode: Percentage-based fringe benefits
      // Example: 21.5% fringe rate → fringeFactor = 1.215
      fringeFactor = 1 + earningsParams.fringeRate / 100;
    }
  }
  // If fringe benefits disabled, fringeFactor remains 1 (no adjustment)

  // Step 6: Personal Consumption Factors (for wrongful death cases only)
  // Stores the actual consumption rate (e.g., 0.25 for 25% consumption)
  // For personal injury cases, consumption factor is 0 (no consumption applies)
  // For wrongful death cases, stores the rate (e.g., 0.25 means 25% consumed by decedent)
  // When applying: AIF = afterTaxCompensation × (1 - personalConsumptionFactor)
  // Example: 25% personal consumption → factor = 0.25, then apply (1 - 0.25) = 0.75 to get survivors' share
  const era1PersonalConsumptionFactor = earningsParams.isWrongfulDeath 
    ? (earningsParams.era1PersonalConsumption / 100) 
    : 0;
  const era2PersonalConsumptionFactor = earningsParams.isWrongfulDeath 
    ? (earningsParams.era2PersonalConsumption / 100) 
    : 0;

  // === TINARI METHOD STEP-BY-STEP CALCULATION ===
  // All values expressed as multipliers of gross earnings (treat GE as 1.00 or 100%)
  
  // Step 1-2: Worklife-Adjusted Base
  // Apply work life factor to account for time actually worked
  // Example: 100% × 0.8741 WLF = 87.41% (worked years only)
  const worklifeAdjustedBase = wlf; // 100% × WLF
  
  // Step 3: Unemployment-Adjusted Base
  // Apply unemployment factor to account for job search periods
  // Example: 87.41% × 0.9748 = 85.21% (after unemployment losses)
  // Note: Intermediate calculations may show slight variations due to decimal precision
  // Actual: 0.8741 × 0.9748 = 0.8521017... ≈ 0.8521
  const unemploymentAdjustedBase = worklifeAdjustedBase * unempFactor; // × (1 - UF)
  
  // Step 4: Gross Compensation with Fringe Benefits
  // Add fringe benefits (health insurance, pension, etc.)
  // Example: 85.21% × 1.215 = 103.53% (gross compensation including fringes)
  const grossCompensationWithFringes = unemploymentAdjustedBase * fringeFactor; // × (1 + FB)
  
  // Step 5: Tax Liability Calculation (CRITICAL STEP)
  // Taxes are computed on the BASE EARNINGS portion ONLY, not on fringe benefits
  // This is the key innovation of the Tinari method - fringes are often pre-tax
  // Example: 85.21% × 18.82% tax rate = 16.04% tax liability
  const taxOnBaseEarnings = unemploymentAdjustedBase * combinedTaxRate;
  
  // After-Tax Compensation (before personal consumption)
  // Subtract tax liability from gross compensation with fringes
  // Example: 103.53% - 16.04% = 87.49% (after-tax compensation)
  // This is the base AIF for personal injury cases
  const afterTaxCompensation = grossCompensationWithFringes - taxOnBaseEarnings;

  // Step 6: Era-Specific AIFs (with personal consumption for wrongful death)
  // For Personal Injury: AIF = afterTaxCompensation (no personal consumption, factor = 0)
  // For Wrongful Death: AIF = afterTaxCompensation × (1 - PC rate)
  // Example WD: 87.49% × (1 - 0.25) = 87.49% × 0.75 = 65.62%
  const era1AIF = afterTaxCompensation * (1 - era1PersonalConsumptionFactor);
  const era2AIF = afterTaxCompensation * (1 - era2PersonalConsumptionFactor);

  // Legacy full multiplier (for backward compatibility)
  // For personal injury: fullMultiplier = afterTaxCompensation
  // For wrongful death: fullMultiplier = era1AIF (with personal consumption applied)
  const fullMultiplier = earningsParams.isWrongfulDeath ? era1AIF : afterTaxCompensation;
  
  // Realized multiplier for actual/residual earnings
  // Used for manual actual earnings in past schedule calculations
  // This is a simplified calculation that applies after-tax factor and fringes
  // but doesn't include worklife or unemployment adjustments (those are inherent in actual earnings)
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
    // Step-by-step breakdown for transparency and reporting
    worklifeAdjustedBase,
    unemploymentAdjustedBase,
    grossCompensationWithFringes,
    taxOnBaseEarnings,
    afterTaxCompensation,
  };
}

/**
 * Compute earnings loss projections for past and future periods
 * 
 * This function calculates the year-by-year economic losses from the date of injury
 * through retirement, accounting for:
 * - Past losses: Injury to trial (historical, not discounted)
 * - Future losses: Trial to retirement (projected, discounted to present value)
 * - Wage growth over time
 * - Residual earning capacity (what plaintiff can still earn)
 * - Actual earnings if recorded (for past years)
 * - Era-specific wage growth (if enabled)
 * 
 * Formula for each year:
 *   Gross But-For = Base Earnings × (1 + Growth Rate)^years × Year Fraction
 *   Net But-For = Gross But-For × AIF
 *   Net Actual = Actual or Residual Earnings × AIF
 *   Net Loss = Net But-For - Net Actual
 *   
 *   For future years: PV = Net Loss × [1 / (1 + Discount Rate)^(year + 0.5)]
 * 
 * @param caseInfo - Case information including dates
 * @param earningsParams - Earnings parameters including base, residual, growth, discount
 * @param algebraic - Computed algebraic values including AIF
 * @param pastActuals - Dictionary of actual earnings for past years {year: amount}
 * @param dateCalc - Date calculations including past years and YFS
 * @returns Projection object with past schedule, future schedule, and totals
 * 
 * Example:
 *   Base: $75,000, Residual: $30,000, Growth: 3.5%, Discount: 4.25%, AIF: 0.8749
 *   Year 1 Past: $75,000 × 0.8749 - $30,000 × 0.8749 = $39,371 loss
 *   Year 1 Future: Same loss, but PV = $39,371 × 0.9793 = $38,556
 */
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
    // Apply discount factor only if present value is enabled
    const discount = earningsParams.enablePresentValue 
      ? 1 / Math.pow(1 + earningsParams.discountRate / 100, i + 0.5)
      : 1; // No discounting if PV disabled
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

/**
 * Compute household services replacement value
 * 
 * Calculates the present value of household services that the injured party can no
 * longer perform. Common examples include:
 * - Childcare and supervision
 * - Home maintenance and repairs
 * - Meal preparation
 * - Shopping and errands
 * - Transportation services
 * - Yard work
 * 
 * Formula for each year:
 *   Annual Value = Hours/Week × 52 weeks × Hourly Rate × (1 + Growth Rate)^year
 *   PV = Annual Value × [1 / (1 + Discount Rate)^(year + 0.5)] (if PV enabled)
 * 
 * @param hhServices - Household service parameters (hours, rate, growth, discount)
 * @param derivedYFS - Years to final separation (duration of services needed)
 * @param enablePresentValue - Whether to apply present value discounting
 * @returns HhsData with nominal total and present value
 * 
 * Example:
 *   15 hrs/week × $25/hr × 52 weeks = $19,500/year
 *   Year 1: $19,500 × 1.03^0 × discount = $19,096 PV (if PV enabled)
 *   Year 2: $19,500 × 1.03^1 × discount = $18,870 PV (if PV enabled)
 *   Total over 28.6 years ≈ $423,000 PV
 */
export function computeHhsData(hhServices: HhServices, derivedYFS: number, enablePresentValue: boolean = true): HhsData {
  if (!hhServices.active) return { totalNom: 0, totalPV: 0 };

  let totalNom = 0;
  let totalPV = 0;
  const years = Math.ceil(derivedYFS);

  // Calculate value for each future year
  for (let i = 0; i < years; i++) {
    // Annual cost with inflation growth
    // Formula: Hours × Weeks × Rate × (1 + Growth)^years
    const annualValue =
      hhServices.hoursPerWeek *
      52 *
      hhServices.hourlyRate *
      Math.pow(1 + hhServices.growthRate / 100, i);
    
    // Discount to present value using mid-year convention (if enabled)
    // Formula: 1 / (1 + discount rate)^(year + 0.5)
    const disc = enablePresentValue 
      ? 1 / Math.pow(1 + hhServices.discountRate / 100, i + 0.5)
      : 1; // No discounting if PV disabled
    
    totalNom += annualValue;
    totalPV += annualValue * disc;
  }

  return { totalNom, totalPV };
}

/**
 * Compute life care plan present values
 * 
 * Calculates the present value of all future medical and care expenses from a life care
 * plan. Handles different types of expenses:
 * 
 * - One-time items: Occur once at a specific year (e.g., home modification)
 * - Annual items: Occur every year (e.g., medications)
 * - Recurring items: Occur at intervals (e.g., wheelchair replacement every 5 years)
 * - Custom year items: Occur in specific years only (e.g., surgeries in years 1, 5, 10)
 * 
 * Each item inflates using category-specific CPI rates:
 * - Physician Evals & Home Care: 2.88%
 * - Prescription Drugs: 1.65%
 * - Hospital/Surgical Services: 4.07%
 * - Therapy: 1.62%
 * - Transportation: 4.32%
 * - Home Modifications: 4.16%
 * - Education/Training: 2.61%
 * 
 * Formula:
 *   For each applicable year t:
 *     Year Index = (Start Year - 1) + t
 *     Inflated Cost = Base Cost × (1 + CPI Rate)^(Year Index)
 *     Discount = 1 / (1 + Discount Rate)^(Year Index + 0.5)
 *     PV = Inflated Cost × Discount
 * 
 * @param lcpItems - Array of life care plan items
 * @param discountRate - Discount rate for present value calculation
 * @returns LcpData with itemized details, totals in nominal and present values
 * 
 * Example:
 *   Pain Meds: $2,400/year, 1.65% CPI, 30 years
 *   Year 1: $2,400 × 1.0165^0 × 1/1.04225^0.5 = $2,350 PV
 *   Year 2: $2,440 × 1.0165^1 × 1/1.04225^1.5 = $2,292 PV
 *   Total over 30 years ≈ $51,800 PV
 */
export function computeLcpData(lcpItems: LcpItem[], discountRate: number, enablePresentValue: boolean = true): LcpData {
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
        // Apply discount factor only if present value is enabled
        const discount = enablePresentValue 
          ? 1 / Math.pow(1 + discountRate / 100, t + 0.5)
          : 1; // No discounting if PV disabled
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
          // Apply discount factor only if present value is enabled
          const discount = enablePresentValue 
            ? 1 / Math.pow(1 + discountRate / 100, absoluteYearIndex + 0.5)
            : 1; // No discounting if PV disabled
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
    const combinedTaxRate = (earningsParams.fedTaxRate + earningsParams.stateTaxRate) / 100;
    const afterTaxFactor = 1 - combinedTaxRate;
    
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
    const era1PC = earningsParams.isWrongfulDeath ? (earningsParams.era1PersonalConsumption / 100) : 0;
    const era2PC = earningsParams.isWrongfulDeath ? (earningsParams.era2PersonalConsumption / 100) : 0;
    
    const era1AIF = afterTaxCompensation * (1 - era1PC);
    const era2AIF = afterTaxCompensation * (1 - era2PC);
    
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
  const combinedTaxRate = (earningsParams.fedTaxRate + earningsParams.stateTaxRate) / 100;

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

  // Apply Tinari method: taxes only on base, not on fringes
  const unemploymentAdjustedBase = wlf * unempFactor;
  const grossCompensationWithFringes = unemploymentAdjustedBase * fringeFactor;
  const taxOnBaseEarnings = unemploymentAdjustedBase * combinedTaxRate;
  const afterTaxCompensation = grossCompensationWithFringes - taxOnBaseEarnings;
  
  // Apply personal consumption for wrongful death cases
  const personalConsumptionFactor = earningsParams.isWrongfulDeath 
    ? (earningsParams.era2PersonalConsumption / 100)  // Use era2 for future projections
    : 0;
  const fullMultiplier = afterTaxCompensation * (1 - personalConsumptionFactor);
  
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
