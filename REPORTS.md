# ForensicSuite Reports & Exports

This document describes the report structure, export formats, and data dictionary for ForensicSuite economic appraisal reports.

## Report Structure

### EconomicLossReport

The central data structure that contains all information needed to reproduce a complete economic appraisal report.

```typescript
interface EconomicLossReport {
  metadata: ReportMetadata;
  assumptions: {
    caseInfo: CaseInfo;
    earningsParams: EarningsParams;
    hhServices: HhServices;
    lcpItems: LcpItem[];
    isUnionMode: boolean;
  };
  calculations: {
    dateCalc: DateCalc;
    algebraic: Algebraic;
    projection: Projection;
    hhsData: HhsData;
    lcpData: LcpData;
    workLifeFactor: number;
  };
  results: {
    scenarioProjections: ScenarioProjection[];
    grandTotal: number;
    summaryMetrics: SummaryMetrics;
  };
  periods: PeriodRow[];
}
```

## Export Formats

### 1. PDF Export (Presentation-focused)

Full formatted economic appraisal report suitable for court submission and expert testimony.

**Contents:**
- Title page with case identification
- Certification statement
- Opinion of Economic Losses summary table
- Background Facts and Assumptions
- Tinari AEF calculation table
- Economic variables
- Life Care Plan summary (if applicable)
- Retirement scenario comparison
- Appendix with methodology explanations

### 2. Word Export (Editable)

Same content as PDF but in editable .docx format for customization before submission.

### 3. Excel Export (Data-focused)

Multi-sheet workbook containing all calculation data.

**Sheets:**
- **Summary** - Headline metrics and case identification
- **Assumptions** - All input parameters and derived values
- **Periods** - Year-over-year timeline with discount factors
- **Scenarios** - Retirement scenario comparison
- **LCP Items** - Life care plan details (if applicable)
- **Household Services** - HHS valuation (if active)
- **Metadata** - Report ID, timestamps, versions

### 4. JSON Export (API/Audit-focused)

Complete `EconomicLossReport` snapshot in JSON format for:
- API integrations
- Audit trails
- Version comparison
- Data analysis

### 5. CSV/ZIP Export (Legacy)

Individual CSV files for each data category, bundled in a ZIP archive.

## Data Dictionary

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `reportId` | string (UUID) | Unique identifier for audit trail |
| `generatedAt` | string (ISO 8601) | Timestamp when report was generated |
| `appVersion` | string | ForensicSuite application version |
| `schemaVersion` | string | Data schema version (e.g., "v10") |
| `environment` | string | "development", "staging", or "production" |
| `calculationMethod` | string | Always "tinari-algebraic" |
| `activeScenario` | string | ID of the scenario used for primary calculations |
| `includedScenarios` | string[] | IDs of scenarios included in exports |

### Summary Metrics

| Field | Type | Description |
|-------|------|-------------|
| `totalPastLoss` | number | Sum of past loss from injury to trial date |
| `totalFuturePV` | number | Present value of future earnings loss |
| `totalEarningsLoss` | number | Past + Future earnings loss |
| `householdServicesPV` | number | Present value of household services (0 if inactive) |
| `lifeCareplanPV` | number | Present value of all LCP items |
| `grandTotal` | number | Sum of all damage categories |

### Period Row (Timeline)

| Field | Type | Description |
|-------|------|-------------|
| `yearNum` | number | Sequential year number (1, 2, 3...) |
| `calendarYear` | number | Actual calendar year (2024, 2025...) |
| `periodType` | string | "past" or "future" |
| `grossIncome` | number | Projected gross earnings for the period |
| `netLoss` | number | Net loss after adjustments |
| `discountFactor` | number | Present value discount factor (1.0 for past) |
| `presentValue` | number | Present value of loss for the period |
| `cumulativePV` | number | Running total of present values |

### Scenario Projection

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Scenario identifier (e.g., "wle", "age65") |
| `label` | string | Human-readable name |
| `retirementAge` | number | Assumed retirement age |
| `yfs` | number | Years to Final Separation (injury → retirement) |
| `wlf` | number | Work Life Factor (WLE ÷ YFS, decimal) |
| `wlfPercent` | number | Work Life Factor (percentage) |
| `totalPastLoss` | number | Past loss under this scenario |
| `totalFuturePV` | number | Future PV under this scenario |
| `totalEarningsLoss` | number | Total earnings loss |
| `grandTotal` | number | Grand total including HHS and LCP |
| `included` | boolean | Whether to include in exports |

## Work Life Expectancy (WLE) vs Years to Final Separation (YFS)

ForensicSuite implements the Tinari Method distinction between WLE and YFS:

### Work Life Expectancy (WLE)
- Probability-weighted expected years of labor force participation
- Derived from Markov worklife tables (Skoog, Ciecka, & Krueger, 2010)
- Accounts for mortality, disability, unemployment, and retirement probabilities
- Represents EXPECTED working years, not chronological time

### Years to Final Separation (YFS)  
- Chronological years from injury to expected retirement age
- Calculated as: `YFS = Retirement Age − Age at Injury`
- Represents the full remaining career horizon
- YFS > WLE because it doesn't weight for labor force exits (Tinari, 2016)

### Work Life Factor (WLF)
- Formula: `WLF = WLE ÷ YFS`
- Represents the probability that the plaintiff would have worked during each year
- Used to adjust gross earnings to reflect statistical labor force participation

## Calculation Method: Tinari Algebraic

ForensicSuite uses the Tinari Algebraic Method for calculating the Adjusted Income Factor (AIF):

```
AIF = {[(GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL} × (1 - PC)
```

**Key principle:** Taxes are applied only to base earnings, not to fringe benefits.

### Step-by-Step Calculation

1. **Gross Earnings Base** (100%)
2. **× Work Life Factor** (WLE ÷ YFS)
3. **× (1 - Unemployment Factor)** accounting for UI replacement
4. **× (1 + Fringe Benefits)** adding employer-provided benefits
5. **− Tax on Base Earnings** (not on fringes)
6. **× (1 - Personal Consumption)** [Wrongful Death only]

## File Naming Convention

All exports follow a consistent naming pattern:

```
{ReportType}_{PlaintiffName}_{Date}_{Scenario}.{ext}
```

Examples:
- `Economic-Appraisal_Smith-v-Jones_2025-12-10.pdf`
- `Economic-Analysis_Smith-v-Jones_2025-12-10.xlsx`
- `Economic-Report_Smith-v-Jones_2025-12-10.json`

## Version History

- **v10** (Current): Added era-based calculations, wrongful death support, Tinari method
- **v9**: Added scenario projections and comparison tables
- **v8**: Added household services module
- **v7**: Initial release with basic earnings calculations
