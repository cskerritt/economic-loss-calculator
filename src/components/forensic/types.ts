export interface CaseInfo {
  plaintiff: string;
  fileNumber: string;
  attorney: string;
  lawFirm: string;
  reportDate: string;
  gender: string;
  dob: string;
  education: string;
  maritalStatus: string;
  dependents: string;
  city: string;
  county: string;
  state: string;
  dateOfInjury: string;
  dateOfTrial: string;
  retirementAge: number;
  lifeExpectancy: number;
  wleSource: string;
  lifeTableSource: string;
  jurisdiction: string;
  caseType: string;
  medicalSummary: string;
  employmentHistory: string;
  earningsHistory: string;
  preInjuryCapacity: string;
  postInjuryCapacity: string;
  functionalLimitations: string;
}

export interface RetirementScenario {
  id: string;
  label: string;
  retirementAge: number | null; // null for WLE-based
  enabled: boolean;
  yfs: number; // Years to Final Separation (calculated or manual)
  wlf: number; // Work Life Factor (calculated)
}

export interface EarningsParams {
  baseEarnings: number;
  residualEarnings: number;
  wle: number; // Work Life Expectancy in years (XX.XX)
  wleRetirementAge: number; // The age that corresponds to WLE endpoint
  yfsManual: number; // Manual YFS override if needed
  useManualYFS: boolean;
  selectedScenario: string; // Which scenario is active for calculations
  enablePJI: boolean; // Permanent Job Incapacity option
  pjiAge: number; // Custom PJI age
  wageGrowth: number;
  discountRate: number;
  fringeRate: number;
  pension: number;
  healthWelfare: number;
  annuity: number;
  clothingAllowance: number;
  otherBenefits: number;
  unemploymentRate: number;
  uiReplacementRate: number;
  fedTaxRate: number;
  stateTaxRate: number;
}

export interface HhServices {
  active: boolean;
  hoursPerWeek: number;
  hourlyRate: number;
  growthRate: number;
  discountRate: number;
}

export interface LcpItem {
  id: number;
  categoryId: string;
  name: string;
  baseCost: number;
  freqType: string;
  duration: number;
  startYear: number;
  cpi: number;
  recurrenceInterval: number;
}

export interface DateCalc {
  ageInjury: string;
  ageTrial: string;
  currentAge: string;
  pastYears: number;
  derivedYFS: number;
}

export interface Algebraic {
  wlf: number;
  unempFactor: number;
  afterTaxFactor: number;
  fringeFactor: number;
  fullMultiplier: number;
  realizedMultiplier: number;
  yfs: number;
  flatFringeAmount: number;
  combinedTaxRate: number;
}

export interface PastScheduleRow {
  year: number;
  label: string;
  grossBase: number;
  grossActual: number;
  netLoss: number;
  isManual: boolean;
  fraction: number;
}

export interface FutureScheduleRow {
  year: number;
  gross: number;
  netLoss: number;
  pv: number;
}

export interface Projection {
  pastSchedule: PastScheduleRow[];
  futureSchedule: FutureScheduleRow[];
  totalPastLoss: number;
  totalFutureNominal: number;
  totalFuturePV: number;
}

export interface ScenarioProjection {
  id: string;
  label: string;
  retirementAge: number;
  yfs: number;
  wlf: number;
  wlfPercent: number;
  totalPastLoss: number;
  totalFuturePV: number;
  totalEarningsLoss: number;
  grandTotal: number;
}

export interface HhsData {
  totalNom: number;
  totalPV: number;
}

export interface LcpData {
  items: Array<LcpItem & { totalNom: number; totalPV: number }>;
  totalNom: number;
  totalPV: number;
}

export const CPI_CATEGORIES = [
  { id: 'evals', label: 'Physician Evals & Home Care', rate: 2.88 },
  { id: 'rx', label: 'Rx / Medical Commodities', rate: 1.65 },
  { id: 'surgery', label: 'Hospital/Surgical Services', rate: 4.07 },
  { id: 'therapy', label: 'Therapy & Treatments', rate: 1.62 },
  { id: 'transport', label: 'Transportation', rate: 4.32 },
  { id: 'home', label: 'Home Modifications', rate: 4.16 },
  { id: 'educ', label: 'Education/Training', rate: 2.61 },
  { id: 'custom', label: 'Custom Rate', rate: 0.00 }
];

export const DEFAULT_CASE_INFO: CaseInfo = {
  plaintiff: '',
  fileNumber: '',
  attorney: '',
  lawFirm: '',
  reportDate: new Date().toISOString().split('T')[0],
  gender: '',
  dob: '',
  education: '',
  maritalStatus: '',
  dependents: '',
  city: '',
  county: '',
  state: 'New Jersey',
  dateOfInjury: '',
  dateOfTrial: '',
  retirementAge: 67,
  lifeExpectancy: 0,
  wleSource: 'Skoog-Ciecka Work Life Expectancy Tables (2017)',
  lifeTableSource: 'CDC National Vital Statistics Reports (2021)',
  jurisdiction: 'New Jersey',
  caseType: 'Personal Injury',
  medicalSummary: '',
  employmentHistory: '',
  earningsHistory: '',
  preInjuryCapacity: '',
  postInjuryCapacity: '',
  functionalLimitations: ''
};

export const DEFAULT_EARNINGS_PARAMS: EarningsParams = {
  baseEarnings: 0,
  residualEarnings: 0,
  wle: 0,
  wleRetirementAge: 67,
  yfsManual: 0,
  useManualYFS: false,
  selectedScenario: 'age67',
  enablePJI: false,
  pjiAge: 62,
  wageGrowth: 3.50,
  discountRate: 4.25,
  fringeRate: 21.5,
  pension: 0,
  healthWelfare: 0,
  annuity: 0,
  clothingAllowance: 0,
  otherBenefits: 0,
  unemploymentRate: 4.2,
  uiReplacementRate: 40.0,
  fedTaxRate: 15.0,
  stateTaxRate: 4.5
};

export const RETIREMENT_SCENARIOS = [
  { id: 'wle', label: 'WLE-Based', retirementAge: null },
  { id: 'age65', label: 'Age 65', retirementAge: 65 },
  { id: 'age67', label: 'Age 67', retirementAge: 67 },
  { id: 'age70', label: 'Age 70', retirementAge: 70 },
];

export const DEFAULT_HH_SERVICES: HhServices = {
  active: false,
  hoursPerWeek: 0,
  hourlyRate: 25.00,
  growthRate: 3.0,
  discountRate: 4.25
};
