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

export interface EarningsParams {
  baseEarnings: number;
  residualEarnings: number;
  wle: number;
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

export const DEFAULT_HH_SERVICES: HhServices = {
  active: false,
  hoursPerWeek: 0,
  hourlyRate: 25.00,
  growthRate: 3.0,
  discountRate: 4.25
};
