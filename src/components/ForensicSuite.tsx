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
  BookOpen
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
  plaintiff: string;
  fileNumber: string;
  attorney: string;
  reportDate: string;
  gender: string;
  dob: string;
  education: string;
  maritalStatus: string;
  residence: string;
  dateOfInjury: string;
  dateOfTrial: string;
  retirementAge: number;
  medicalSummary: string;
  employmentHistory: string;
}

interface EarningsParams {
  baseEarnings: number;
  residualEarnings: number;
  wle: number;
  wageGrowth: number;
  discountRate: number;
  fringeRate: number;
  pension: number;
  healthWelfare: number;
  annuity: number;
  otherBenefits: number;
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
  <div className={`mb-4 ${className}`}>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
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
        className={`block w-full rounded-lg border-border py-2.5 focus:ring-primary focus:border-primary text-sm border px-3 transition-all bg-background text-foreground ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${disabled ? 'bg-muted cursor-not-allowed' : ''}`}
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-muted-foreground sm:text-sm font-medium">{suffix}</span>
        </div>
      )}
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder = "" }: TextAreaProps) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-lg border-border py-2.5 focus:ring-primary focus:border-primary text-sm border px-3 transition-all resize-none bg-background text-foreground"
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
    const saved = localStorage.getItem('fs_case_v8');
    return saved ? JSON.parse(saved) : {
      plaintiff: 'Jane Doe',
      fileNumber: 'KW-2025-001',
      attorney: 'Law Firm LLP',
      reportDate: new Date().toISOString().split('T')[0],
      gender: 'Female',
      dob: '1980-05-15',
      education: 'Bachelor of Science',
      maritalStatus: 'Married',
      residence: 'Hackensack, NJ',
      dateOfInjury: '2023-06-15',
      dateOfTrial: '2025-09-01', 
      retirementAge: 67.0,
      medicalSummary: '',
      employmentHistory: ''
    };
  });

  const [earningsParams, setEarningsParams] = useState<EarningsParams>(() => {
    const saved = localStorage.getItem('fs_params_v8');
    return saved ? JSON.parse(saved) : {
      baseEarnings: 85000,
      residualEarnings: 0,
      wle: 15.5,
      wageGrowth: 3.50,
      discountRate: 4.25,
      fringeRate: 21.5, 
      pension: 5000,
      healthWelfare: 12000,
      annuity: 2000,
      otherBenefits: 500,
      unemploymentRate: 4.2,
      uiReplacementRate: 40.0,
      fedTaxRate: 15.0,
      stateTaxRate: 4.5,
    };
  });

  const [hhServices, setHhServices] = useState<HhServices>(() => {
    const saved = localStorage.getItem('fs_hhs_v8');
    return saved ? JSON.parse(saved) : {
      active: false,
      hoursPerWeek: 10,
      hourlyRate: 25.00,
      growthRate: 3.0,
      discountRate: 4.25
    };
  });

  const [pastActuals, setPastActuals] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('fs_past_actuals_v8');
    return saved ? JSON.parse(saved) : {};
  });

  const [lcpItems, setLcpItems] = useState<LcpItem[]>(() => {
    const saved = localStorage.getItem('fs_lcp_v8');
    return saved ? JSON.parse(saved) : [
      { id: 1, categoryId: 'evals', name: 'Physiatrist Eval', baseCost: 350, freqType: 'annual', duration: 25, startYear: 1, cpi: 2.88, recurrenceInterval: 1 },
    ];
  });

  // --- AUTO-CALC ENGINE ---
  const dateCalc = useMemo(() => {
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) return { ageInjury: '0', ageTrial: '0', pastYears: 0, derivedYFS: 0 };

    const dob = new Date(caseInfo.dob);
    const doi = new Date(caseInfo.dateOfInjury);
    const dot = new Date(caseInfo.dateOfTrial);

    const getAge = (d: Date) => (d.getTime() - dob.getTime()) / msPerYear;
    const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / msPerYear);
    
    const targetRetirementDate = new Date(dob);
    targetRetirementDate.setFullYear(dob.getFullYear() + caseInfo.retirementAge);
    const derivedYFS = Math.max(0, (targetRetirementDate.getTime() - dot.getTime()) / msPerYear);

    return { 
      ageInjury: getAge(doi).toFixed(2), 
      ageTrial: getAge(dot).toFixed(2),
      pastYears,
      derivedYFS
    };
  }, [caseInfo]);

  // Auto-Save
  useEffect(() => { localStorage.setItem('fs_case_v8', JSON.stringify(caseInfo)); }, [caseInfo]);
  useEffect(() => { localStorage.setItem('fs_params_v8', JSON.stringify(earningsParams)); }, [earningsParams]);
  useEffect(() => { localStorage.setItem('fs_lcp_v8', JSON.stringify(lcpItems)); }, [lcpItems]);
  useEffect(() => { localStorage.setItem('fs_past_actuals_v8', JSON.stringify(pastActuals)); }, [pastActuals]);
  useEffect(() => { localStorage.setItem('fs_hhs_v8', JSON.stringify(hhServices)); }, [hhServices]);

  // --- PROJECTION ENGINE ---
  const algebraic = useMemo(() => {
    const yfs = dateCalc.derivedYFS;
    const wlf = yfs > 0 ? (earningsParams.wle / yfs) : 0;
    const unempFactor = 1 - ((earningsParams.unemploymentRate / 100) * (1 - (earningsParams.uiReplacementRate / 100)));
    const afterTaxFactor = (1 - (earningsParams.fedTaxRate / 100)) * (1 - (earningsParams.stateTaxRate / 100));
    
    let fringeFactor = 1;
    let flatFringeAmount = 0;

    if (isUnionMode) {
      flatFringeAmount = earningsParams.pension + earningsParams.healthWelfare + earningsParams.annuity + earningsParams.otherBenefits;
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

    return { wlf, unempFactor, afterTaxFactor, fringeFactor, fullMultiplier, realizedMultiplier, yfs, flatFringeAmount };
  }, [dateCalc, earningsParams, strictAlgebraicMode, isUnionMode]);

  const projection = useMemo(() => {
    const pastSchedule: Array<{ year: number; label: string; grossBase: number; grossActual: number; netLoss: number; isManual: boolean; fraction: number }> = [];
    const futureSchedule: Array<{ year: number; gross: number; netLoss: number; pv: number }> = [];
    let totalPastLoss = 0, totalFutureNominal = 0, totalFuturePV = 0;

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

  const copyTable = () => {
    const txt = projection.futureSchedule.map(r => `${r.year}\t${r.gross.toFixed(2)}\t${r.netLoss.toFixed(2)}\t${r.pv.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`Year\tGross\tNetLoss\tPV\n${txt}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 print:bg-card print:pb-0">
      
      {/* NAVBAR */}
      <nav className="bg-navy text-primary-foreground sticky top-0 z-50 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo to-indigo-light p-2 rounded-lg shadow-lg">
              <Sigma className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">ForensicSuite <span className="text-indigo-light font-light">V8</span></h1>
              <h1 className="font-bold text-lg tracking-tight sm:hidden">FS<span className="text-indigo-light font-light">V8</span></h1>
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
            <div className="lg:col-span-4 space-y-6">
              
              {/* 1. CASE INFO / DEMOGRAPHICS */}
              <Card className="p-5 border-l-4 border-l-indigo">
                <SectionHeader icon={User} title="Case Information" subtitle="Demographics & Meta Data" />
                <div className="space-y-4">
                  <InputGroup label="Plaintiff" type="text" value={caseInfo.plaintiff} onChange={v => setCaseInfo({...caseInfo, plaintiff: v})} />
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="Gender" type="text" value={caseInfo.gender} onChange={v => setCaseInfo({...caseInfo, gender: v})} />
                    <InputGroup label="Marital Status" type="text" value={caseInfo.maritalStatus} onChange={v => setCaseInfo({...caseInfo, maritalStatus: v})} />
                  </div>
                  <InputGroup label="Education" type="text" value={caseInfo.education} onChange={v => setCaseInfo({...caseInfo, education: v})} />
                  <InputGroup label="Residence" type="text" value={caseInfo.residence} onChange={v => setCaseInfo({...caseInfo, residence: v})} />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <InputGroup label="Attorney" type="text" value={caseInfo.attorney} onChange={v => setCaseInfo({...caseInfo, attorney: v})} />
                    <InputGroup label="Report Date" type="date" value={caseInfo.reportDate} onChange={v => setCaseInfo({...caseInfo, reportDate: v})} />
                  </div>
                </div>
              </Card>

              {/* 2. DATES & VOCATIONAL */}
              <Card className="p-5 border-l-4 border-l-sky">
                <SectionHeader icon={CalendarIcon} title="Dates & Earnings" subtitle="Calculates Ages & Durations" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="DOB" type="date" value={caseInfo.dob} onChange={v => setCaseInfo({...caseInfo, dob: v})} />
                    <InputGroup label="Injury" type="date" value={caseInfo.dateOfInjury} onChange={v => setCaseInfo({...caseInfo, dateOfInjury: v})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="Trial" type="date" value={caseInfo.dateOfTrial} onChange={v => setCaseInfo({...caseInfo, dateOfTrial: v})} />
                    <InputGroup label="Retire Age" value={caseInfo.retirementAge} onChange={v => setCaseInfo({...caseInfo, retirementAge: parseFloat(v) || 0})} />
                  </div>
                  
                  <div className="bg-sky-muted p-3 rounded-lg border border-sky/20 text-xs flex justify-between">
                    <span>Age Injury: <strong>{dateCalc.ageInjury}</strong></span>
                    <span>Age Trial: <strong>{dateCalc.ageTrial}</strong></span>
                  </div>

                  <InputGroup label="Work Life Expectancy (WLE)" suffix="Yrs" value={earningsParams.wle} onChange={v => setEarningsParams({...earningsParams, wle: parseFloat(v) || 0})} />
                  <InputGroup label="Base Annual Earnings" prefix="$" value={earningsParams.baseEarnings} onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} />
                </div>
              </Card>

              {/* 3. NARRATIVES */}
              <Card className="p-5 border-l-4 border-l-accent">
                <SectionHeader icon={BookOpen} title="Narrative Inputs" subtitle="For Report Body" />
                <TextArea label="Medical Summary" value={caseInfo.medicalSummary} onChange={v => setCaseInfo({...caseInfo, medicalSummary: v})} placeholder="Briefly describe the injury..." />
                <TextArea label="Employment History" value={caseInfo.employmentHistory} onChange={v => setCaseInfo({...caseInfo, employmentHistory: v})} placeholder="List previous jobs..." />
              </Card>

              {/* 4. PAST ACTUALS */}
              <Card className="p-5 border-l-4 border-l-indigo max-h-[300px] overflow-y-auto">
                <SectionHeader icon={History} title="Past Actuals" subtitle="Offset Loss" />
                <div className="space-y-2">
                  {projection.pastSchedule.map((row) => (
                    <div key={row.year} className="flex items-center gap-3">
                      <div className="w-1/3">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">{row.year}</label>
                      </div>
                      <div className="w-2/3">
                        <input 
                          type="number" 
                          className="block w-full rounded-md border-border py-1 text-sm bg-background text-foreground" 
                          placeholder="Actual $"
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

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* VARIABLES & FRINGES */}
              <Card className="p-5 border-l-4 border-l-emerald">
                <SectionHeader icon={TrendingUp} title="Economic Factors" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Risk & Tax</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Unemp %" value={earningsParams.unemploymentRate} onChange={v => setEarningsParams({...earningsParams, unemploymentRate: parseFloat(v) || 0})} />
                      <InputGroup label="UI Repl %" value={earningsParams.uiReplacementRate} onChange={v => setEarningsParams({...earningsParams, uiReplacementRate: parseFloat(v) || 0})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InputGroup label="Fed Tax %" value={earningsParams.fedTaxRate} onChange={v => setEarningsParams({...earningsParams, fedTaxRate: parseFloat(v) || 0})} />
                      <InputGroup label="State Tax %" value={earningsParams.stateTaxRate} onChange={v => setEarningsParams({...earningsParams, stateTaxRate: parseFloat(v) || 0})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground">Fringe Benefits</h4>
                      <label className="text-[10px] flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={isUnionMode} onChange={e => setIsUnionMode(e.target.checked)} />
                        Union Mode
                      </label>
                    </div>
                    
                    {isUnionMode ? (
                      <div className="grid grid-cols-2 gap-2">
                        <InputGroup label="Pension ($/yr)" value={earningsParams.pension} onChange={v => setEarningsParams({...earningsParams, pension: parseFloat(v) || 0})} />
                        <InputGroup label="H&W ($/yr)" value={earningsParams.healthWelfare} onChange={v => setEarningsParams({...earningsParams, healthWelfare: parseFloat(v) || 0})} />
                        <InputGroup label="Annuity ($/yr)" value={earningsParams.annuity} onChange={v => setEarningsParams({...earningsParams, annuity: parseFloat(v) || 0})} />
                        <InputGroup label="Other ($/yr)" value={earningsParams.otherBenefits} onChange={v => setEarningsParams({...earningsParams, otherBenefits: parseFloat(v) || 0})} />
                      </div>
                    ) : (
                      <InputGroup label="ECEC Loading Rate %" value={earningsParams.fringeRate} onChange={v => setEarningsParams({...earningsParams, fringeRate: parseFloat(v) || 0})} />
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                  <InputGroup label="Wage Growth %" value={earningsParams.wageGrowth} onChange={v => setEarningsParams({...earningsParams, wageGrowth: parseFloat(v) || 0})} />
                  <InputGroup label="Discount Rate %" value={earningsParams.discountRate} onChange={v => setEarningsParams({...earningsParams, discountRate: parseFloat(v) || 0})} />
                </div>
              </Card>

              {/* HOUSEHOLD SERVICES */}
              <Card className="p-5 border-l-4 border-l-rose">
                <div className="flex justify-between items-center mb-4">
                  <SectionHeader icon={Home} title="Household Services" subtitle="Loss of domestic capacity" />
                  <label className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <input type="checkbox" checked={hhServices.active} onChange={e => setHhServices({...hhServices, active: e.target.checked})} className="w-4 h-4 text-rose rounded" />
                    Include in Damages
                  </label>
                </div>
                {hhServices.active && (
                  <div className="grid grid-cols-4 gap-4 animate-fade-in">
                    <InputGroup label="Lost Hrs/Wk" value={hhServices.hoursPerWeek} onChange={v => setHhServices({...hhServices, hoursPerWeek: parseFloat(v) || 0})} />
                    <InputGroup label="Rate $/Hr" value={hhServices.hourlyRate} onChange={v => setHhServices({...hhServices, hourlyRate: parseFloat(v) || 0})} />
                    <InputGroup label="Growth %" value={hhServices.growthRate} onChange={v => setHhServices({...hhServices, growthRate: parseFloat(v) || 0})} />
                    <div className="bg-rose/10 rounded-lg p-2 text-center">
                      <span className="block text-[10px] uppercase font-bold text-rose">Total PV</span>
                      <span className="font-bold text-rose">{fmtUSD(hhsData.totalPV)}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* RESULTS SUMMARY */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-navy text-primary-foreground border-none">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Total Future PV</h4>
                  <p className="text-3xl font-bold text-emerald">{fmtUSD(projection.totalFuturePV)}</p>
                  <p className="text-xs text-muted-foreground">Earnings Capacity Only</p>
                </Card>
                <Card className="p-4">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Grand Total</h4>
                  <p className="text-3xl font-bold text-foreground">{fmtUSD(projection.totalFuturePV + projection.totalPastLoss + hhsData.totalPV)}</p>
                  <p className="text-xs text-muted-foreground">Including Past & HH Services</p>
                </Card>
              </div>

              {/* TABLE */}
              <Card className="flex flex-col h-[400px]">
                <div className="bg-muted border-b border-border p-3 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Table className="w-4 h-4"/> Damage Schedule</span>
                  <button onClick={copyTable} className="text-xs bg-background border border-border px-2 py-1 rounded shadow-sm hover:bg-muted flex items-center gap-1 text-muted-foreground">
                    {copySuccess ? <Check className="w-3 h-3 text-emerald"/> : <Copy className="w-3 h-3"/>} Copy
                  </button>
                </div>
                <div className="overflow-auto flex-1 bg-card">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-muted text-muted-foreground font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 text-left">Year</th>
                        <th className="p-3">Gross Base</th>
                        <th className="p-3">Gross Actual</th>
                        <th className="p-3 bg-indigo-muted text-indigo">Net Loss</th>
                        <th className="p-3">PV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {projection.pastSchedule.map((row) => (
                        <tr key={row.year} className="bg-muted/30">
                          <td className="p-3 text-left text-muted-foreground">{row.year} <span className="opacity-75 text-[9px]">PAST</span></td>
                          <td className="p-3 text-muted-foreground">{fmtUSD(row.grossBase)}</td>
                          <td className="p-3 text-muted-foreground">{fmtUSD(row.grossActual)}</td>
                          <td className="p-3 bg-indigo-muted/50 text-indigo font-medium">{fmtUSD(row.netLoss)}</td>
                          <td className="p-3 text-muted-foreground">-</td>
                        </tr>
                      ))}
                      {projection.futureSchedule.map((row) => (
                        <tr key={row.year} className="hover:bg-muted/50">
                          <td className="p-3 text-left text-muted-foreground">{row.year}</td>
                          <td className="p-3 text-foreground">{fmtUSD(row.gross)}</td>
                          <td className="p-3 text-muted-foreground">-</td>
                          <td className="p-3 bg-indigo-muted/30 text-indigo font-bold">{fmtUSD(row.netLoss)}</td>
                          <td className="p-3 text-foreground font-bold">{fmtUSD(row.pv)}</td>
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
                <h2 className="font-bold text-foreground">Life Care Plan</h2>
                <button onClick={() => setLcpItems([...lcpItems, {id: Date.now(), categoryId: 'evals', name:'New Item', baseCost:0, freqType:'annual', duration:1, startYear:1, cpi:0, recurrenceInterval:1}])} className="bg-indigo text-primary-foreground px-3 py-1.5 rounded-full text-sm hover:bg-indigo-light flex gap-2 items-center shadow-lg transform active:scale-95 transition-all"><Plus className="w-4 h-4"/> Add Item</button>
              </div>
              <div className="p-4 grid grid-cols-1 gap-4">
                {lcpItems.map(item => (
                  <div key={item.id} className="relative bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Category</label>
                        <select className="w-full text-sm font-medium bg-muted rounded border-none py-2 focus:ring-1 focus:ring-primary text-foreground" value={item.categoryId} onChange={(e) => {
                          const cat = CPI_CATEGORIES.find(c=>c.id===e.target.value);
                          setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, categoryId:e.target.value, cpi:cat?cat.rate:0}:i));
                        }}>
                          {CPI_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label} ({c.rate}%)</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-4">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Description</label>
                        <input className="w-full text-sm font-medium bg-muted rounded border-none py-2 text-foreground" value={item.name} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, name:e.target.value}:i))}/>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Base Cost ($)</label>
                        <input type="number" className="w-full text-sm font-medium bg-muted rounded border-none py-2 text-foreground" value={item.baseCost} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, baseCost:parseFloat(e.target.value) || 0}:i))}/>
                      </div>
                      <div className="md:col-span-3 flex items-end justify-between">
                        <div className="w-full mr-4">
                          <label className="text-[9px] font-bold uppercase text-muted-foreground">Frequency</label>
                          <select className="w-full text-sm font-medium bg-muted rounded border-none py-2 text-foreground" value={item.freqType} onChange={e=>setLcpItems(lcpItems.map(i=>i.id===item.id?{...i, freqType:e.target.value}:i))}>
                            <option value="annual">Annual</option>
                            <option value="onetime">One Time</option>
                            <option value="recurring">Recurring</option>
                          </select>
                        </div>
                        <button onClick={()=>setLcpItems(lcpItems.filter(i=>i.id!==item.id))} className="text-muted-foreground hover:text-rose p-2"><Trash2 className="w-5 h-5"/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* --- TAB: REPORT --- */}
        {activeTab === 'report' && (
          <div className="bg-white shadow-2xl max-w-[21cm] mx-auto min-h-[29.7cm] p-[2cm] print:shadow-none print:p-0 print:w-full animate-fade-in text-slate-900">
            {/* HEADER */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 leading-none">APPRAISAL OF<br/>ECONOMIC LOSS</h1>
                <div className="mt-6 text-sm font-serif text-slate-600 leading-relaxed">
                  <strong>Kincaid Wolstein Vocational Services</strong><br/>
                  One University Plaza ~ Suite 302<br/>
                  Hackensack, New Jersey 07601
                </div>
              </div>
              <div className="text-right text-sm font-serif space-y-1">
                <div className="font-bold text-slate-900">RE: {caseInfo.plaintiff}</div>
                <div>DOB: {caseInfo.dob}</div>
                <div>Date of Injury: {caseInfo.dateOfInjury}</div>
                <div>Report Date: {caseInfo.reportDate}</div>
                <div>Prepared For: {caseInfo.attorney}</div>
              </div>
            </div>

            {/* 1. OPINION */}
            <section className="mb-10">
              <h2 className="text-lg font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-4 text-indigo-900">1. Opinion of Economic Losses</h2>
              <p className="font-serif text-justify mb-6 text-slate-800 text-sm leading-7">
                Within a reasonable degree of economic certainty, and subject to the assumptions set forth in this report, 
                it is my professional opinion that <strong>{caseInfo.plaintiff}</strong> has sustained compensable economic losses as summarized below.
              </p>
              
              <table className="w-full border border-slate-300 text-sm font-serif mb-4">
                <thead className="bg-slate-50 uppercase text-xs">
                  <tr>
                    <th className="p-2 text-left border-r border-slate-300">Category</th>
                    <th className="p-2 text-right border-r border-slate-300">Past Value</th>
                    <th className="p-2 text-right border-r border-slate-300">Future (PV)</th>
                    <th className="p-2 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border-r border-slate-300">Lost Earning Capacity</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalPastLoss)}</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalFuturePV)}</td>
                    <td className="p-2 text-right font-bold">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
                  </tr>
                  {hhServices.active && (
                    <tr>
                      <td className="p-2 border-r border-slate-300">Household Services</td>
                      <td className="p-2 text-right border-r border-slate-300 text-slate-400">-</td>
                      <td className="p-2 text-right border-r border-slate-300">{fmtUSD(hhsData.totalPV)}</td>
                      <td className="p-2 text-right font-bold">{fmtUSD(hhsData.totalPV)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 border-r border-slate-300">Life Care Plan</td>
                    <td className="p-2 text-right border-r border-slate-300 text-slate-400">-</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(lcpData.totalPV)}</td>
                    <td className="p-2 text-right font-bold">{fmtUSD(lcpData.totalPV)}</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2 border-r border-slate-300 uppercase">Grand Total</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalPastLoss)}</td>
                    <td className="p-2 text-right border-r border-slate-300">{fmtUSD(projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV)}</td>
                    <td className="p-2 text-right text-lg text-indigo-900">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            {/* 2. BACKGROUND FACTS */}
            <section className="mb-10 break-inside-avoid">
              <h2 className="text-lg font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-4 text-indigo-900">2. Background Facts</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-serif mb-6">
                <div>
                  <p><strong className="text-slate-600">Name:</strong> {caseInfo.plaintiff}</p>
                  <p><strong className="text-slate-600">Gender:</strong> {caseInfo.gender}</p>
                  <p><strong className="text-slate-600">Marital Status:</strong> {caseInfo.maritalStatus}</p>
                  <p><strong className="text-slate-600">Residence:</strong> {caseInfo.residence}</p>
                </div>
                <div>
                  <p><strong className="text-slate-600">Education:</strong> {caseInfo.education}</p>
                  <p><strong className="text-slate-600">Age at Injury:</strong> {dateCalc.ageInjury}</p>
                  <p><strong className="text-slate-600">Work Life Exp:</strong> {earningsParams.wle} Years</p>
                  <p><strong className="text-slate-600">Separation:</strong> {dateCalc.derivedYFS.toFixed(2)} Years</p>
                </div>
              </div>
              
              {caseInfo.medicalSummary && (
                <div className="mb-4">
                  <h3 className="font-bold text-slate-700 mb-1">Medical Summary</h3>
                  <p className="text-justify text-slate-600 leading-relaxed">{caseInfo.medicalSummary}</p>
                </div>
              )}
              {caseInfo.employmentHistory && (
                <div className="mb-4">
                  <h3 className="font-bold text-slate-700 mb-1">Employment History</h3>
                  <p className="text-justify text-slate-600 leading-relaxed">{caseInfo.employmentHistory}</p>
                </div>
              )}
            </section>

            {/* 3. ALGEBRAIC METHODOLOGY */}
            <section className="break-inside-avoid">
              <h2 className="text-lg font-bold font-serif uppercase border-b border-slate-300 pb-1 mb-4 text-indigo-900">3. Algebraic Earnings Factor</h2>
              <p className="font-serif text-sm mb-4">
                The Adjusted Earnings Factor (AEF) calculation below demonstrates the derivation of the net multiplier applied to base earning capacity.
              </p>
              <table className="w-full text-sm font-serif border border-slate-300">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-slate-50">
                    <td className="p-2 font-bold w-1/2">Component</td>
                    <td className="p-2 font-bold text-right">Value</td>
                    <td className="p-2 font-bold text-right">Cumulative</td>
                  </tr>
                  <tr>
                    <td className="p-2">Work Life Factor (WLF)</td>
                    <td className="p-2 text-right">{algebraic.wlf.toFixed(4)}</td>
                    <td className="p-2 text-right">{algebraic.wlf.toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td className="p-2">Net Unemployment (1-UF)</td>
                    <td className="p-2 text-right">{algebraic.unempFactor.toFixed(4)}</td>
                    <td className="p-2 text-right">{(algebraic.wlf * algebraic.unempFactor).toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td className="p-2">After Tax Factor (1-TR)</td>
                    <td className="p-2 text-right">{algebraic.afterTaxFactor.toFixed(4)}</td>
                    <td className="p-2 text-right">{(algebraic.wlf * algebraic.unempFactor * algebraic.afterTaxFactor).toFixed(4)}</td>
                  </tr>
                  <tr className="bg-indigo-50 font-bold">
                    <td className="p-2 text-indigo-900">Fringe Factor (1+FB)</td>
                    <td className="p-2 text-right text-indigo-900">{algebraic.fringeFactor.toFixed(4)}</td>
                    <td className="p-2 text-right text-indigo-900 border-l-4 border-indigo-500">{algebraic.fullMultiplier.toFixed(5)}</td>
                  </tr>
                </tbody>
              </table>
              {isUnionMode && (
                <p className="text-xs text-slate-500 mt-2 italic">
                  * Union Mode Active: Fringe factor derived from flat annual benefits of {fmtUSD(algebraic.flatFringeAmount)} relative to base earnings.
                </p>
              )}
            </section>

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
