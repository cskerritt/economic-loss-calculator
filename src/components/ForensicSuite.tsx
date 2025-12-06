import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Briefcase,
  Plus,
  Trash2,
  Copy,
  Check,
  Sigma,
  Table,
  Menu,
  X,
  Layers,
  History,
  Calendar as CalendarIcon,
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

const SCENARIOS = {
  conservative: { wageGrowth: 3.0, discountRate: 5.0, wle: 15.0 },
  standard: { wageGrowth: 3.5, discountRate: 4.25, wle: 18.5 },
  aggressive: { wageGrowth: 4.0, discountRate: 3.5, wle: 22.0 }
};

// --- Types ---
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

interface CaseInfo {
  plaintiff: string;
  fileNumber: string;
  dob: string;
  dateOfInjury: string;
  dateOfTrial: string;
  retirementAge: number;
}

interface EarningsParams {
  baseEarnings: number;
  residualEarnings: number;
  wle: number;
  wageGrowth: number;
  discountRate: number;
  fringeRate: number;
  unemploymentRate: number;
  uiReplacementRate: number;
  fedTaxRate: number;
  stateTaxRate: number;
}

// --- UI COMPONENTS ---
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card rounded-xl shadow-sm border border-border overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
    <div className="p-2.5 bg-indigo-muted rounded-xl text-indigo shadow-sm border border-indigo/10">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-bold text-foreground text-lg leading-tight">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>}
    </div>
  </div>
);

interface InputGroupProps {
  label: string;
  value: string | number;
  onChange?: (value: string) => void;
  type?: string;
  prefix?: string | null;
  suffix?: string | null;
  disabled?: boolean;
  placeholder?: string;
  step?: string;
}

