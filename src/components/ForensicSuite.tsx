import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Sigma, User, Briefcase, BookOpen, Home, HeartPulse, FileText, BarChart3,
  Menu, X
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { WizardNavigation, WizardStep, StepCompletion } from './forensic/WizardNavigation';
import { CaseManager, SavedCase, getDefaultCaseData } from './forensic/CaseManager';
import { 
  CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData,
  DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES
} from './forensic/types';
import { CaseInfoStep, EarningsStep, NarrativesStep, HouseholdStep, LCPStep, SummaryStep, ReportStep } from './forensic/steps';

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

  // Step Completion Calculation
  const stepCompletion: StepCompletion = useMemo(() => {
    const caseFields = [caseInfo.plaintiff, caseInfo.dob, caseInfo.dateOfInjury, caseInfo.dateOfTrial, caseInfo.gender];
    const caseFilled = caseFields.filter(f => f && f.toString().trim()).length;

    const earningsFields = [earningsParams.baseEarnings, earningsParams.wle];
    const earningsFilled = earningsFields.filter(f => f > 0).length;

    const narrativeFields = [caseInfo.medicalSummary, caseInfo.employmentHistory, caseInfo.preInjuryCapacity];
    const narrativesFilled = narrativeFields.filter(f => f && f.trim()).length;

    const householdFilled = hhServices.active ? (hhServices.hoursPerWeek > 0 ? 1 : 0) : 1;
    const householdTotal = 1;

    const lcpFilled = lcpItems.length > 0 ? 1 : 0;

    return {
      case: { filled: caseFilled, total: caseFields.length, percentage: (caseFilled / caseFields.length) * 100 },
      earnings: { filled: earningsFilled, total: earningsFields.length, percentage: (earningsFilled / earningsFields.length) * 100 },
      narratives: { filled: narrativesFilled, total: narrativeFields.length, percentage: (narrativesFilled / narrativeFields.length) * 100 },
      household: { filled: householdFilled, total: householdTotal, percentage: householdFilled * 100 },
      lcp: { filled: lcpFilled, total: 1, percentage: lcpFilled * 100 },
      summary: { filled: 1, total: 1, percentage: 100 },
      report: { filled: 1, total: 1, percentage: 100 },
    };
  }, [caseInfo, earningsParams, hhServices, lcpItems]);

  // Case Management Handlers
  const handleLoadCase = (savedCase: SavedCase) => {
    setCaseInfo(savedCase.caseInfo);
    setEarningsParams(savedCase.earningsParams);
    setHhServices(savedCase.hhServices);
    setLcpItems(savedCase.lcpItems);
    setPastActuals(savedCase.pastActuals);
    setIsUnionMode(savedCase.isUnionMode);
    setCurrentStep(0);
  };

  const handleNewCase = () => {
    const defaults = getDefaultCaseData();
    setCaseInfo(defaults.caseInfo);
    setEarningsParams(defaults.earningsParams);
    setHhServices(defaults.hhServices);
    setLcpItems(defaults.lcpItems);
    setPastActuals(defaults.pastActuals);
    setIsUnionMode(defaults.isUnionMode);
    setCurrentStep(0);
  };

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

  const fmtUSD = useCallback((n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n), []);
  const fmtPct = useCallback((n: number) => `${(n * 100).toFixed(2)}%`, []);
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
        return <EarningsStep earningsParams={earningsParams} setEarningsParams={setEarningsParams} dateCalc={dateCalc} algebraic={algebraic} workLifeFactor={workLifeFactor} isUnionMode={isUnionMode} setIsUnionMode={setIsUnionMode} pastActuals={pastActuals} setPastActuals={setPastActuals} dateOfInjury={caseInfo.dateOfInjury} dob={caseInfo.dob} fmtUSD={fmtUSD} fmtPct={fmtPct} />;
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
          <ReportStep
            reportRef={reportRef}
            caseInfo={caseInfo}
            earningsParams={earningsParams}
            hhServices={hhServices}
            lcpItems={lcpItems}
            dateCalc={dateCalc}
            algebraic={algebraic}
            projection={projection}
            hhsData={hhsData}
            lcpData={lcpData}
            workLifeFactor={workLifeFactor}
            grandTotal={grandTotal}
            isUnionMode={isUnionMode}
            isExportingPdf={isExportingPdf}
            isExportingWord={isExportingWord}
            onPrint={() => window.print()}
            onExportPdf={handleExportPdf}
            onExportWord={handleExportWord}
            fmtUSD={fmtUSD}
            fmtPct={fmtPct}
          />
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
          
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].label}
            </span>
            <CaseManager
              currentCase={{ caseInfo, earningsParams, hhServices, lcpItems, pastActuals, isUnionMode }}
              onLoadCase={handleLoadCase}
              onNewCase={handleNewCase}
            />
          </div>
          
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-navy-light border-t border-navy p-4 space-y-2 print:hidden">
          <div className="mb-4">
            <CaseManager
              currentCase={{ caseInfo, earningsParams, hhServices, lcpItems, pastActuals, isUnionMode }}
              onLoadCase={handleLoadCase}
              onNewCase={handleNewCase}
            />
          </div>
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
        stepCompletion={stepCompletion}
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
