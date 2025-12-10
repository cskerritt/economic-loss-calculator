# Economic Loss Calculator - Calculation Methods Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Date and Age Calculations](#date-and-age-calculations)
4. [Work Life Factor (WLF)](#work-life-factor-wlf)
5. [Tinari Algebraic Method](#tinari-algebraic-method)
6. [Earnings Loss Projections](#earnings-loss-projections)
7. [Household Services](#household-services)
8. [Life Care Plan](#life-care-plan)
9. [Scenario Analysis](#scenario-analysis)
10. [Present Value Discounting](#present-value-discounting)
11. [Era-Based Calculations](#era-based-calculations)
12. [Wrongful Death Adjustments](#wrongful-death-adjustments)
13. [Summary Calculations](#summary-calculations)

---

## Overview

This software is a **Forensic Economic Loss Calculator** designed for calculating economic damages in personal injury and wrongful death litigation cases. It follows established forensic economics methodologies, particularly the **Tinari Algebraic Method**, which is widely accepted in legal proceedings.

The calculator computes:
- **Lost Earning Capacity** (past and future)
- **Household Services** replacement value
- **Life Care Plan** present values
- **Multiple retirement scenarios** for sensitivity analysis

All calculations follow standards from the National Association of Forensic Economics (NAFE) and the American Rehabilitation Economics Association (AREA).

---

## Core Concepts

### Key Terms

- **Plaintiff**: The injured party whose economic losses are being calculated
- **Date of Injury (DOI)**: When the injury occurred
- **Date of Trial (DOT)**: The valuation date (often trial date or settlement date)
- **Work Life Expectancy (WLE)**: Expected years of work remaining for the plaintiff
- **Years to Final Separation (YFS)**: Years from trial date to expected retirement
- **Present Value (PV)**: Future money discounted to today's dollars
- **Adjusted Earnings Factor (AEF)**: Multiplier accounting for employment, taxes, and benefits

---

## Date and Age Calculations

### Purpose
Calculate the plaintiff's age at various key dates to determine time periods for loss calculations.

### Formula

```typescript
Age = (Date - Date of Birth) / 365.25 days
```

### Calculations Performed

1. **Age at Injury**
   - `ageInjury = (DOI - DOB) / 365.25`

2. **Age at Trial**
   - `ageTrial = (DOT - DOB) / 365.25`

3. **Current Age**
   - `currentAge = (Today - DOB) / 365.25`

4. **Past Years** (injury to trial)
   - `pastYears = (DOT - DOI) / 365.25`

5. **Years to Final Separation (YFS)**
   - `derivedYFS = (Retirement Date - DOT) / 365.25`
   - Where: `Retirement Date = DOB + (Retirement Age × 365.25)`

### Example

```
DOB: January 15, 1985
DOI: March 10, 2020
DOT: June 15, 2023
Retirement Age: 67

ageInjury = 35.2 years
ageTrial = 38.4 years
pastYears = 3.3 years
derivedYFS = 28.6 years (from age 38.4 to 67)
```

---

## Work Life Factor (WLF)

### Purpose
The Work Life Factor represents the percentage of remaining years to retirement that the plaintiff would have actually worked, accounting for periods of unemployment, disability, retirement, etc.

### Formula

```
WLF = (WLE / YFS) × 100%
```

Where:
- **WLE** = Work Life Expectancy (years the person would actually work)
- **YFS** = Years to Final Separation (years from trial to retirement age)

### Sources for WLE
- Skoog-Ciecka Work Life Expectancy Tables (2017)
- Gamboa/Millimet tables
- Custom calculations based on employment history

### Example

```
WLE: 25 years (from actuarial tables)
YFS: 28.6 years (from age 38.4 to 67)

WLF = (25 / 28.6) × 100% = 87.41%
```

This means the plaintiff would have worked 87.41% of the remaining years, with 12.59% lost to unemployment, disability, or early retirement.

---

## Tinari Algebraic Method

### Purpose
The Tinari Algebraic Method is the **core calculation methodology** used to compute the Adjusted Income Factor (AIF), which converts gross earnings into net compensable economic loss.

### Key Insight
Fringe benefits are added AFTER unemployment adjustment, but taxes are only applied to BASE EARNINGS (not fringe benefits, which are typically pre-tax or tax-advantaged).

### Step-by-Step Formula

The Tinari method follows these sequential steps:

#### Step 1: Start with Gross Earnings
```
Base = 100% of Gross Earnings (GE)
```

#### Step 2: Apply Work Life Factor
```
Worklife Adjusted Base = Base × WLF
```

#### Step 3: Apply Unemployment Factor
```
Unemployment Adjusted Base = Worklife Adjusted Base × (1 - UF)

Where: UF = Unemployment Rate × (1 - UI Replacement Rate)
```

The unemployment factor accounts for:
- Periods of unemployment (e.g., 4.2%)
- Partial income replacement from unemployment insurance (e.g., 40%)
- Net unemployment loss = 4.2% × (1 - 0.40) = 2.52%

#### Step 4: Add Fringe Benefits
```
Gross Compensation with Fringes = Unemployment Adjusted Base × (1 + FB)

Where: FB = Fringe Benefit Rate (as decimal)
```

Examples of fringe benefits:
- Health insurance
- Pension contributions
- 401(k) matching
- Paid time off
- Life insurance

#### Step 5: Calculate Tax Liability (on Base Earnings Only)
```
Tax on Base Earnings = Unemployment Adjusted Base × Combined Tax Rate

Combined Tax Rate = 1 - [(1 - Federal Tax Rate) × (1 - State Tax Rate)]
```

**Critical**: Taxes are computed on the unemployment-adjusted base earnings, NOT on fringe benefits.

#### Step 6: Calculate After-Tax Compensation
```
After-Tax Compensation = Gross Compensation with Fringes - Tax on Base Earnings
```

This is the **Adjusted Income Factor (AIF)** for personal injury cases.

#### Step 7: Personal Consumption (Wrongful Death Only)
```
AIF = After-Tax Compensation × (1 - Personal Consumption Rate)
```

Personal consumption represents the portion of income the decedent would have spent on themselves, which is not a loss to survivors.

### Complete Formula

```
AIF = {[(GE × WLF) × (1 - UF)] × (1 + FB) - [(GE × WLF) × (1 - UF)] × TL} × (1 - PC)
```

Where:
- **GE** = Gross Earnings
- **WLF** = Work Life Factor (decimal)
- **UF** = Unemployment Factor = UR × (1 - UI_RR)
- **FB** = Fringe Benefits (decimal)
- **TL** = Tax Liability (combined federal & state)
- **PC** = Personal Consumption (wrongful death only)

### Detailed Example

**Inputs:**
- Gross Earnings: $75,000/year
- WLE: 25 years
- YFS: 28.6 years
- Unemployment Rate: 4.2%
- UI Replacement: 40%
- Fringe Benefits: 21.5%
- Federal Tax: 15%
- State Tax: 4.5%

**Calculations:**

1. **WLF** = 25 / 28.6 = 0.8741 (87.41%)

2. **Unemployment Factor**
   - UF = 0.042 × (1 - 0.40) = 0.0252 (2.52%)
   - Unemployment Adjusted = 1 - 0.0252 = 0.9748

3. **Worklife & Unemployment Adjusted Base**
   - Base = 0.8741 × 0.9748 = 0.8521 (85.21%)

4. **Gross Compensation with Fringes**
   - With Fringes = 0.8521 × 1.215 = 1.0353 (103.53%)

5. **Combined Tax Rate**
   - Combined = 1 - [(1 - 0.15) × (1 - 0.045)]
   - Combined = 1 - [0.85 × 0.955]
   - Combined = 1 - 0.8118 = 0.1882 (18.82%)

6. **Tax on Base Earnings**
   - Tax = 0.8521 × 0.1882 = 0.1604 (16.04%)

7. **After-Tax Compensation (AIF)**
   - AIF = 1.0353 - 0.1604 = 0.8749 (87.49%)

**Result:** For every $1 of gross earnings lost, the compensable loss is $0.8749.

For $75,000 annual earnings:
- Annual Net Loss = $75,000 × 0.8749 = $65,618

---

## Earnings Loss Projections

### Overview
Earnings projections calculate the economic loss for both past losses (injury to trial) and future losses (trial to retirement).

### Past Earnings Losses

Past losses are calculated for each year from the date of injury to the date of trial.

#### Formula for Past Years

```
For each past year i:
  Growth Factor = (1 + Wage Growth Rate)^i
  Gross But-For Earnings = Base Earnings × Growth Factor × Year Fraction
  Net But-For = Gross But-For × AIF
  
  If Actual Earnings Recorded:
    Net Actual = Actual Earnings × Realized Multiplier
  Else:
    Gross Actual = Residual Earnings × Growth Factor × Year Fraction
    Net Actual = Gross Actual × AIF
  
  Net Loss = Net But-For - Net Actual
  
  Total Past Loss = Sum of all Net Loss values
```

**Year Fraction**: Accounts for partial years (e.g., if injury occurred mid-year).

#### Example - Past Losses

```
Base Earnings: $75,000
Residual Earnings: $30,000 (reduced capacity)
Wage Growth: 3.5%/year
AIF: 0.8749
Past Years: 3.3 years

Year 1 (2020, full year):
  Gross But-For = $75,000 × 1.035^0 × 1.0 = $75,000
  Net But-For = $75,000 × 0.8749 = $65,618
  Net Actual = $30,000 × 0.8749 = $26,247
  Net Loss = $65,618 - $26,247 = $39,371

Year 2 (2021, full year):
  Gross But-For = $75,000 × 1.035^1 = $77,625
  Net But-For = $77,625 × 0.8749 = $67,910
  Net Actual = $30,000 × 1.035^1 × 0.8749 = $27,165
  Net Loss = $67,910 - $27,165 = $40,745

Year 3 (2022, full year):
  Net Loss = $42,171

Year 4 (2023, partial 0.44):
  Gross But-For = $75,000 × 1.035^3 × 0.44 = $36,449
  Net But-For = $36,449 × 0.8749 = $31,894
  Net Actual = $30,000 × 1.035^3 × 0.44 × 0.8749 = $12,758
  Net Loss = $31,894 - $12,758 = $19,136

Total Past Loss = $39,371 + $40,745 + $42,171 + $19,136 = $141,423
```

### Future Earnings Losses

Future losses are calculated for each year from trial to retirement and discounted to present value.

#### Formula for Future Years

```
For each future year i:
  Growth Factor = (1 + Wage Growth Rate)^i
  Discount Factor = 1 / (1 + Discount Rate)^(i + 0.5)
  
  Gross But-For = Base Earnings × Growth Factor
  Net But-For = Gross But-For × AIF
  
  Gross Actual = Residual Earnings × Growth Factor
  Net Actual = Gross Actual × AIF
  
  Net Loss = Net But-For - Net Actual
  Present Value = Net Loss × Discount Factor
  
  Total Future PV = Sum of all Present Values
```

**Mid-Year Convention**: The exponent `(i + 0.5)` assumes earnings are received at mid-year.

#### Example - Future Losses

```
Base Earnings: $75,000
Residual Earnings: $30,000
Wage Growth: 3.5%
Discount Rate: 4.25%
AIF: 0.8749
Future Years: 28 years

Year 1:
  Gross But-For = $75,000 × 1.035^0 = $75,000
  Net But-For = $75,000 × 0.8749 = $65,618
  Gross Actual = $30,000 × 1.035^0 = $30,000
  Net Actual = $30,000 × 0.8749 = $26,247
  Net Loss = $65,618 - $26,247 = $39,371
  Discount = 1 / 1.04225^0.5 = 0.9793
  PV = $39,371 × 0.9793 = $38,556

Year 2:
  Net Loss = $40,745
  Discount = 1 / 1.04225^1.5 = 0.9395
  PV = $40,745 × 0.9395 = $38,281

...continue for all 28 years...

Total Future PV ≈ $827,000 (sum of all discounted losses)
```

---

## Household Services

### Purpose
Calculate the value of household services that the injured party can no longer perform (e.g., childcare, home maintenance, meal preparation, transportation).

### Formula

```
For each future year i:
  Annual Value = Hours/Week × 52 weeks × Hourly Rate × (1 + Growth Rate)^i
  Present Value = Annual Value × Discount Factor
  
  Where: Discount Factor = 1 / (1 + Discount Rate)^(i + 0.5)
  
Total PV = Sum of all Present Values
```

### Example

```
Hours per Week: 15
Hourly Rate: $25.00
Growth Rate: 3.0%
Discount Rate: 4.25%
Duration: 28.6 years (derived YFS)

Year 1:
  Annual = 15 × 52 × $25.00 × 1.03^0 = $19,500
  Discount = 1 / 1.04225^0.5 = 0.9793
  PV = $19,500 × 0.9793 = $19,096

Year 2:
  Annual = 15 × 52 × $25.00 × 1.03^1 = $20,085
  Discount = 1 / 1.04225^1.5 = 0.9395
  PV = $20,085 × 0.9395 = $18,870

...continue for ~29 years...

Total Household Services PV ≈ $423,000
```

### Typical Service Categories
- Childcare and supervision
- Home maintenance and repairs
- Meal preparation and cleanup
- Shopping and errands
- Transportation services
- Yard work and landscaping
- Home management and administration

---

## Life Care Plan

### Purpose
Calculate the present value of future medical and care expenses outlined in a life care plan prepared by a qualified professional.

### Item Types

1. **One-time Items**: Occur once (e.g., home modification)
2. **Annual Items**: Occur every year (e.g., medications)
3. **Recurring Items**: Occur at intervals (e.g., every 3 years)
4. **Custom Year Items**: Occur in specific years only

### Formula

```
For each item and each applicable year t:
  Year Index = (Start Year - 1) + t
  Inflated Cost = Base Cost × (1 + CPI Rate)^(Year Index)
  Discount Factor = 1 / (1 + Discount Rate)^(Year Index + 0.5)
  Present Value = Inflated Cost × Discount Factor
  
Total Item PV = Sum of all Present Values for that item
Total LCP PV = Sum of all Item PVs
```

### CPI Categories

Medical inflation rates vary by category:

| Category | Typical Rate |
|----------|--------------|
| Physician Evaluations & Home Care | 2.88% |
| Prescription Drugs / Medical Commodities | 1.65% |
| Hospital / Surgical Services | 4.07% |
| Therapy & Treatments | 1.62% |
| Transportation | 4.32% |
| Home Modifications | 4.16% |
| Education / Training | 2.61% |

### Example - Annual Medication

```
Item: Pain Medication
Base Cost: $2,400/year
CPI Rate: 1.65%
Discount Rate: 4.25%
Start Year: 1
Duration: 30 years
Frequency: Annual

Year 1:
  Inflated = $2,400 × 1.0165^0 = $2,400
  Discount = 1 / 1.04225^0.5 = 0.9793
  PV = $2,400 × 0.9793 = $2,350

Year 2:
  Inflated = $2,400 × 1.0165^1 = $2,440
  Discount = 1 / 1.04225^1.5 = 0.9395
  PV = $2,440 × 0.9395 = $2,292

...continue for 30 years...

Total PV ≈ $51,800
```

### Example - One-Time Modification

```
Item: Wheelchair Accessible Van
Base Cost: $65,000
CPI Rate: 4.32% (transportation)
Discount Rate: 4.25%
Start Year: 1 (immediate need)

Year 1 (Year Index 0):
  Inflated = $65,000 × 1.0432^0 = $65,000
  Discount = 1 / 1.04225^0.5 = 0.9793
  PV = $65,000 × 0.9793 = $63,655
```

### Example - Recurring Item

```
Item: Wheelchair Replacement
Base Cost: $8,500
CPI Rate: 1.65%
Discount Rate: 4.25%
Start Year: 1
Duration: 30 years
Frequency: Every 5 years

Occurrences in Years: 1, 6, 11, 16, 21, 26

Year 1 (t=0):
  PV = $8,500 × 1.0165^0 × 1/1.04225^0.5 = $8,324

Year 6 (t=5):
  Inflated = $8,500 × 1.0165^5 = $9,223
  Discount = 1 / 1.04225^5.5 = 0.7999
  PV = $9,223 × 0.7999 = $7,377

Year 11 (t=10):
  PV = $7,078

Year 16 (t=15):
  PV = $6,787

Year 21 (t=20):
  PV = $6,508

Year 26 (t=25):
  PV = $6,242

Total PV for Wheelchair Replacements = $42,316
```

---

## Scenario Analysis

### Purpose
Provide sensitivity analysis by calculating economic losses under different retirement age assumptions.

### Standard Scenarios

1. **WLE-Based**: Uses the work life expectancy from actuarial tables
2. **Age 65**: Assumes retirement at age 65
3. **Age 67**: Assumes retirement at age 67 (current full Social Security age)
4. **Age 70**: Assumes retirement at age 70
5. **PJI (Permanent Job Incapacity)**: Custom early retirement due to disability

### Calculation Process

For each scenario:

1. **Calculate YFS** based on scenario retirement age
   - `YFS = Retirement Age - Current Age`

2. **Calculate WLF** for that YFS
   - `WLF = WLE / YFS`

3. **Recalculate AIF** using the new WLF

4. **Project losses** using the scenario-specific parameters

5. **Include household and LCP** (these don't change by scenario)

### Example Comparison

```
Plaintiff Current Age: 38.4 years
WLE: 25 years

Scenario 1: WLE-Based (Ret. Age 63.4)
  YFS = 63.4 - 38.4 = 25.0 years
  WLF = 25 / 25 = 100%
  Past Loss = $141,423
  Future PV = $948,000
  Earnings Total = $1,089,423
  + Household = $423,000
  + LCP = $285,000
  Grand Total = $1,797,423

Scenario 2: Age 65
  YFS = 65 - 38.4 = 26.6 years
  WLF = 25 / 26.6 = 94.0%
  Past Loss = $141,423
  Future PV = $905,000
  Grand Total = $1,754,423

Scenario 3: Age 67
  YFS = 67 - 38.4 = 28.6 years
  WLF = 25 / 28.6 = 87.4%
  Past Loss = $141,423
  Future PV = $827,000
  Grand Total = $1,676,423

Scenario 4: Age 70
  YFS = 70 - 38.4 = 31.6 years
  WLF = 25 / 31.6 = 79.1%
  Past Loss = $141,423
  Future PV = $741,000
  Grand Total = $1,599,423
```

### Why Multiple Scenarios?

- **Uncertainty**: Actual retirement age is uncertain
- **Legal Strategy**: Shows range of possible damages
- **Jury Presentation**: Helps jurors understand assumptions
- **Settlement Negotiation**: Provides boundaries for discussions

---

## Present Value Discounting

### Purpose
Convert future dollars to present value, recognizing that money received today is worth more than money received in the future due to:
- Time value of money
- Investment opportunity
- Inflation

### Formula

```
PV = FV / (1 + r)^t

Where:
  PV = Present Value
  FV = Future Value
  r = Discount Rate (annual)
  t = Time period (years)
```

### Mid-Year Convention

The software uses a mid-year convention, assuming earnings/expenses occur at mid-year:

```
PV = FV / (1 + r)^(t + 0.5)
```

For Year 1: t = 0.5
For Year 2: t = 1.5
For Year 10: t = 9.5

### Discount Rate Selection

Typical sources:
- U.S. Treasury rates (risk-free rate)
- Corporate bond rates
- Historical market returns
- State-specific requirements

Common range: 2.5% to 5.0% (Note: In higher interest rate environments, such as 2023-2024, rates may exceed 5%)

### Example Calculations

```
Future Value: $50,000
Discount Rate: 4.25%

Year 1 (t = 0.5):
  PV = $50,000 / (1.04225)^0.5
  PV = $50,000 / 1.0209
  PV = $48,977

Year 5 (t = 4.5):
  PV = $50,000 / (1.04225)^4.5
  PV = $50,000 / 1.2095
  PV = $41,340

Year 10 (t = 9.5):
  PV = $50,000 / (1.04225)^9.5
  PV = $50,000 / 1.4631
  PV = $34,176

Year 20 (t = 19.5):
  PV = $50,000 / (1.04225)^19.5
  PV = $50,000 / 2.1408
  PV = $23,354

Year 30 (t = 29.5):
  PV = $50,000 / (1.04225)^29.5
  PV = $50,000 / 3.1334
  PV = $15,958
```

### Discount Rate Impact

Effect of different discount rates on $50,000 received in 10 years:

| Discount Rate | Present Value | Reduction |
|--------------|---------------|-----------|
| 2.5% | $39,063 | 21.9% |
| 3.5% | $35,318 | 29.4% |
| 4.25% | $33,176 | 33.6% |
| 5.0% | $30,696 | 38.6% |

**Key Insight**: A 2.5% change in discount rate can change present value by ~17%.

---

## Era-Based Calculations

### Purpose
The "Tinari Era Method" allows for different economic assumptions in different time periods. This is useful when:
- Past actual wage growth differs from expected future growth
- Different tax rates apply to past vs. future periods
- Economic conditions have fundamentally changed

### Two-Era Model

**Era 1**: Past (Date of Injury to Date of Trial)
- Uses actual historical wage growth
- Uses actual tax rates from past years
- Optional: Different personal consumption rate

**Era 2**: Future (Date of Trial to Retirement)
- Uses projected future wage growth
- Uses expected future tax rates
- Optional: Different personal consumption rate

### Era Split Year

The year dividing Era 1 from Era 2, typically the trial year.

### Formula Modifications

#### For Past Losses (Era 1)
```
For each past year i:
  Growth = (1 + Era 1 Wage Growth)^i
  Gross But-For = Base × Growth × Fraction
  AIF_1 = Era 1 AIF (with Era 1 PC if wrongful death)
  Net But-For = Gross But-For × AIF_1
```

#### For Future Losses (Era 2)
```
For each future year i:
  Growth = (1 + Era 2 Wage Growth)^i
  Gross But-For = Base × Growth
  AIF_2 = Era 2 AIF (with Era 2 PC if wrongful death)
  Net But-For = Gross But-For × AIF_2
```

### Example - Historical vs. Projected Growth

```
Historical Period (2020-2023):
  Actual Wage Growth: 5.2% (high inflation period)
  Era 1 Wage Growth: 5.2%

Future Period (2023-2050):
  Expected Wage Growth: 3.5% (return to normal)
  Era 2 Wage Growth: 3.5%

Base Earnings: $75,000
AIF (same for both eras): 0.8749

Past Year 1 (Era 1):
  Gross = $75,000 × 1.052^0 = $75,000
  Net Loss = $75,000 × 0.8749 = $65,618

Past Year 2 (Era 1):
  Gross = $75,000 × 1.052^1 = $78,900
  Net Loss = $78,900 × 0.8749 = $69,029

Future Year 1 (Era 2):
  Gross = $75,000 × 1.035^0 = $75,000
  Net Loss = $75,000 × 0.8749 = $65,618
  PV = $65,618 × Discount = $64,254

Future Year 2 (Era 2):
  Gross = $75,000 × 1.035^1 = $77,625
  Net Loss = $77,625 × 0.8749 = $67,910
  PV = $67,910 × Discount = $63,795

Total Past with Era Split: $269,295 (higher due to 5.2% growth)
Total Past without Era Split: $254,832 (using 3.5% growth)
Difference: $14,463 (5.7% increase)
```

---

## Wrongful Death Adjustments

### Purpose
In wrongful death cases, survivors cannot claim the portion of income the decedent would have spent on themselves (personal consumption). Only the net contribution to household is compensable.

### Personal Consumption Rates

Typical rates vary by household size and circumstances:

| Household Size | Typical PC Rate |
|----------------|-----------------|
| Single person | 100% (no survivors) |
| Two persons | 25-35% |
| Three persons | 20-28% |
| Four+ persons | 15-25% |

### Formula Modification

The personal consumption factor is applied AFTER all other adjustments:

```
For Personal Injury:
  AIF = After-Tax Compensation

For Wrongful Death:
  AIF = After-Tax Compensation × (1 - Personal Consumption Rate)
```

### Example - Wrongful Death vs. Personal Injury

```
Base Earnings: $80,000
After-Tax Compensation: 0.8749 (from Tinari method)
Personal Consumption: 25% (two-person household)

Personal Injury Case:
  AIF = 0.8749
  Annual Loss = $80,000 × 0.8749 = $69,992

Wrongful Death Case:
  AIF = 0.8749 × (1 - 0.25) = 0.8749 × 0.75 = 0.6562
  Annual Loss = $80,000 × 0.6562 = $52,494
  
Reduction: $69,992 - $52,494 = $17,498 (25% of compensable loss)
```

### Era-Specific Personal Consumption

Different PC rates can apply to past vs. future:

```
Era 1 (Past): 25% personal consumption
  Era 1 AIF = 0.8749 × 0.75 = 0.6562

Era 2 (Future): 20% personal consumption
  (decedent's children become independent)
  Era 2 AIF = 0.8749 × 0.80 = 0.6999
```

This reflects changing household circumstances over time.

---

## Summary Calculations

### Grand Total Calculation

The final compensable loss is the sum of all components:

```
Grand Total = Total Earnings Loss
            + Household Services PV
            + Life Care Plan PV

Where:
  Total Earnings Loss = Past Loss + Future PV
```

### Detailed Breakdown Example

```
EARNINGS LOSS:
  Past Loss (DOI to DOT):           $141,423
  Future PV (DOT to Retirement):    $827,000
  Subtotal Earnings:                $968,423

HOUSEHOLD SERVICES:
  Future PV:                        $423,000

LIFE CARE PLAN:
  Medical/Care Future PV:           $285,000

═══════════════════════════════════════════════
GRAND TOTAL:                      $1,676,423
═══════════════════════════════════════════════

Breakdown by Category:
  Lost Earnings:     57.9%  ($968,423)
  Household Services: 25.3%  ($423,000)
  Life Care:         17.0%  ($285,000)

Breakdown by Time Period:
  Past (Realized):    8.4%  ($141,423)
  Future (PV):       91.6% ($1,535,000)
```

### Component Tables

The software generates detailed tables:

#### Opinion of Economic Losses
| Category | Past Value | Future (PV) | Total |
|----------|------------|-------------|-------|
| Lost Earning Capacity | $141,423 | $827,000 | $968,423 |
| Household Services | — | $423,000 | $423,000 |
| Life Care Plan | — | $285,000 | $285,000 |
| **GRAND TOTAL** | **$141,423** | **$1,535,000** | **$1,676,423** |

#### Adjusted Earnings Factor (AEF) - Tinari Method
| Component | Value | Cumulative |
|-----------|-------|------------|
| Work Life Factor (WLE/YFS) | 0.8741 | 0.8741 |
| Net Unemployment Factor | 0.9748 | 0.8521 |
| After-Tax Factor | 0.8118 | 0.6917 |
| Fringe Benefit Factor | 1.2150 | 0.8749 |

---

## Validation and Reasonableness Checks

### Internal Consistency Checks

The software validates:

1. **Required Fields**: Plaintiff name, DOB, injury date, trial date
2. **Date Logic**: DOB < DOI < DOT
3. **Positive Values**: Earnings, WLE, life expectancy > 0
4. **Rate Ranges**: Tax rates between 0-100%
5. **Work Life**: WLE ≤ Remaining life expectancy
6. **Age Constraints**: Retirement age > current age

### Economic Reasonableness

Typical ranges for validation:

- **Wage Growth**: 2.0% - 6.0%
- **Discount Rate**: 2.0% - 6.0%
- **Fringe Benefits**: 10% - 40%
- **Unemployment**: 2.0% - 8.0%
- **Federal Tax**: 10% - 37%
- **State Tax**: 0% - 13%

### Common Validation Warnings

- WLF > 100%: WLE exceeds YFS (check retirement age or WLE)
- Net growth > 8%: Wage growth - discount rate unusually high
- AIF > 1.0: Check fringe benefit rate or tax rates
- Past years < 0: Trial date before injury date

---

## Report Generation

The software generates professional reports in multiple formats:

### PDF Reports
- Professional formatting with tables and charts
- Header with case information
- Certification of independence
- Detailed methodology explanations
- Year-by-year schedules
- Scenario comparison tables

### Word Documents
- Editable format for customization
- Standard forensic economics structure
- Tables with borders and formatting
- Sections:
  - Title page
  - Certification
  - Opinion of economic losses
  - Background facts and assumptions
  - AEF calculation (Tinari method)
  - Economic variables
  - Earnings damage schedule
  - Retirement scenario analysis
  - Life care plan summary
  - Household services
  - Statement of ethical principles

### Excel Exports
- Detailed year-by-year calculations
- Multiple worksheets for each component
- Formulas visible for transparency
- Suitable for expert testimony preparation

---

## References and Standards

### Professional Organizations

- **NAFE**: National Association of Forensic Economics
- **AREA**: American Rehabilitation Economics Association

### Key Publications

1. Tinari, Frank D. "The Algebraic Method for Calculating Economic Damages," Journal of Forensic Economics, Vol. 2, No. 2, 1989, pp. 103-114.
2. Skoog, Gary R. and James E. Ciecka. "The Markov (Increment-Decrement) Model of Labor Force Activity: Extended Tables of Central Tendency, Shape, Percentile Points, and Bootstrap Standard Errors," Journal of Forensic Economics, Vol. 27, No. 1, 2017, pp. 83-127.
3. U.S. Bureau of Labor Statistics - Employment Statistics and Unemployment Data
4. CDC National Vital Statistics Reports - United States Life Tables (annual updates)
5. Social Security Administration - Work Life Expectancy Tables and Actuarial Data
6. Ireland, Thomas R. and John O. Ward. "The Present Value of Future Damages: A Practical Guide to Forensic Economics," Journal of Legal Economics, various editions.

### Calculation Standards

- Mid-year discounting convention
- Separate treatment of fringe benefits and base earnings for tax purposes
- Work life expectancy based on actuarial tables
- Present value using market-based discount rates
- Era-based calculations for historical accuracy
- Personal consumption adjustments for wrongful death

---

## Conclusion

This economic loss calculator implements rigorous, court-accepted methodologies for calculating compensable economic damages in personal injury and wrongful death cases. The Tinari Algebraic Method ensures accurate treatment of unemployment, taxation, and fringe benefits, while scenario analysis provides comprehensive sensitivity testing.

All calculations are transparent, documented, and based on established economic and actuarial principles, making the results defensible in legal proceedings.

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Software**: ForensicSuite V10
**Calculation Method**: Tinari Algebraic Method