const InputGroup = ({ label, value, onChange, type = "number", prefix = null, suffix = null, disabled = false, placeholder = "", step = "any" }: InputGroupProps) => (
  <div className="mb-4">
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
        onChange={(e) => onChange?.(e.target.value)}
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

// --- MAIN APPLICATION ---
export default function ForensicSuite() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [strictAlgebraicMode] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  // --- PERSISTENT STATE ---
  const [caseInfo, setCaseInfo] = useState<CaseInfo>(() => {
    const saved = localStorage.getItem('fs_case_v7');
    return saved ? JSON.parse(saved) : {
      plaintiff: 'Jane Doe',
      fileNumber: 'KW-2025-001',
      dob: '1980-05-15',
      dateOfInjury: '2023-06-15',
      dateOfTrial: '2025-09-01', 
      retirementAge: 67.0
    };
  });

  const [earningsParams, setEarningsParams] = useState<EarningsParams>(() => {
    const saved = localStorage.getItem('fs_params_v7');
    return saved ? JSON.parse(saved) : {
      baseEarnings: 85000,
      residualEarnings: 0,
      wle: 15.5,
      wageGrowth: 3.50,
      discountRate: 4.25,
      fringeRate: 21.5, 
      unemploymentRate: 4.2,
      uiReplacementRate: 40.0,
      fedTaxRate: 15.0,
      stateTaxRate: 4.5,
    };
  });

  const [pastActuals, setPastActuals] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('fs_past_actuals_v7');
    return saved ? JSON.parse(saved) : {};
  });

  const [lcpItems, setLcpItems] = useState<LcpItem[]>(() => {
    const saved = localStorage.getItem('fs_lcp_v7');
    return saved ? JSON.parse(saved) : [
      { id: 1, categoryId: 'evals', name: 'Physiatrist Eval', baseCost: 350, freqType: 'annual', duration: 25, startYear: 1, cpi: 2.88, recurrenceInterval: 1 },
    ];
  });

  // --- AUTO-CALC ENGINE ---
  const dateCalc = useMemo(() => {
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    
    if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) {
        return { ageInjury: '0', ageTrial: '0', pastYears: 0, derivedYFS: 0 };
    }

    const dob = new Date(caseInfo.dob);
    const doi = new Date(caseInfo.dateOfInjury);
    const dot = new Date(caseInfo.dateOfTrial);

    const getAge = (d: Date) => {
        const diff = d.getTime() - dob.getTime();
        return diff / msPerYear;
    };

    const ageInjury = getAge(doi);
    const ageTrial = getAge(dot);
    const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / msPerYear);
    
    const targetRetirementDate = new Date(dob);
    targetRetirementDate.setFullYear(dob.getFullYear() + caseInfo.retirementAge);
    const derivedYFS = Math.max(0, (targetRetirementDate.getTime() - dot.getTime()) / msPerYear);

    return { 
        ageInjury: ageInjury.toFixed(2), 
        ageTrial: ageTrial.toFixed(2),
        pastYears,
        derivedYFS
    };
  }, [caseInfo]);

  // Auto-Save
  useEffect(() => { localStorage.setItem('fs_case_v7', JSON.stringify(caseInfo)); }, [caseInfo]);
  useEffect(() => { localStorage.setItem('fs_params_v7', JSON.stringify(earningsParams)); }, [earningsParams]);
  useEffect(() => { localStorage.setItem('fs_lcp_v7', JSON.stringify(lcpItems)); }, [lcpItems]);
  useEffect(() => { localStorage.setItem('fs_past_actuals_v7', JSON.stringify(pastActuals)); }, [pastActuals]);

  // --- PROJECTION ENGINE ---
  const algebraic = useMemo(() => {
    const yfs = dateCalc.derivedYFS;
    const wlf = yfs > 0 ? (earningsParams.wle / yfs) : 0;
    const unempFactor = 1 - ((earningsParams.unemploymentRate / 100) * (1 - (earningsParams.uiReplacementRate / 100)));
    const afterTaxFactor = (1 - (earningsParams.fedTaxRate / 100)) * (1 - (earningsParams.stateTaxRate / 100));
    const fringeFactor = 1 + (earningsParams.fringeRate / 100);

    let fullMultiplier = 0;
    let realizedMultiplier = 0;
    
    if (strictAlgebraicMode) {
        fullMultiplier = wlf * unempFactor * afterTaxFactor * fringeFactor;
        realizedMultiplier = afterTaxFactor * fringeFactor;
    } else {
        fullMultiplier = wlf * unempFactor * (afterTaxFactor + (earningsParams.fringeRate/100));
        realizedMultiplier = (afterTaxFactor + (earningsParams.fringeRate/100));
    }

    return { wlf, unempFactor, afterTaxFactor, fringeFactor, fullMultiplier, realizedMultiplier, yfs };
  }, [dateCalc, earningsParams, strictAlgebraicMode]);

  const projection = useMemo(() => {
    const pastSchedule: Array<{year: number; label: string; grossBase: number; grossActual: number; netLoss: number; isManual: boolean; fraction: number}> = [];
    const futureSchedule: Array<{year: number; gross: number; netLoss: number; pv: number}> = [];
    let totalPastLoss = 0, totalFutureNominal = 0, totalFuturePV = 0;

    const injuryDate = new Date(caseInfo.dateOfInjury);
    const startYear = injuryDate.getFullYear();

    // A. PAST DAMAGES
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;
    
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

    // B. FUTURE DAMAGES
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

  // --- ACTIONS ---
  const fmtUSD = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const copyTable = () => {
    const txt = projection.futureSchedule.map(r => `${r.year}\t${r.gross.toFixed(2)}\t${r.netLoss.toFixed(2)}\t${r.pv.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`Year\tGross\tNetLoss\tPV\n${txt}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handlePastActualChange = (year: number, value: string) => {
    setPastActuals(prev => ({ ...prev, [year]: value }));
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
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">ForensicSuite <span className="text-indigo-light font-light">V7</span></h1>
              <h1 className="font-bold text-lg tracking-tight sm:hidden">FS<span className="text-indigo-light font-light">V7</span></h1>
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
              
              {/* CASE DATES & INFO */}
              <Card className="p-5 border-l-4 border-l-indigo">
                <SectionHeader icon={CalendarIcon} title="Case Dates" subtitle="Calculates Ages & Durations" />
                <div className="space-y-4">
                    <InputGroup label="Plaintiff Name" type="text" value={caseInfo.plaintiff} onChange={v => setCaseInfo({...caseInfo, plaintiff: v})} />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="DOB" type="date" value={caseInfo.dob} onChange={v => setCaseInfo({...caseInfo, dob: v})} />
                        <InputGroup label="Date of Injury" type="date" value={caseInfo.dateOfInjury} onChange={v => setCaseInfo({...caseInfo, dateOfInjury: v})} />
                    </div>
                    
                    <div className="bg-indigo-muted p-3 rounded-lg border border-indigo/10 grid grid-cols-2 gap-2 text-center">
                        <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Age at Injury</span>
                            <div className="text-lg font-bold text-indigo">{dateCalc.ageInjury}</div>
                        </div>
                        <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Past Duration</span>
                            <div className="text-lg font-bold text-indigo">{dateCalc.pastYears.toFixed(2)} Yrs</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <InputGroup label="Trial Date" type="date" value={caseInfo.dateOfTrial} onChange={v => setCaseInfo({...caseInfo, dateOfTrial: v})} />
                        <InputGroup label="Retirement Age" value={caseInfo.retirementAge} onChange={v => setCaseInfo({...caseInfo, retirementAge: parseFloat(v) || 0})} />
                    </div>

                    <div className="bg-muted p-3 rounded-lg border border-border grid grid-cols-2 gap-2 text-center">
                         <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Age at Trial</span>
                            <div className="text-lg font-bold text-foreground">{dateCalc.ageTrial}</div>
                         </div>
                         <div>
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Future YFS</span>
                            <div className="text-lg font-bold text-foreground">{dateCalc.derivedYFS.toFixed(2)} Yrs</div>
                         </div>
                    </div>
                </div>
              </Card>

              {/* VOCATIONAL */}
              <Card className="p-5 border-l-4 border-l-sky">
                <SectionHeader icon={Briefcase} title="Vocational Stats" />
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Work Life Exp (WLE):</span>
                        <input 
                           type="number" 
                           className="w-20 border border-border rounded px-2 py-1 text-right bg-background text-foreground"
                           value={earningsParams.wle} 
                           onChange={e => setEarningsParams({...earningsParams, wle: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-sky h-full transition-all duration-300" style={{ width: `${Math.min(100, (earningsParams.wle / dateCalc.derivedYFS) * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>WLE: {earningsParams.wle}</span>
                        <span>YFS: {dateCalc.derivedYFS.toFixed(1)}</span>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <InputGroup label="Base Annual Earnings" prefix="$" value={earningsParams.baseEarnings} onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} />
                    </div>
                </div>
              </Card>
              
              {/* PAST ACTUALS */}
              <Card className="p-5 border-l-4 border-l-sky max-h-[400px] overflow-y-auto">
                  <SectionHeader icon={History} title="Past Actuals" subtitle="Offset Loss" />
                  <div className="space-y-3">
                      {projection.pastSchedule.map((row) => (
                          <div key={row.year} className="flex items-center gap-3">
                              <div className="w-1/3">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase">{row.year} {row.fraction < 1 ? '(Partial)' : ''}</label>
                              </div>
                              <div className="w-2/3">
                                  <div className="relative rounded-md shadow-sm">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-muted-foreground sm:text-xs">$</span>
                                      </div>
                                      <input 
                                          type="number" 
                                          className="block w-full rounded-md border-border pl-7 py-1.5 text-sm focus:border-sky focus:ring-sky bg-background text-foreground border" 
                                          placeholder="Enter Actual..."
                                          value={pastActuals[row.year] || ''}
                                          onChange={(e) => handlePastActualChange(row.year, e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                      {projection.pastSchedule.length === 0 && (
                          <div className="text-xs text-muted-foreground italic text-center p-2">
                              No past years detected. Check Injury Date.
                          </div>
                      )}
                  </div>
              </Card>

              {/* VARIABLES */}
              <Card className="p-5 border-l-4 border-l-emerald">
                <SectionHeader icon={TrendingUp} title="Econ Variables" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <InputGroup label="Unemp %" value={earningsParams.unemploymentRate} onChange={v => setEarningsParams({...earningsParams, unemploymentRate: parseFloat(v) || 0})} />
                    <InputGroup label="Tax %" value={earningsParams.fedTaxRate + earningsParams.stateTaxRate} disabled placeholder="Combined" /> 
                </div>
                <button onClick={() => {
                    const s = SCENARIOS.standard;
                    setEarningsParams(prev => ({ ...prev, wageGrowth: s.wageGrowth, discountRate: s.discountRate }));
                }} className="w-full mt-2 text-xs bg-emerald-muted text-emerald py-1 rounded hover:bg-emerald/10 transition-colors">Reset to Standard</button>
              </Card>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* ALGEBRAIC CHAIN */}
              <Card className="p-6 bg-navy text-primary-foreground border-none">
                 <div className="flex items-center gap-2 mb-6 text-indigo-light">
                    <Layers className="w-5 h-5" />
                    <h3 className="text-xs font-bold uppercase tracking-widest">Algebraic Earnings Factor (AEF)</h3>
                 </div>
                 
                 <div className="hidden md:grid grid-cols-5 gap-4 items-center text-center text-xs font-mono">
                    {[
                      { l: 'WLF', v: algebraic.wlf },
                      { l: '1-Risk', v: algebraic.unempFactor },
                      { l: '1-Tax', v: algebraic.afterTaxFactor },
                      { l: '1+Fringe', v: algebraic.fringeFactor }
                    ].map((item, i) => (
                      <React.Fragment key={i}>
                        <div className="p-3 bg-navy-light rounded-lg">
                            <div className="text-muted-foreground mb-1">{item.l}</div>
                            <div className="font-bold text-primary-foreground">{item.v.toFixed(3)}</div>
                        </div>
                        {i < 3 && <div className="text-muted-foreground font-bold">×</div>}
                      </React.Fragment>
                    ))}
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-navy-light flex justify-between items-center">
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">But-For Multiplier</div>
                        <div className="text-muted-foreground text-[10px]">Applied to Base Capacity</div>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-emerald font-mono">
                        {algebraic.fullMultiplier.toFixed(5)}
                    </div>
                 </div>
              </Card>

              {/* TOTALS */}
              <div className="grid grid-cols-2 gap-4">
                 <Card className="p-4 bg-gradient-to-br from-indigo-muted to-card border-indigo/10">
                    <h4 className="text-[10px] font-bold uppercase text-indigo mb-1">Total Future PV</h4>
                    <p className="text-2xl font-bold text-indigo">{fmtUSD(projection.totalFuturePV)}</p>
                 </Card>
                 <Card className="p-4">
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Past Damages</h4>
                    <p className="text-2xl font-bold text-foreground">{fmtUSD(projection.totalPastLoss)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {Object.keys(pastActuals).length > 0 ? `${Object.keys(pastActuals).length} Manual Offsets` : 'Projected Residuals'}
                    </p>
                 </Card>
              </div>

              {/* TABLE */}
              <Card className="flex flex-col h-[500px]">
                  <div className="bg-muted border-b border-border p-3 flex justify-between items-center">
                     <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Table className="w-4 h-4"/> Damage Schedule</span>
                     <button onClick={copyTable} className="text-xs bg-card border border-border px-2 py-1 rounded shadow-sm hover:bg-muted flex items-center gap-1 text-muted-foreground transition-colors">
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
                              {/* Past */}
                              {projection.pastSchedule.map((row) => (
                                  <tr key={row.year} className="bg-muted/50">
                                      <td className="p-3 text-left text-muted-foreground">
                                          {row.year} <span className="text-[9px] uppercase tracking-wide opacity-75 ml-1">PAST</span>
                                      </td>
                                      <td className="p-3 text-muted-foreground">{fmtUSD(row.grossBase)}</td>
                                      <td className="p-3 text-muted-foreground relative">
                                          {fmtUSD(row.grossActual)}
                                          {row.isManual && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-sky rounded-full" title="Manual Entry"></span>}
                                      </td>
                                      <td className="p-3 bg-indigo-muted/20 text-indigo font-medium">{fmtUSD(row.netLoss)}</td>
                                      <td className="p-3 text-muted-foreground">-</td>
                                  </tr>
                              ))}
                              {/* Future */}
                              {projection.futureSchedule.map((row) => (
                                  <tr key={row.year} className="hover:bg-muted/50 transition-colors">
                                      <td className="p-3 text-left text-muted-foreground">Year {row.year}</td>
                                      <td className="p-3 text-foreground/70">{fmtUSD(row.gross)}</td>
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
                     <button onClick={() => setLcpItems([...lcpItems, {id: Date.now(), categoryId: 'evals', name:'New Item', baseCost:0, freqType:'annual', duration:1, startYear:1, cpi:2.88, recurrenceInterval:1}])} className="bg-indigo text-primary-foreground px-3 py-1.5 rounded-full text-sm hover:bg-indigo-light flex gap-2 items-center shadow-lg transform active:scale-95 transition-all"><Plus className="w-4 h-4"/> Add Item</button>
                 </div>
                 <div className="p-4 grid grid-cols-1 gap-4">
                     {lcpItems.map(item => (
                         <div key={item.id} className="relative bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                             <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                 <div className="md:col-span-3">
                                     <label className="text-[9px] font-bold uppercase text-muted-foreground">Category</label>
                                     <select className="w-full text-sm font-medium bg-muted rounded border-none py-2 focus:ring-1 focus:ring-indigo text-foreground" value={item.categoryId} onChange={(e) => {
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
                                     <button onClick={()=>setLcpItems(lcpItems.filter(i=>i.id!==item.id))} className="text-muted-foreground hover:text-rose p-2 transition-colors"><Trash2 className="w-5 h-5"/></button>
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
           <div className="bg-card shadow-2xl max-w-[21cm] mx-auto min-h-[29.7cm] p-[2cm] print:shadow-none print:p-0 print:w-full animate-fade-in">
              {/* HEADER */}
              <div className="flex justify-between items-start border-b-2 border-navy pb-8 mb-10">
                  <div>
                      <h1 className="text-3xl font-serif font-bold text-navy leading-none">APPRAISAL OF<br/>ECONOMIC LOSS</h1>
                      <div className="mt-6 text-sm font-serif text-muted-foreground leading-relaxed">
                          <strong>Kincaid Wolstein Vocational Services</strong><br/>
                          One University Plaza ~ Suite 302<br/>
                          Hackensack, New Jersey 07601
                      </div>
                  </div>
                  <div className="text-right text-sm font-serif space-y-2">
                      <div className="inline-block px-3 py-1 bg-muted rounded font-bold text-foreground mb-2">File: {caseInfo.fileNumber}</div>
                      <div><strong>Plaintiff:</strong> {caseInfo.plaintiff}</div>
                      <div><strong>DOI:</strong> {caseInfo.dateOfInjury}</div>
                      <div><strong>Valuation:</strong> {caseInfo.dateOfTrial}</div>
                  </div>
              </div>

              {/* DATES & AGES SECTION */}
              <section className="mb-8">
                  <h2 className="text-lg font-bold font-serif uppercase border-b border-border pb-1 mb-4 text-indigo">1. Case Timeline & Vocational Stats</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm font-serif">
                      <div className="bg-muted p-4 border border-border">
                          <p><strong>Date of Birth:</strong> {caseInfo.dob}</p>
                          <p><strong>Age at Injury:</strong> {dateCalc.ageInjury} Years</p>
                          <p><strong>Age at Trial:</strong> {dateCalc.ageTrial} Years</p>
                          <p><strong>Projected Retirement:</strong> Age {caseInfo.retirementAge}</p>
                      </div>
                      <div className="bg-muted p-4 border border-border">
                          <p><strong>Past Duration:</strong> {dateCalc.pastYears.toFixed(2)} Years</p>
                          <p><strong>Future Work Life (WLE):</strong> {earningsParams.wle} Years</p>
                          <p><strong>Years to Separation (YFS):</strong> {dateCalc.derivedYFS.toFixed(2)} Years</p>
                          <p><strong>Calculated Work Life Factor:</strong> {(algebraic.wlf * 100).toFixed(2)}%</p>
                      </div>
                  </div>
              </section>

              {/* OPINION SECTION */}
              <section className="mb-12">
                  <h2 className="text-lg font-bold font-serif uppercase border-b border-border pb-1 mb-4 text-indigo">2. Opinion of Economic Losses</h2>
                  <p className="font-serif text-justify mb-6 text-foreground text-sm leading-7">
                      Within a reasonable degree of economic certainty, and utilizing the algebraic methodology (Tinari, 2016), 
                      the total present value of economic damages is <strong>{fmtUSD(projection.totalPastLoss + projection.totalFuturePV + lcpData.totalPV)}</strong>.
                  </p>
                  
                  <table className="w-full border border-border text-sm font-serif mb-8">
                      <thead className="bg-muted uppercase text-xs">
                          <tr>
                              <th className="p-3 text-left border-r border-border">Category</th>
                              <th className="p-3 text-right border-r border-border">Past Value</th>
                              <th className="p-3 text-right border-r border-border">Future (PV)</th>
                              <th className="p-3 text-right font-bold">Total</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                          <tr>
                              <td className="p-3 border-r border-border">Lost Earning Capacity</td>
                              <td className="p-3 text-right border-r border-border">{fmtUSD(projection.totalPastLoss)}</td>
                              <td className="p-3 text-right border-r border-border">{fmtUSD(projection.totalFuturePV)}</td>
                              <td className="p-3 text-right font-bold">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
                          </tr>
                          <tr>
                              <td className="p-3 border-r border-border">Life Care Plan</td>
                              <td className="p-3 text-right border-r border-border text-muted-foreground">-</td>
                              <td className="p-3 text-right border-r border-border">{fmtUSD(lcpData.totalPV)}</td>
                              <td className="p-3 text-right font-bold">{fmtUSD(lcpData.totalPV)}</td>
                          </tr>
                          <tr className="bg-muted font-bold">
                              <td className="p-3 border-r border-border uppercase">Grand Total</td>
                              <td className="p-3 text-right border-r border-border">{fmtUSD(projection.totalPastLoss)}</td>
                              <td className="p-3 text-right border-r border-border">{fmtUSD(projection.totalFuturePV + lcpData.totalPV)}</td>
                              <td className="p-3 text-right text-lg text-indigo">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV + lcpData.totalPV)}</td>
                          </tr>
                      </tbody>
                  </table>
              </section>

              <div className="text-center print:hidden mt-12">
                  <button onClick={() => window.print()} className="bg-navy text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg hover:bg-navy-light flex items-center gap-2 mx-auto transform transition-all active:scale-95">
                      <FileText className="w-5 h-5" /> Print Official Report
                  </button>
              </div>
           </div>
        )}

      </main>
    </div>
  );
}
