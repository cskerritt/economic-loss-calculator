import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Plus,
  Trash2,
  Copy,
  Check,
  Sigma,
  Table,
  Menu,
  X,
  History,
  Calendar as CalendarIcon,
  User,
  Home,
  BookOpen,
  Scale,
  Briefcase,
  HeartPulse
} from 'lucide-react';

// --- CONSTANTS ---
const CPI_CATEGORIES = [
  { id: 'evals', label: 'Physician Evals & Home Care', rate: 2.88 },
  { id: 'rx', label: 'Rx / Medical Commodities', rate: 1.65 },
  { id: 'surgery', label: 'Hospital/Surgical Services', rate: 4.07 },
  { id: 'therapy', label: 'Therapy & Treatments', rate: 1.62 },
  { id: 'transport', label: 'Transportation', rate: 4.32 },
  { id: 'home', label: 'Home Modifications', rate: 4.16 },
  { id: 'educ', label: 'Education/Training', rate: 2.61 },
  { id: 'custom', label: 'Custom Rate', rate: 0.00 }
];

// --- TYPES ---
interface CaseInfo {
  // Basic Info
  plaintiff: string;
  fileNumber: string;
  attorney: string;
  lawFirm: string;
  reportDate: string;
  
  // Demographics
  gender: string;
  dob: string;
  education: string;
  maritalStatus: string;
  dependents: string;
  city: string;
  county: string;
  state: string;
  
  // Dates
  dateOfInjury: string;
  dateOfTrial: string;
  retirementAge: number;
  
  // Actuarial
  lifeExpectancy: number;
  wleSource: string;
  lifeTableSource: string;
  
  // Legal
  jurisdiction: string;
  caseType: string;
  
  // Narratives
  medicalSummary: string;
  employmentHistory: string;
  earningsHistory: string;
  preInjuryCapacity: string;
  postInjuryCapacity: string;
  functionalLimitations: string;
}

interface EarningsParams {
  baseEarnings: number;
  residualEarnings: number;
  wle: number;
  wageGrowth: number;
  discountRate: number;
  fringeRate: number;
  // Union Specifics
  pension: number;
  healthWelfare: number;
  annuity: number;
  clothingAllowance: number;
  otherBenefits: number;
  // Risk & Tax
  unemploymentRate: number;
  uiReplacementRate: number;
  fedTaxRate: number;
  stateTaxRate: number;
}

interface HhServices {
  active: boolean;
  hoursPerWeek: number;
  hourlyRate: number;
  growthRate: number;
  discountRate: number;
}

interface LcpItem {
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

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string | null;
  suffix?: string | null;
  disabled?: boolean;
  placeholder?: string;
  step?: string;
  className?: string;
}

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

// --- UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border/50">
    <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-bold text-foreground text-lg leading-tight">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
    </div>
  </div>
);

const InputGroup = ({ 
  label, 
  value, 
  onChange, 
  type = "number", 
  prefix = null, 
  suffix = null, 
  disabled = false, 
  placeholder = "", 
  step = "any", 
  className = "" 
}: InputGroupProps) => (
  <div className={`mb-3 ${className}`}>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
    <div className={`relative rounded-lg shadow-sm ${disabled ? 'opacity-60' : ''}`}>
      {prefix && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-muted-foreground sm:text-sm font-medium">{prefix}</span>
        </div>
      )}
      <input
        type={type}
        step={step}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`block w-full rounded-lg border-border py-2 focus:ring-primary focus:border-primary text-sm border px-3 transition-all bg-background text-foreground ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} ${disabled ? 'bg-muted cursor-not-allowed' : ''}`}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-muted-foreground sm:text-sm font-medium">{suffix}</span>
        </div>
      )}
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder = "", rows = 3 }: TextAreaProps) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-lg border-border py-2 focus:ring-primary focus:border-primary text-sm border px-3 transition-all resize-none bg-background text-foreground"
    />
  </div>
);

