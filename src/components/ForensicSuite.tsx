import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Sigma, User, Briefcase, BookOpen, Home, HeartPulse, FileText, BarChart3,
  Download, FileDown, Loader2, Menu, X
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table as DocxTable, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { WizardNavigation, WizardStep } from './forensic/WizardNavigation';
import { 
  CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData,
  DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES, CPI_CATEGORIES
} from './forensic/types';
import { CaseInfoStep, EarningsStep, NarrativesStep, HouseholdStep, LCPStep, SummaryStep } from './forensic/steps';

// Wizard Steps Configuration
const WIZARD_STEPS: WizardStep[] = [
  { id: 'case', label: 'Case Info', icon: User },
  { id: 'earnings', label: 'Earnings', icon: Briefcase },
  { id: 'narratives', label: 'Narratives', icon: BookOpen },
  { id: 'household', label: 'Household', icon: Home },
  { id: 'lcp', label: 'Life Care', icon: HeartPulse },
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'report', label: 'Report', icon: FileText },
];

export default function ForensicSuite() {
  const [currentStep, setCurrentStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUnionMode, setIsUnionMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  // Persistent State
  const [caseInfo, setCaseInfo] = useState<CaseInfo>(() => {
    const saved = localStorage.getItem('fs_case_v10');
    return saved ? JSON.parse(saved) : DEFAULT_CASE_INFO;
  });

  const [earningsParams, setEarningsParams] = useState<EarningsParams>(() => {
    const saved = localStorage.getItem('fs_params_v10');
    return saved ? JSON.parse(saved) : DEFAULT_EARNINGS_PARAMS;
  });

  const [hhServices, setHhServices] = useState<HhServices>(() => {
    const saved = localStorage.getItem('fs_hhs_v10');
    return saved ? JSON.parse(saved) : DEFAULT_HH_SERVICES;
  });

  const [pastActuals, setPastActuals] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('fs_past_actuals_v10');
    return saved ? JSON.parse(saved) : {};
  });

  const [lcpItems, setLcpItems] = useState<LcpItem[]>(() => {
    const saved = localStorage.getItem('fs_lcp_v10');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-Save
  useEffect(() => { localStorage.setItem('fs_case_v10', JSON.stringify(caseInfo)); }, [caseInfo]);
  useEffect(() => { localStorage.setItem('fs_params_v10', JSON.stringify(earningsParams)); }, [earningsParams]);
  useEffect(() => { localStorage.setItem('fs_lcp_v10', JSON.stringify(lcpItems)); }, [lcpItems]);
  useEffect(() => { localStorage.setItem('fs_past_actuals_v10', JSON.stringify(pastActuals)); }, [pastActuals]);
  useEffect(() => { localStorage.setItem('fs_hhs_v10', JSON.stringify(hhServices)); }, [hhServices]);

  // Date Calculations
  const dateCalc: DateCalc = useMemo(() => {
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    if (!caseInfo.dob || !caseInfo.dateOfInjury || !caseInfo.dateOfTrial) 
      return { ageInjury: '0', ageTrial: '0', currentAge: '0', pastYears: 0, derivedYFS: 0 };

    const dob = new Date(caseInfo.dob);
    const doi = new Date(caseInfo.dateOfInjury);
    const dot = new Date(caseInfo.dateOfTrial);
    const now = new Date();

    const getAge = (d: Date) => (d.getTime() - dob.getTime()) / msPerYear;
    const pastYears = Math.max(0, (dot.getTime() - doi.getTime()) / msPerYear);
    
    const targetRetirementDate = new Date(dob);
    targetRetirementDate.setFullYear(dob.getFullYear() + caseInfo.retirementAge);
    const derivedYFS = Math.max(0, (targetRetirementDate.getTime() - dot.getTime()) / msPerYear);

    return { ageInjury: getAge(doi).toFixed(1), ageTrial: getAge(dot).toFixed(1), currentAge: getAge(now).toFixed(1), pastYears, derivedYFS };
  }, [caseInfo]);

  const workLifeFactor = useMemo(() => {
    if (dateCalc.derivedYFS <= 0) return 0;
    return (earningsParams.wle / dateCalc.derivedYFS) * 100;
  }, [earningsParams.wle, dateCalc.derivedYFS]);

  // Algebraic Calculations
  const algebraic: Algebraic = useMemo(() => {
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

    const fullMultiplier = wlf * unempFactor * afterTaxFactor * fringeFactor;
    const realizedMultiplier = afterTaxFactor * fringeFactor;
    const combinedTaxRate = 1 - afterTaxFactor;

    return { wlf, unempFactor, afterTaxFactor, fringeFactor, fullMultiplier, realizedMultiplier, yfs, flatFringeAmount, combinedTaxRate };
  }, [dateCalc, earningsParams, isUnionMode]);

  // Projection Engine
  const projection: Projection = useMemo(() => {
    const pastSchedule: Projection['pastSchedule'] = [];
    const futureSchedule: Projection['futureSchedule'] = [];
    let totalPastLoss = 0, totalFutureNominal = 0, totalFuturePV = 0;

    if (!caseInfo.dateOfInjury) return { pastSchedule, futureSchedule, totalPastLoss, totalFutureNominal, totalFuturePV };

    const startYear = new Date(caseInfo.dateOfInjury).getFullYear();
    const fullPast = Math.floor(dateCalc.pastYears);
    const partialPast = dateCalc.pastYears % 1;
    
    for (let i = 0; i <= fullPast; i++) {
      const fraction = (i === fullPast && partialPast > 0) ? partialPast : (i === fullPast && partialPast === 0 ? 0 : 1);
      if (fraction <= 0) continue;

      const currentYear = startYear + i;
      const growth = Math.pow(1 + (earningsParams.wageGrowth/100), i);
      const grossBase = earningsParams.baseEarnings * growth * fraction;
      const netButFor = grossBase * algebraic.fullMultiplier;

      let netActual = 0, grossActual = 0, isManual = false;

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

  // Household Services
  const hhsData: HhsData = useMemo(() => {
    if (!hhServices.active) return { totalNom: 0, totalPV: 0 };
    let totalNom = 0, totalPV = 0;
    const years = Math.ceil(dateCalc.derivedYFS);
    for(let i=0; i<years; i++) {
      const annualValue = hhServices.hoursPerWeek * 52 * hhServices.hourlyRate * Math.pow(1 + hhServices.growthRate/100, i);
      const disc = 1 / Math.pow(1 + hhServices.discountRate/100, i + 0.5);
      totalNom += annualValue;
      totalPV += annualValue * disc;
    }
    return { totalNom, totalPV };
  }, [hhServices, dateCalc.derivedYFS]);

  // LCP Engine
  const lcpData: LcpData = useMemo(() => {
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
  const grandTotal = projection.totalPastLoss + projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV;

  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Economic_Appraisal_${caseInfo.plaintiff || 'Report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(reportRef.current).save();
    } finally {
      setIsExportingPdf(false);
    }
  }, [caseInfo.plaintiff]);

  const handleExportWord = useCallback(async () => {
    setIsExportingWord(true);
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ children: [new TextRun({ text: 'APPRAISAL OF ECONOMIC LOSS', bold: true, size: 36 })], alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new TextRun({ text: `Regarding: ${caseInfo.plaintiff}`, size: 24 })], spacing: { after: 200 } }),
            new Paragraph({ children: [new TextRun({ text: `Grand Total: ${fmtUSD(grandTotal)}`, bold: true, size: 28 })] }),
          ]
        }]
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Economic_Appraisal_${caseInfo.plaintiff || 'Report'}.docx`);
    } finally {
      setIsExportingWord(false);
    }
  }, [caseInfo.plaintiff, grandTotal, fmtUSD]);

  const renderStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'case':
        return <CaseInfoStep caseInfo={caseInfo} setCaseInfo={setCaseInfo} dateCalc={dateCalc} />;
      case 'earnings':
        return <EarningsStep earningsParams={earningsParams} setEarningsParams={setEarningsParams} dateCalc={dateCalc} algebraic={algebraic} workLifeFactor={workLifeFactor} isUnionMode={isUnionMode} setIsUnionMode={setIsUnionMode} pastActuals={pastActuals} setPastActuals={setPastActuals} dateOfInjury={caseInfo.dateOfInjury} fmtUSD={fmtUSD} fmtPct={fmtPct} />;
      case 'narratives':
        return <NarrativesStep caseInfo={caseInfo} setCaseInfo={setCaseInfo} />;
      case 'household':
        return <HouseholdStep hhServices={hhServices} setHhServices={setHhServices} hhsData={hhsData} fmtUSD={fmtUSD} />;
      case 'lcp':
        return <LCPStep lcpItems={lcpItems} setLcpItems={setLcpItems} lcpData={lcpData} lifeExpectancy={caseInfo.lifeExpectancy} fmtUSD={fmtUSD} />;
      case 'summary':
        return <SummaryStep projection={projection} hhServices={hhServices} hhsData={hhsData} lcpData={lcpData} algebraic={algebraic} workLifeFactor={workLifeFactor} grandTotal={grandTotal} fmtUSD={fmtUSD} fmtPct={fmtPct} />;
      case 'report':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 print:hidden">
              <h2 className="text-2xl font-bold text-foreground">Generate Report</h2>
              <p className="text-muted-foreground mt-1">Export your economic appraisal report</p>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Print
                </button>
                <button onClick={handleExportPdf} disabled={isExportingPdf} className="bg-rose-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50">
                  {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                  {isExportingPdf ? 'Exporting...' : 'Export PDF'}
                </button>
                <button onClick={handleExportWord} disabled={isExportingWord} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                  {isExportingWord ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {isExportingWord ? 'Exporting...' : 'Export Word'}
                </button>
              </div>
            </div>
            <div ref={reportRef} className="bg-white text-slate-900 p-8 shadow-lg rounded-lg print:shadow-none print:rounded-none">
              <header className="text-center mb-8 border-b-2 border-slate-900 pb-6">
                <h1 className="text-2xl font-bold uppercase tracking-wide">Appraisal of Economic Loss</h1>
                <p className="text-sm mt-2">Prepared for: {caseInfo.attorney} — {caseInfo.lawFirm}</p>
                <p className="text-sm">Regarding: {caseInfo.plaintiff}</p>
                <p className="text-sm">Report Date: {caseInfo.reportDate ? new Date(caseInfo.reportDate).toLocaleDateString() : 'N/A'}</p>
              </header>
              <section className="mb-6">
                <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">Opinion of Economic Losses</h2>
                <table className="w-full text-sm border-collapse">
                  <thead><tr className="bg-slate-100"><th className="p-2 text-left border">Category</th><th className="p-2 text-right border">Past</th><th className="p-2 text-right border">Future (PV)</th><th className="p-2 text-right border">Total</th></tr></thead>
                  <tbody>
                    <tr><td className="p-2 border">Lost Earning Capacity</td><td className="p-2 border text-right">{fmtUSD(projection.totalPastLoss)}</td><td className="p-2 border text-right">{fmtUSD(projection.totalFuturePV)}</td><td className="p-2 border text-right font-bold">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td></tr>
                    {hhServices.active && <tr><td className="p-2 border">Household Services</td><td className="p-2 border text-right">—</td><td className="p-2 border text-right">{fmtUSD(hhsData.totalPV)}</td><td className="p-2 border text-right font-bold">{fmtUSD(hhsData.totalPV)}</td></tr>}
                    {lcpItems.length > 0 && <tr><td className="p-2 border">Life Care Plan</td><td className="p-2 border text-right">—</td><td className="p-2 border text-right">{fmtUSD(lcpData.totalPV)}</td><td className="p-2 border text-right font-bold">{fmtUSD(lcpData.totalPV)}</td></tr>}
                    <tr className="bg-slate-100 font-bold"><td className="p-2 border">GRAND TOTAL</td><td className="p-2 border text-right">{fmtUSD(projection.totalPastLoss)}</td><td className="p-2 border text-right">{fmtUSD(projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV)}</td><td className="p-2 border text-right text-lg">{fmtUSD(grandTotal)}</td></tr>
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20 print:bg-white print:pb-0">
      {/* Navbar */}
      <nav className="bg-navy text-primary-foreground sticky top-0 z-50 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo to-indigo-light p-2 rounded-lg shadow-lg">
              <Sigma className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">ForensicSuite <span className="text-indigo-light font-light">V10</span></h1>
            </div>
          </div>
          <div className="hidden md:block text-sm text-muted-foreground">
            Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].label}
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-light border-t border-navy p-4 space-y-2 print:hidden">
          {WIZARD_STEPS.map((step, idx) => (
            <button key={step.id} onClick={() => { setCurrentStep(idx); setMobileMenuOpen(false); }} className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${currentStep === idx ? 'bg-indigo text-primary-foreground' : 'text-muted-foreground hover:bg-navy'}`}>
              {step.label}
            </button>
          ))}
        </div>
      )}

      {/* Wizard Navigation */}
      <WizardNavigation 
        steps={WIZARD_STEPS} 
        currentStep={currentStep} 
        onStepClick={setCurrentStep}
        onNext={() => setCurrentStep(Math.min(currentStep + 1, WIZARD_STEPS.length - 1))}
        onPrevious={() => setCurrentStep(Math.max(currentStep - 1, 0))}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 print:p-0">
        {renderStep()}
      </main>
    </div>
  );
}