// --- MAIN APPLICATION ---
export default function ForensicSuite() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [strictAlgebraicMode] = useState(true);
  const [isUnionMode, setIsUnionMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  // --- PERSISTENT STATE ---
  const [caseInfo, setCaseInfo] = useState<CaseInfo>(() => {
    const saved = localStorage.getItem('fs_case_v9');
    return saved ? JSON.parse(saved) : {
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
  });

  const [earningsParams, setEarningsParams] = useState<EarningsParams>(() => {
    const saved = localStorage.getItem('fs_params_v9');
    return saved ? JSON.parse(saved) : {
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
      stateTaxRate: 4.5,
    };
  });

  const [hhServices, setHhServices] = useState<HhServices>(() => {
    const saved = localStorage.getItem('fs_hhs_v9');
    return saved ? JSON.parse(saved) : {
      active: false,
      hoursPerWeek: 0,
      hourlyRate: 25.00,
      growthRate: 3.0,
      discountRate: 4.25
    };
  });

  const [pastActuals, setPastActuals] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('fs_past_actuals_v9');
    return saved ? JSON.parse(saved) : {};
  });

  const [lcpItems, setLcpItems] = useState<LcpItem[]>(() => {
    const saved = localStorage.getItem('fs_lcp_v9');
    return saved ? JSON.parse(saved) : [];
  });

  // --- AUTO-CALC ENGINE ---
  const dateCalc = useMemo(() => {
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) return { ageInjury: '0', ageTrial: '0', currentAge: '0', pastYears: 0, derivedYFS: 0 };

    const dob = new Date(caseInfo.dob);
    const doi = new Date(caseInfo.dateOfInjury);
    const dot = new Date(caseInfo.dateOfTrial);
    const now = new Date();

    const getAge = (d: Date) => (d.getTime() - dob.getTime()) / msPerYear;
    const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / msPerYear);
    
    const targetRetirementDate = new Date(dob);
    targetRetirementDate.setFullYear(dob.getFullYear() + caseInfo.retirementAge);
    const derivedYFS = Math.max(0, (targetRetirementDate.getTime() - dot.getTime()) / msPerYear);

    return { 
      ageInjury: getAge(doi).toFixed(1), 
      ageTrial: getAge(dot).toFixed(1),
      currentAge: getAge(now).toFixed(1),
      pastYears,
      derivedYFS
    };
  }, [caseInfo]);

  // Work Life Factor
  const workLifeFactor = useMemo(() => {
    if (dateCalc.derivedYFS <= 0) return 0;
    return (earningsParams.wle / dateCalc.derivedYFS) * 100;
  }, [earningsParams.wle, dateCalc.derivedYFS]);

  // Auto-Save
  useEffect(() => { localStorage.setItem('fs_case_v9', JSON.stringify(caseInfo)); }, [caseInfo]);
  useEffect(() => { localStorage.setItem('fs_params_v9', JSON.stringify(earningsParams)); }, [earningsParams]);
  useEffect(() => { localStorage.setItem('fs_lcp_v9', JSON.stringify(lcpItems)); }, [lcpItems]);
  useEffect(() => { localStorage.setItem('fs_past_actuals_v9', JSON.stringify(pastActuals)); }, [pastActuals]);
  useEffect(() => { localStorage.setItem('fs_hhs_v9', JSON.stringify(hhServices)); }, [hhServices]);

  // --- PROJECTION ENGINE ---
  const algebraic = useMemo(() => {
    const yfs = dateCalc.derivedYFS;
    const wlf = yfs > 0 ? (earningsParams.wle / yfs) : 0;
    const unempFactor = 1 - ((earningsParams.unemploymentRate / 100) * (1 - (earningsParams.uiReplacementRate / 100)));
    const afterTaxFactor = (1 - (earningsParams.fedTaxRate / 100)) * (1 - (earningsParams.stateTaxRate / 100));
    
    let fringeFactor = 1;
    let flatFringeAmount = 0;

    if (isUnionMode) {
      flatFringeAmount = earningsParams.pension + earningsParams.healthWelfare + earningsParams.annuity + earningsParams.clothingAllowance + earningsParams.otherBenefits;
      const effectiveFringeRate = earningsParams.baseEarnings > 0 ? (flatFringeAmount / earningsParams.baseEarnings) : 0;
      fringeFactor = 1 + effectiveFringeRate;
    } else {
      fringeFactor = 1 + (earningsParams.fringeRate / 100);
    }

    let fullMultiplier = 0;
    let realizedMultiplier = 0;

    if (strictAlgebraicMode) {
      fullMultiplier = wlf * unempFactor * afterTaxFactor * fringeFactor;
      realizedMultiplier = afterTaxFactor * fringeFactor;
    } else {
      const effFringe = isUnionMode ? (flatFringeAmount/earningsParams.baseEarnings) : (earningsParams.fringeRate/100);
      fullMultiplier = wlf * unempFactor * (afterTaxFactor + effFringe);
      realizedMultiplier = (afterTaxFactor + effFringe);
    }

    // Combined Tax Rate
    const combinedTaxRate = 1 - afterTaxFactor;

    return { wlf, unempFactor, afterTaxFactor, fringeFactor, fullMultiplier, realizedMultiplier, yfs, flatFringeAmount, combinedTaxRate };
  }, [dateCalc, earningsParams, strictAlgebraicMode, isUnionMode]);

  const projection = useMemo(() => {
    const pastSchedule: Array<{ year: number; label: string; grossBase: number; grossActual: number; netLoss: number; isManual: boolean; fraction: number }> = [];
    const futureSchedule: Array<{ year: number; gross: number; netLoss: number; pv: number }> = [];
    let totalPastLoss = 0, totalFutureNominal = 0, totalFuturePV = 0;

    if (!caseInfo.dateOfInjury) return { pastSchedule, futureSchedule, totalPastLoss, totalFutureNominal, totalFuturePV };

    const startYear = new Date(caseInfo.dateOfInjury).getFullYear();
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;
    
    // PAST
    for (let i = 0; i <= fullPast; i++) {
      const fraction = (i === fullPast && partialPast > 0) ? partialPast : (i === fullPast && partialPast === 0 ? 0 : 1);
      if (fraction <= 0) continue;

      const currentYear = startYear + i;
      const growth = Math.pow(1 + (earningsParams.wageGrowth/100), i);
      
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
      pastSchedule.push({ year: currentYear, label: `Past-${i+1}`, grossBase, grossActual, netLoss, isManual, fraction });
    }

    // FUTURE
    const futureYears = Math.ceil(algebraic.yfs);
    for (let i = 0; i < futureYears; i++) {
      const growth = Math.pow(1 + (earningsParams.wageGrowth/100), i);
      const discount = 1 / Math.pow(1 + (earningsParams.discountRate/100), i + 0.5);
      
      const grossBase = earningsParams.baseEarnings * growth;
      const netButFor = grossBase * algebraic.fullMultiplier;
      
      const grossRes = earningsParams.residualEarnings * growth;
      const netActual = grossRes * algebraic.fullMultiplier;

      const netLoss = netButFor - netActual;
      const pv = netLoss * discount;
      
      totalFutureNominal += netLoss;
      totalFuturePV += pv;
      futureSchedule.push({ year: i+1, gross: grossBase, netLoss, pv });
    }
    return { pastSchedule, futureSchedule, totalPastLoss, totalFutureNominal, totalFuturePV };
  }, [earningsParams, algebraic, pastActuals, caseInfo.dateOfInjury, dateCalc]);

  // --- HOUSEHOLD SERVICES ENGINE ---
  const hhsData = useMemo(() => {
    if (!hhServices.active) return { totalNom: 0, totalPV: 0 };
    
    let totalNom = 0, totalPV = 0;
    const years = Math.ceil(dateCalc.derivedYFS);
    
    for(let i=0; i<years; i++) {
      const annualValue = hhServices.hoursPerWeek * 52 * hhServices.hourlyRate * Math.pow(1 + hhServices.growthRate/100, i);
      const disc = 1 / Math.pow(1 + hhServices.discountRate/100, i + 0.5);
      const pv = annualValue * disc;
      
      totalNom += annualValue;
      totalPV += pv;
    }
    return { totalNom, totalPV };
  }, [hhServices, dateCalc.derivedYFS]);

  // --- LCP ENGINE ---
  const lcpData = useMemo(() => {
    let totalNom = 0, totalPV = 0;
    const processed = lcpItems.map(item => {
      let iNom = 0, iPV = 0;
      for(let t=0; t<item.duration; t++) {
        let active = false;
        if (item.freqType === 'annual') active = true;
        else if (item.freqType === 'onetime') active = (t === 0);
        else if (item.freqType === 'recurring') active = (t % item.recurrenceInterval === 0);
        
        if (active) {
          const inf = item.baseCost * Math.pow(1 + (item.cpi/100), t + item.startYear - 1);
          const disc = 1 / Math.pow(1 + (earningsParams.discountRate/100), t + item.startYear - 0.5);
          iNom += inf;
          iPV += (inf * disc);
        }
      }
      totalNom += iNom;
      totalPV += iPV;
      return { ...item, totalNom: iNom, totalPV: iPV };
    });
    return { items: processed, totalNom, totalPV };
  }, [lcpItems, earningsParams.discountRate]);

  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

  const copyTable = () => {
    const txt = projection.futureSchedule.map(r => `${r.year}\t${r.gross.toFixed(2)}\t${r.netLoss.toFixed(2)}\t${r.pv.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`Year\tGross\tNetLoss\tPV\n${txt}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const grandTotal = projection.totalPastLoss + projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 print:bg-white print:pb-0">
      
      {/* NAVBAR */}
      <nav className="bg-navy text-primary-foreground sticky top-0 z-50 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo to-indigo-light p-2 rounded-lg shadow-lg">
              <Sigma className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">ForensicSuite <span className="text-indigo-light font-light">V9</span></h1>
              <h1 className="font-bold text-lg tracking-tight sm:hidden">FS<span className="text-indigo-light font-light">V9</span></h1>
            </div>
          </div>
          
          <div className="hidden md:flex gap-1 bg-navy-light p-1 rounded-lg">
            {['analysis', 'lcp', 'report'].map(id => (
              <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-1.5 text-sm font-medium rounded transition-all ${activeTab===id ? 'bg-indigo shadow-sm text-primary-foreground' : 'text-muted-foreground hover:text-primary-foreground'}`}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-muted-foreground">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-light border-t border-navy p-4 space-y-2 print:hidden">
          {['analysis', 'lcp', 'report'].map(id => (
            <button key={id} onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }} className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${activeTab===id ? 'bg-indigo text-primary-foreground' : 'text-muted-foreground hover:bg-navy'}`}>
              {id.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 print:p-0">

        {/* --- TAB: ANALYSIS --- */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* 1. CASE INFO / DEMOGRAPHICS */}
              <Card className="p-4 border-l-4 border-l-indigo">
                <SectionHeader icon={User} title="Case Information" subtitle="Demographics & Identification" />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Plaintiff Name" type="text" value={caseInfo.plaintiff} onChange={v => setCaseInfo({...caseInfo, plaintiff: v})} placeholder="First Last" />
                    <InputGroup label="File Number" type="text" value={caseInfo.fileNumber} onChange={v => setCaseInfo({...caseInfo, fileNumber: v})} placeholder="KW-2025-XXX" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Gender" type="text" value={caseInfo.gender} onChange={v => setCaseInfo({...caseInfo, gender: v})} placeholder="Male/Female" />
                    <InputGroup label="DOB" type="date" value={caseInfo.dob} onChange={v => setCaseInfo({...caseInfo, dob: v})} />
                  </div>
                  <InputGroup label="Education" type="text" value={caseInfo.education} onChange={v => setCaseInfo({...caseInfo, education: v})} placeholder="Highest degree, school, location" />
                  <InputGroup label="Marital Status" type="text" value={caseInfo.maritalStatus} onChange={v => setCaseInfo({...caseInfo, maritalStatus: v})} placeholder="Single, Married, etc." />
                  <InputGroup label="Dependents" type="text" value={caseInfo.dependents} onChange={v => setCaseInfo({...caseInfo, dependents: v})} placeholder="Number and ages of minor children" />
                  <div className="grid grid-cols-3 gap-2">
                    <InputGroup label="City" type="text" value={caseInfo.city} onChange={v => setCaseInfo({...caseInfo, city: v})} />
                    <InputGroup label="County" type="text" value={caseInfo.county} onChange={v => setCaseInfo({...caseInfo, county: v})} />
                    <InputGroup label="State" type="text" value={caseInfo.state} onChange={v => setCaseInfo({...caseInfo, state: v})} />
                  </div>
                </div>
              </Card>

              {/* 2. LEGAL FRAMEWORK */}
              <Card className="p-4 border-l-4 border-l-sky">
                <SectionHeader icon={Scale} title="Legal Framework" subtitle="Jurisdiction & Retaining Party" />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Jurisdiction" type="text" value={caseInfo.jurisdiction} onChange={v => setCaseInfo({...caseInfo, jurisdiction: v})} />
                    <InputGroup label="Case Type" type="text" value={caseInfo.caseType} onChange={v => setCaseInfo({...caseInfo, caseType: v})} placeholder="Personal Injury" />
                  </div>
                  <InputGroup label="Retaining Attorney" type="text" value={caseInfo.attorney} onChange={v => setCaseInfo({...caseInfo, attorney: v})} />
                  <InputGroup label="Law Firm" type="text" value={caseInfo.lawFirm} onChange={v => setCaseInfo({...caseInfo, lawFirm: v})} />
                  <InputGroup label="Report Date" type="date" value={caseInfo.reportDate} onChange={v => setCaseInfo({...caseInfo, reportDate: v})} />
                </div>
              </Card>

              {/* 3. DATES & VOCATIONAL */}
              <Card className="p-4 border-l-4 border-l-emerald">
                <SectionHeader icon={CalendarIcon} title="Dates & Duration" subtitle="Calculates Ages & Work Life" />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Date of Injury" type="date" value={caseInfo.dateOfInjury} onChange={v => setCaseInfo({...caseInfo, dateOfInjury: v})} />
                    <InputGroup label="Valuation Date" type="date" value={caseInfo.dateOfTrial} onChange={v => setCaseInfo({...caseInfo, dateOfTrial: v})} />
                  </div>
                  
                  <div className="bg-emerald/10 p-3 rounded-lg border border-emerald/20 text-xs grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="block text-muted-foreground">Current Age</span>
                      <strong className="text-foreground">{dateCalc.currentAge}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Age at Injury</span>
                      <strong className="text-foreground">{dateCalc.ageInjury}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Age at Trial</span>
                      <strong className="text-foreground">{dateCalc.ageTrial}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Life Expectancy (Yrs)" value={caseInfo.lifeExpectancy} suffix="Yrs" onChange={v => setCaseInfo({...caseInfo, lifeExpectancy: parseFloat(v) || 0})} />
                    <InputGroup label="Retirement Age" value={caseInfo.retirementAge} onChange={v => setCaseInfo({...caseInfo, retirementAge: parseFloat(v) || 0})} />
                  </div>
                  <InputGroup label="Work Life Expectancy (WLE)" suffix="Yrs" value={earningsParams.wle} onChange={v => setEarningsParams({...earningsParams, wle: parseFloat(v) || 0})} />
                  
                  <div className="bg-muted p-3 rounded-lg text-xs grid grid-cols-2 gap-2 text-center">
                    <div>
                      <span className="block text-muted-foreground">Years to Separation</span>
                      <strong className="text-foreground">{dateCalc.derivedYFS.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="block text-muted-foreground">Work Life Factor</span>
                      <strong className="text-foreground">{workLifeFactor.toFixed(2)}%</strong>
                    </div>
                  </div>

                  <InputGroup label="WLE Source" type="text" value={caseInfo.wleSource} onChange={v => setCaseInfo({...caseInfo, wleSource: v})} />
                  <InputGroup label="Life Table Source" type="text" value={caseInfo.lifeTableSource} onChange={v => setCaseInfo({...caseInfo, lifeTableSource: v})} />
                </div>
              </Card>

              {/* 4. PAST ACTUALS */}
              <Card className="p-4 border-l-4 border-l-rose max-h-[250px] overflow-y-auto">
                <SectionHeader icon={History} title="Past Actual Earnings" subtitle="Offset against but-for" />
                <div className="space-y-2">
                  {projection.pastSchedule.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Enter dates above to generate past years</p>
                  )}
                  {projection.pastSchedule.map((row) => (
                    <div key={row.year} className="flex items-center gap-3">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{row.year}</label>
                      </div>
                      <div className="w-2/3">
                        <input 
                          type="number" 
                          className="block w-full rounded-md border-border py-1 text-sm bg-background text-foreground" 
                          placeholder="Actual Gross $"
                          value={pastActuals[row.year] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPastActuals(prev => ({ ...prev, [row.year]: val }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* MIDDLE COLUMN */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* EARNINGS CAPACITY */}
              <Card className="p-4 border-l-4 border-l-indigo">
                <SectionHeader icon={Briefcase} title="Earnings Capacity" subtitle="Pre and Post Injury" />
                <div className="space-y-2">
                  <InputGroup label="Pre-Injury Base Earnings (Annual)" prefix="$" value={earningsParams.baseEarnings} onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} />
                  <InputGroup label="Post-Injury Residual Earnings (Annual)" prefix="$" value={earningsParams.residualEarnings} onChange={v => setEarningsParams({...earningsParams, residualEarnings: parseFloat(v) || 0})} />
                </div>
              </Card>

              {/* FRINGE BENEFITS */}
              <Card className="p-4 border-l-4 border-l-sky">
                <div className="flex justify-between items-center mb-3">
                  <SectionHeader icon={HeartPulse} title="Fringe Benefits" subtitle="Employer-paid benefits" />
                  <label className="text-[10px] flex items-center gap-1 cursor-pointer bg-muted px-2 py-1 rounded">
                    <input type="checkbox" checked={isUnionMode} onChange={e => setIsUnionMode(e.target.checked)} />
                    Union Mode
                  </label>
                </div>
                
                {isUnionMode ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground mb-2">Enter annualized union benefit amounts:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Pension ($/yr)" prefix="$" value={earningsParams.pension} onChange={v => setEarningsParams({...earningsParams, pension: parseFloat(v) || 0})} />
                      <InputGroup label="Health & Welfare ($/yr)" prefix="$" value={earningsParams.healthWelfare} onChange={v => setEarningsParams({...earningsParams, healthWelfare: parseFloat(v) || 0})} />
                      <InputGroup label="Annuity ($/yr)" prefix="$" value={earningsParams.annuity} onChange={v => setEarningsParams({...earningsParams, annuity: parseFloat(v) || 0})} />
                      <InputGroup label="Clothing Allow ($/yr)" prefix="$" value={earningsParams.clothingAllowance} onChange={v => setEarningsParams({...earningsParams, clothingAllowance: parseFloat(v) || 0})} />
                    </div>
                    <InputGroup label="Other Benefits ($/yr)" prefix="$" value={earningsParams.otherBenefits} onChange={v => setEarningsParams({...earningsParams, otherBenefits: parseFloat(v) || 0})} />
                    <div className="bg-sky/10 p-2 rounded text-xs text-center">
                      <span className="text-muted-foreground">Total Annual Fringe: </span>
                      <strong>{fmtUSD(algebraic.flatFringeAmount)}</strong>
                      <span className="text-muted-foreground ml-2">({earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1) : 0}% of base)</span>
                    </div>
                  </div>
                ) : (
                  <InputGroup label="ECEC Loading Rate" suffix="%" value={earningsParams.fringeRate} onChange={v => setEarningsParams({...earningsParams, fringeRate: parseFloat(v) || 0})} />
                )}
              </Card>

              {/* ECONOMIC FACTORS */}
              <Card className="p-4 border-l-4 border-l-emerald">
                <SectionHeader icon={TrendingUp} title="Economic Variables" />
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Growth & Discounting</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Wage Growth Rate" suffix="%" value={earningsParams.wageGrowth} onChange={v => setEarningsParams({...earningsParams, wageGrowth: parseFloat(v) || 0})} />
                    <InputGroup label="Discount Rate" suffix="%" value={earningsParams.discountRate} onChange={v => setEarningsParams({...earningsParams, discountRate: parseFloat(v) || 0})} />
                  </div>
                  
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground pt-2">Unemployment Adjustment</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Unemployment Rate" suffix="%" value={earningsParams.unemploymentRate} onChange={v => setEarningsParams({...earningsParams, unemploymentRate: parseFloat(v) || 0})} />
                    <InputGroup label="UI Replacement Rate" suffix="%" value={earningsParams.uiReplacementRate} onChange={v => setEarningsParams({...earningsParams, uiReplacementRate: parseFloat(v) || 0})} />
                  </div>

                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground pt-2">Tax Rates</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label="Federal Tax Rate" suffix="%" value={earningsParams.fedTaxRate} onChange={v => setEarningsParams({...earningsParams, fedTaxRate: parseFloat(v) || 0})} />
                    <InputGroup label="State Tax Rate" suffix="%" value={earningsParams.stateTaxRate} onChange={v => setEarningsParams({...earningsParams, stateTaxRate: parseFloat(v) || 0})} />
                  </div>
                  <div className="bg-muted p-2 rounded text-xs text-center">
                    <span className="text-muted-foreground">Combined Tax Rate: </span>
                    <strong>{fmtPct(algebraic.combinedTaxRate)}</strong>
                  </div>
                </div>
              </Card>

              {/* HOUSEHOLD SERVICES */}
              <Card className="p-4 border-l-4 border-l-rose">
                <div className="flex justify-between items-center mb-3">
                  <SectionHeader icon={Home} title="Household Services" subtitle="Loss of domestic capacity" />
                  <label className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <input type="checkbox" checked={hhServices.active} onChange={e => setHhServices({...hhServices, active: e.target.checked})} className="w-4 h-4 rounded" />
                    Include
                  </label>
                </div>
                {hhServices.active && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Lost Hours/Week" value={hhServices.hoursPerWeek} onChange={v => setHhServices({...hhServices, hoursPerWeek: parseFloat(v) || 0})} />
                      <InputGroup label="Hourly Rate" prefix="$" value={hhServices.hourlyRate} onChange={v => setHhServices({...hhServices, hourlyRate: parseFloat(v) || 0})} />
                    </div>
                    <InputGroup label="Growth Rate" suffix="%" value={hhServices.growthRate} onChange={v => setHhServices({...hhServices, growthRate: parseFloat(v) || 0})} />
                    <div className="bg-rose/10 rounded-lg p-2 text-center">
                      <span className="block text-[10px] uppercase font-bold text-rose">Total HH Services PV</span>
                      <span className="font-bold text-rose text-lg">{fmtUSD(hhsData.totalPV)}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* NARRATIVES */}
              <Card className="p-4 border-l-4 border-l-accent">
                <SectionHeader icon={BookOpen} title="Narrative Sections" subtitle="For Report Body" />
                <div className="space-y-1">
                  <TextArea label="Medical Summary" value={caseInfo.medicalSummary} onChange={v => setCaseInfo({...caseInfo, medicalSummary: v})} placeholder="Briefly describe injuries and medical treatment..." rows={2} />
                  <TextArea label="Employment History" value={caseInfo.employmentHistory} onChange={v => setCaseInfo({...caseInfo, employmentHistory: v})} placeholder="List job history with dates and positions..." rows={2} />
                  <TextArea label="Earnings History" value={caseInfo.earningsHistory} onChange={v => setCaseInfo({...caseInfo, earningsHistory: v})} placeholder="W-2s, 1040s, earnings documentation..." rows={2} />
                  <TextArea label="Pre-Injury Capacity" value={caseInfo.preInjuryCapacity} onChange={v => setCaseInfo({...caseInfo, preInjuryCapacity: v})} placeholder="Describe pre-injury earning capacity basis..." rows={2} />
                  <TextArea label="Post-Injury Capacity" value={caseInfo.postInjuryCapacity} onChange={v => setCaseInfo({...caseInfo, postInjuryCapacity: v})} placeholder="Describe post-injury residual capacity..." rows={2} />
                  <TextArea label="Functional Limitations" value={caseInfo.functionalLimitations} onChange={v => setCaseInfo({...caseInfo, functionalLimitations: v})} placeholder="Describe functional limitations and future employability..." rows={2} />
                </div>
              </Card>

              {/* RESULTS SUMMARY */}
              <Card className="p-4 bg-navy text-primary-foreground border-none">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Damage Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Past Lost Earnings:</span>
                    <span className="font-bold">{fmtUSD(projection.totalPastLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Future Lost Earnings (PV):</span>
                    <span className="font-bold">{fmtUSD(projection.totalFuturePV)}</span>
                  </div>
                  {hhServices.active && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Household Services (PV):</span>
                      <span className="font-bold">{fmtUSD(hhsData.totalPV)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Life Care Plan (PV):</span>
                    <span className="font-bold">{fmtUSD(lcpData.totalPV)}</span>
                  </div>
                  <div className="border-t border-muted-foreground/30 pt-2 mt-2 flex justify-between">
                    <span className="text-muted-foreground font-bold">GRAND TOTAL:</span>
                    <span className="text-2xl font-bold text-emerald">{fmtUSD(grandTotal)}</span>
                  </div>
                </div>
              </Card>

              {/* TABLE */}
              <Card className="flex flex-col h-[350px]">
                <div className="bg-muted border-b border-border p-2 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Table className="w-4 h-4"/> Damage Schedule</span>
                  <button onClick={copyTable} className="text-xs bg-background border border-border px-2 py-1 rounded shadow-sm hover:bg-muted flex items-center gap-1 text-muted-foreground">
                    {copySuccess ? <Check className="w-3 h-3 text-emerald"/> : <Copy className="w-3 h-3"/>} Copy
                  </button>
                </div>
                <div className="overflow-auto flex-1 bg-card">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-muted text-muted-foreground font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-2 text-left">Year</th>
                        <th className="p-2">Gross</th>
                        <th className="p-2 bg-indigo-muted text-indigo">Net Loss</th>
                        <th className="p-2">PV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {projection.pastSchedule.map((row) => (
                        <tr key={row.year} className="bg-muted/30">
                          <td className="p-2 text-left text-muted-foreground">{row.year} <span className="opacity-75 text-[9px]">PAST</span></td>
                          <td className="p-2 text-muted-foreground">{fmtUSD(row.grossBase)}</td>
                          <td className="p-2 bg-indigo-muted/50 text-indigo font-medium">{fmtUSD(row.netLoss)}</td>
                          <td className="p-2 text-muted-foreground">-</td>
                        </tr>
                      ))}
                      {projection.futureSchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-muted/50">
                          <td className="p-2 text-left text-muted-foreground">{row.year}</td>
                          <td className="p-2 text-foreground">{fmtUSD(row.gross)}</td>
                          <td className="p-2 bg-indigo-muted/30 text-indigo font-bold">{fmtUSD(row.netLoss)}</td>
                          <td className="p-2 text-foreground font-bold">{fmtUSD(row.pv)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          </div>
        )}

        {/* --- TAB: LCP --- */}
        {activeTab === 'lcp' && (
          <div className="animate-fade-in space-y-4">
            <Card>
              <div className="p-4 border-b border-border bg-muted flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-foreground">Life Care Plan</h2>
                  <p className="text-xs text-muted-foreground">Future cost of healthcare services</p>
                </div>
                <button onClick={() => setLcpItems([...lcpItems, {id: Date.now(), categoryId: 'evals', name:'New Item', baseCost:0, freqType:'annual', duration: Math.ceil(caseInfo.lifeExpectancy || 25), startYear:1, cpi: 2.88, recurrenceInterval:1}])} className="bg-indigo text-primary-foreground px-3 py-1.5 rounded-full text-sm hover:bg-indigo-light flex gap-2 items-center shadow-lg transform active:scale-95 transition-all"><Plus className="w-4 h-4"/> Add Item</button>
              </div>
              <div className="p-4 grid grid-cols-1 gap-3">
                {lcpItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No life care plan items yet. Click "Add Item" to begin.</p>
                )}
                {lcpItems.map(item => (
                  <div key={item.id} className="relative bg-card border border-border p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Category</label>
                        <select className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 focus:ring-1 focus:ring-primary text-foreground" value={item.categoryId} onChange={(e) => {
                          const cat = CPI_CATEGORIES.find(c=>c.id===e.target.value);
                          setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, categoryId:e.target.value, cpi:cat?cat.rate:0}:i));
                        }}>
                          {CPI_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Description</label>
                        <input className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.name} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, name:e.target.value}:i))}/>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Cost ($)</label>
                        <input type="number" className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.baseCost} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, baseCost:parseFloat(e.target.value) || 0}:i))}/>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Frequency</label>
                        <select className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.freqType} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, freqType:e.target.value}:i))}>
                          <option value="annual">Annual</option>
                          <option value="onetime">One Time</option>
                          <option value="recurring">Recurring (Every X Yrs)</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Duration</label>
                        <input type="number" className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.duration} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, duration:parseInt(e.target.value) || 1}:i))}/>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Start Yr</label>
                        <input type="number" className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.startYear} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, startYear:parseInt(e.target.value) || 1}:i))}/>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">CPI %</label>
                        <input type="number" step="0.01" className="w-full text-sm font-medium bg-muted rounded border-none py-1.5 text-foreground" value={item.cpi} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, cpi:parseFloat(e.target.value) || 0}:i))}/>
                      </div>
                      <div className="md:col-span-1 flex items-end justify-end gap-2">
                        <button onClick={()=>setLcpItems(lcpItems.filter(i=>i.id!==item.id))} className="text-muted-foreground hover:text-rose p-1"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {lcpItems.length > 0 && (
                <div className="p-4 bg-muted border-t border-border flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">Life Care Plan Total (Present Value):</span>
                  <span className="text-xl font-bold text-indigo">{fmtUSD(lcpData.totalPV)}</span>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* --- TAB: REPORT --- */}
        {activeTab === 'report' && (
          <div className="bg-white shadow-2xl max-w-[21cm] mx-auto min-h-[29.7cm] p-[1.5cm] print:shadow-none print:p-0 print:w-full animate-fade-in text-slate-900 text-[11pt] leading-relaxed">
            
            {/* COVER PAGE HEADER */}
            <div className="text-center mb-8 pb-6 border-b-2 border-slate-900">
              <h1 className="text-2xl font-serif font-bold text-slate-900 mb-2">APPRAISAL OF ECONOMIC LOSS</h1>
              <div className="text-sm font-serif text-slate-600 mt-4">
                <strong>PREPARED BY:</strong> Kincaid Wolstein Vocational and Rehabilitation Services<br/>
                One University Plaza ~ Suite 302<br/>
                Hackensack, New Jersey 07601<br/>
                Phone: (201) 343-0700
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-sm font-serif">
              <div>
                <p><strong>PREPARED FOR:</strong> {caseInfo.attorney || '[Attorney Name]'}</p>
                <p>{caseInfo.lawFirm || '[Law Firm]'}</p>
              </div>
              <div className="text-right">
                <p><strong>REGARDING:</strong> {caseInfo.plaintiff || '[Plaintiff Name]'}</p>
                <p><strong>DATE OF BIRTH:</strong> {caseInfo.dob ? new Date(caseInfo.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DOB]'}</p>
                <p><strong>REPORT DATE:</strong> {caseInfo.reportDate ? new Date(caseInfo.reportDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[Report Date]'}</p>
              </div>
            </div>

            {/* CERTIFICATION */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Certification</h2>
              <p className="font-serif text-justify text-[10pt] leading-relaxed text-slate-700">
                This is to certify that we are not related to any of the parties to the subject action, nor do we have any present or intended financial interest in this case beyond the fees due for professional services rendered in connection with this report and possible subsequent services. Further, we certify that our professional fees are not contingent on the outcome of this matter but are based on the services provided to counsel in connection with subject action. This is to further certify that all assumptions, methodologies, and calculations utilized in this appraisal report are based on current knowledge and methods applied to the determination of projected pecuniary losses, consistent with accepted practices in forensic economics.
              </p>
            </section>

            {/* PURPOSE */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Purpose of Appraisal</h2>
              <p className="font-serif text-justify text-[10pt] leading-relaxed text-slate-700">
                Kincaid Wolstein Vocational and Rehabilitation Services was retained by {caseInfo.lawFirm || '[Law Firm]'} to evaluate the economic losses of {caseInfo.plaintiff || '[Plaintiff Name]'} arising from {caseInfo.caseType === 'Personal Injury' ? 'an injury' : 'an event'} on {caseInfo.dateOfInjury ? new Date(caseInfo.dateOfInjury).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[Date of Injury]'}. The purpose of this appraisal is to quantify past and future losses in wages, fringe benefits, and related employment earnings by integrating case-specific documentation with authoritative labor-market and demographic data, and by applying standard forensic economic methods. {lcpItems.length > 0 ? 'There was also an analysis of future cost of healthcare services.' : ''} {hhServices.active ? 'Loss of household services was also analyzed.' : ''}
              </p>
            </section>

            {/* OPINION */}
            <section className="mb-8">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Opinion of Economic Losses</h2>
              <p className="font-serif text-justify mb-4 text-[10pt] leading-relaxed text-slate-700">
                Within a reasonable degree of economic certainty, and subject to the assumptions and limitations set forth in this report, it is my professional opinion that {caseInfo.plaintiff || '[Plaintiff Name]'} has sustained compensable economic losses arising from lost earning capacity and associated employment benefits. The table below summarizes past, future, and total economic losses.
              </p>
              
              <table className="w-full border border-slate-400 text-[10pt] font-serif mb-4">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left border-r border-slate-300 font-bold">Category</th>
                    <th className="p-2 text-right border-r border-slate-300 font-bold">Past Value</th>
                    <th className="p-2 text-right border-r border-slate-300 font-bold">Future (PV)</th>
                    <th className="p-2 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-300">
                    <td className="p-2 border-r border-slate-300">Lost Earning Capacity</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalPastLoss)}</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalFuturePV)}</td>
                    <td className="p-2 text-right font-bold">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
                  </tr>
                  {hhServices.active && (
                    <tr className="border-t border-slate-300">
                      <td className="p-2 border-r border-slate-300">Household Services</td>
                      <td className="p-2 text-right border-r border-slate-300 text-slate-400">—</td>
                      <td className="p-2 text-right border-r border-slate-300">{fmtUSD(hhsData.totalPV)}</td>
                      <td className="p-2 text-right font-bold">{fmtUSD(hhsData.totalPV)}</td>
                    </tr>
                  )}
                  {lcpItems.length > 0 && (
                    <tr className="border-t border-slate-300">
                      <td className="p-2 border-r border-slate-300">Future Cost of Healthcare</td>
                      <td className="p-2 text-right border-r border-slate-300 text-slate-400">—</td>
                      <td className="p-2 text-right border-r border-slate-300">{fmtUSD(lcpData.totalPV)}</td>
                      <td className="p-2 text-right font-bold">{fmtUSD(lcpData.totalPV)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                    <td className="p-2 border-r border-slate-300">GRAND TOTAL</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalPastLoss)}</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV)}</td>
                    <td className="p-2 text-right text-lg">{fmtUSD(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-[9pt] text-slate-500 italic">
                Exclusions: This appraisal does not address non-economic damages such as pain and suffering, loss of enjoyment of life, or emotional distress, unless explicitly stated otherwise.
              </p>
            </section>

            {/* BACKGROUND FACTS */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Background Facts and Assumptions</h2>
              
              <h3 className="font-bold text-slate-800 mb-2 text-[10pt]">Summary Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10pt] font-serif mb-4">
                <p><strong>Plaintiff:</strong> {caseInfo.plaintiff} ({caseInfo.gender})</p>
                <p><strong>Date of Birth:</strong> {caseInfo.dob ? new Date(caseInfo.dob).toLocaleDateString() : '—'}</p>
                <p><strong>Date of Injury:</strong> {caseInfo.dateOfInjury ? new Date(caseInfo.dateOfInjury).toLocaleDateString() : '—'}</p>
                <p><strong>Residence:</strong> {[caseInfo.city, caseInfo.county, caseInfo.state].filter(Boolean).join(', ') || '—'}</p>
                <p><strong>Education:</strong> {caseInfo.education || '—'}</p>
                <p><strong>Marital Status:</strong> {caseInfo.maritalStatus}{caseInfo.dependents ? `; ${caseInfo.dependents}` : ''}</p>
                <p><strong>Current Age:</strong> {dateCalc.currentAge} years</p>
                <p><strong>Age at Injury:</strong> {dateCalc.ageInjury} years</p>
                <p><strong>Life Expectancy:</strong> {caseInfo.lifeExpectancy || '—'} years</p>
                <p><strong>Work Life Expectancy:</strong> {earningsParams.wle} years</p>
                <p><strong>Years to Separation:</strong> {dateCalc.derivedYFS.toFixed(2)} years</p>
                <p><strong>Work Life Factor:</strong> {workLifeFactor.toFixed(2)}%</p>
                <p><strong>Growth Rate:</strong> {earningsParams.wageGrowth}%</p>
                <p><strong>Discount Rate:</strong> {earningsParams.discountRate}%</p>
              </div>
              
              {caseInfo.medicalSummary && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Medical Summary</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.medicalSummary}</p>
                </div>
              )}
              {caseInfo.employmentHistory && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Occupation and Employment</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.employmentHistory}</p>
                </div>
              )}
              {caseInfo.earningsHistory && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Earnings History</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.earningsHistory}</p>
                </div>
              )}
              {caseInfo.preInjuryCapacity && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Pre-Injury Earnings Capacity</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.preInjuryCapacity}</p>
                </div>
              )}
              {caseInfo.postInjuryCapacity && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Post-Injury Earnings Capacity</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.postInjuryCapacity}</p>
                </div>
              )}
              {caseInfo.functionalLimitations && (
                <div className="mb-3">
                  <h3 className="font-bold text-slate-800 mb-1 text-[10pt]">Functionality and Future Employability</h3>
                  <p className="text-justify text-slate-600 text-[10pt]">{caseInfo.functionalLimitations}</p>
                </div>
              )}
            </section>

            {/* FRINGE BENEFITS */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Fringe Benefits</h2>
              {isUnionMode ? (
                <div className="text-[10pt]">
                  <h3 className="font-bold text-slate-800 mb-2">Fringe Benefits – Union Plan Method</h3>
                  <p className="mb-2">Payroll and benefit-plan records indicate the following employer-paid fringe benefits:</p>
                  <ul className="list-disc ml-6 mb-2">
                    <li>Pension Fund: {fmtUSD(earningsParams.pension)} per year</li>
                    <li>Health and Welfare Fund: {fmtUSD(earningsParams.healthWelfare)} per year</li>
                    <li>Annuity or Defined Contribution Fund: {fmtUSD(earningsParams.annuity)} per year</li>
                    <li>Clothing/Uniform Allowance: {fmtUSD(earningsParams.clothingAllowance)} per year</li>
                    <li>Other Benefits: {fmtUSD(earningsParams.otherBenefits)} per year</li>
                  </ul>
                  <p><strong>Total Annual Union Fringe Benefits:</strong> {fmtUSD(algebraic.flatFringeAmount)}</p>
                  <p><strong>Union Fringe Loading Rate:</strong> {earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(2) : 0}%</p>
                </div>
              ) : (
                <div className="text-[10pt]">
                  <h3 className="font-bold text-slate-800 mb-2">Fringe Benefits – ECEC Benchmark Method</h3>
                  <p>For this analysis, fringe benefits are estimated using the U.S. Bureau of Labor Statistics Employer Costs for Employee Compensation (ECEC) series. The ECEC discretionary fringe rate applied is <strong>{earningsParams.fringeRate}%</strong>.</p>
                </div>
              )}
            </section>

            {/* ADJUSTED EARNINGS FACTOR */}
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Adjusted Earnings Factor (AEF) – Algebraic Method</h2>
              <p className="font-serif text-[10pt] mb-3">
                The Adjusted Earnings Factor combines several adjustments into a single multiplicative term, following the methodology established by Tinari (2016).
              </p>
              <table className="w-full text-[10pt] font-serif border border-slate-400">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left border-r border-slate-300 font-bold">Component</th>
                    <th className="p-2 text-right border-r border-slate-300 font-bold">Value</th>
                    <th className="p-2 text-right font-bold">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-300">
                    <td className="p-2 border-r border-slate-300">Work Life Factor (WLE/YFS)</td>
                    <td className="p-2 text-right border-r border-slate-300">{algebraic.wlf.toFixed(4)}</td>
                    <td className="p-2 text-right">{algebraic.wlf.toFixed(4)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="p-2 border-r border-slate-300">Net Unemployment Factor (1 − UF × [1 − UI])</td>
                    <td className="p-2 text-right border-r border-slate-300">{algebraic.unempFactor.toFixed(4)}</td>
                    <td className="p-2 text-right">{(algebraic.wlf * algebraic.unempFactor).toFixed(4)}</td>
                  </tr>
                  <tr className="border-t border-slate-300">
                    <td className="p-2 border-r border-slate-300">After-Tax Factor (1 − TR)</td>
                    <td className="p-2 text-right border-r border-slate-300">{algebraic.afterTaxFactor.toFixed(4)}</td>
                    <td className="p-2 text-right">{(algebraic.wlf * algebraic.unempFactor * algebraic.afterTaxFactor).toFixed(4)}</td>
                  </tr>
                  <tr className="border-t border-slate-300 bg-indigo-50 font-bold">
                    <td className="p-2 border-r border-slate-300">Fringe Benefit Factor (1 + FB)</td>
                    <td className="p-2 text-right border-r border-slate-300">{algebraic.fringeFactor.toFixed(4)}</td>
                    <td className="p-2 text-right border-l-4 border-indigo-500">{algebraic.fullMultiplier.toFixed(5)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* LCP SUMMARY IN REPORT */}
            {lcpItems.length > 0 && (
              <section className="mb-8 break-inside-avoid">
                <h2 className="text-base font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-3">Future Cost of Healthcare</h2>
                <table className="w-full text-[10pt] font-serif border border-slate-400">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left border-r border-slate-300 font-bold">Service Category</th>
                      <th className="p-2 text-left border-r border-slate-300 font-bold">Description</th>
                      <th className="p-2 text-right border-r border-slate-300 font-bold">Base Cost</th>
                      <th className="p-2 text-right border-r border-slate-300 font-bold">CPI %</th>
                      <th className="p-2 text-right font-bold">Present Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lcpData.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-slate-300">
                        <td className="p-2 border-r border-slate-300">{CPI_CATEGORIES.find(c => c.id === item.categoryId)?.label || item.categoryId}</td>
                        <td className="p-2 border-r border-slate-300">{item.name}</td>
                        <td className="p-2 text-right border-r border-slate-300">{fmtUSD(item.baseCost)}</td>
                        <td className="p-2 text-right border-r border-slate-300">{item.cpi}%</td>
                        <td className="p-2 text-right font-bold">{fmtUSD(item.totalPV)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-900 bg-slate-50 font-bold">
                      <td colSpan={4} className="p-2 border-r border-slate-300 text-right">TOTAL LIFE CARE PLAN (PV)</td>
                      <td className="p-2 text-right">{fmtUSD(lcpData.totalPV)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* PRINT BUTTON */}
            <div className="text-center print:hidden mt-12">
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 flex items-center gap-2 mx-auto transform transition-all active:scale-95">
                <FileText className="w-5 h-5" /> Print Official Report
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
