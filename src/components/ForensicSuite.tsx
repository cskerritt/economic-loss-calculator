import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Sigma, User, Briefcase, BookOpen, Home, HeartPulse, FileText, BarChart3,
  Menu, X, AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { WizardNavigation, WizardStep, StepCompletion } from './forensic/WizardNavigation';
import { CaseManager, SavedCase, getDefaultCaseData } from './forensic/CaseManager';
import { 
  CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection,
  DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES
} from './forensic/types';
import {
  computeAgeAtInjury,
  computeAlgebraic,
  computeDateCalc,
  computeGrandTotal,
  computeHhsData,
  computeLcpData,
  computeProjection,
  computeScenarioProjections,
  computeWorkLifeFactor,
} from "./forensic/calculations";
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

  // Persistent State with error handling for corrupted localStorage
  const [caseInfo, setCaseInfo] = useState<CaseInfo>(() => {
    try {
      const saved = localStorage.getItem('fs_case_v10');
      return saved ? { ...DEFAULT_CASE_INFO, ...JSON.parse(saved) } : DEFAULT_CASE_INFO;
    } catch {
      return DEFAULT_CASE_INFO;
    }
  });

  const [earningsParams, setEarningsParams] = useState<EarningsParams>(() => {
    try {
      const saved = localStorage.getItem('fs_params_v10');
      return saved ? { ...DEFAULT_EARNINGS_PARAMS, ...JSON.parse(saved) } : DEFAULT_EARNINGS_PARAMS;
    } catch {
      return DEFAULT_EARNINGS_PARAMS;
    }
  });

  const [hhServices, setHhServices] = useState<HhServices>(() => {
    try {
      const saved = localStorage.getItem('fs_hhs_v10');
      return saved ? { ...DEFAULT_HH_SERVICES, ...JSON.parse(saved) } : DEFAULT_HH_SERVICES;
    } catch {
      return DEFAULT_HH_SERVICES;
    }
  });

  const [pastActuals, setPastActuals] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem('fs_past_actuals_v10');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [lcpItems, setLcpItems] = useState<LcpItem[]>(() => {
    try {
      const saved = localStorage.getItem('fs_lcp_v10');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
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

  const dateCalc: DateCalc = useMemo(() => computeDateCalc(caseInfo), [caseInfo]);

  const workLifeFactor = useMemo(
    () => computeWorkLifeFactor(earningsParams, dateCalc.derivedYFS),
    [earningsParams.wle, dateCalc.derivedYFS],
  );

  const algebraic: Algebraic = useMemo(
    () => computeAlgebraic(earningsParams, dateCalc, isUnionMode),
    [earningsParams, dateCalc, isUnionMode],
  );

  const projection: Projection = useMemo(
    () => computeProjection(caseInfo, earningsParams, algebraic, pastActuals, dateCalc),
    [caseInfo.dateOfInjury, earningsParams, algebraic, pastActuals, dateCalc],
  );

  const hhsData: HhsData = useMemo(
    () => computeHhsData(hhServices, dateCalc.derivedYFS),
    [hhServices, dateCalc.derivedYFS],
  );

  const lcpData: LcpData = useMemo(
    () => computeLcpData(lcpItems, earningsParams.discountRate),
    [lcpItems, earningsParams.discountRate],
  );

  const ageAtInjury = useMemo(
    () => computeAgeAtInjury(caseInfo),
    [caseInfo.dob, caseInfo.dateOfInjury],
  );

  const scenarioProjections: ScenarioProjection[] = useMemo(
    () =>
      computeScenarioProjections({
        caseInfo,
        ageAtInjury,
        earningsParams,
        dateCalc,
        pastActuals,
        isUnionMode,
        hhServices,
        hhsData,
        lcpData,
      }),
    [
      caseInfo.dateOfInjury,
      caseInfo.dob,
      ageAtInjury,
      earningsParams,
      isUnionMode,
      dateCalc.pastYears,
      pastActuals,
      hhServices.active,
      hhsData.totalPV,
      lcpData.totalPV,
    ],
  );

  const [scenarioIncluded, setScenarioIncluded] = React.useState<Record<string, boolean>>({});

  const scenarioProjectionsWithIncluded = React.useMemo(() => {
    return scenarioProjections.map(s => ({
      ...s,
      included: scenarioIncluded[s.id] ?? true
    }));
  }, [scenarioProjections, scenarioIncluded]);

  const handleToggleScenarioIncluded = useCallback((id: string) => {
    setScenarioIncluded(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const essentialChecks = useMemo(
    () => [
      { id: 'plaintiff', label: 'Plaintiff name', ok: !!caseInfo.plaintiff.trim(), stepId: 'case' },
      { id: 'dob', label: 'Date of birth', ok: !!caseInfo.dob, stepId: 'case' },
      { id: 'injuryDate', label: 'Date of injury', ok: !!caseInfo.dateOfInjury, stepId: 'case' },
      { id: 'trialDate', label: 'Trial/valuation date', ok: !!caseInfo.dateOfTrial, stepId: 'case' },
      { id: 'baseEarnings', label: 'Pre-injury earnings', ok: earningsParams.baseEarnings > 0, stepId: 'earnings' },
      { id: 'residual', label: 'Residual (post-injury) earnings', ok: earningsParams.residualEarnings >= 0, stepId: 'earnings' },
      { id: 'wle', label: 'Work life expectancy (years)', ok: earningsParams.wle > 0, stepId: 'earnings' },
    ],
    [caseInfo.plaintiff, caseInfo.dob, caseInfo.dateOfInjury, caseInfo.dateOfTrial, earningsParams.baseEarnings, earningsParams.residualEarnings, earningsParams.wle],
  );

  const nextNeededStepIndex = useMemo(() => {
    const missing = essentialChecks.find((item) => !item.ok);
    if (!missing) return null;
    return WIZARD_STEPS.findIndex((s) => s.id === missing.stepId);
  }, [essentialChecks]);

  const completedEssentials = essentialChecks.filter((item) => item.ok).length;
  const essentialsTotal = essentialChecks.length;

  const fmtUSD = useCallback((n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n), []);
  const fmtPct = useCallback((n: number) => `${(n * 100).toFixed(2)}%`, []);
  const grandTotal = useMemo(
    () => computeGrandTotal(projection, hhServices, hhsData, lcpData),
    [projection.totalPastLoss, projection.totalFuturePV, hhServices.active, hhsData.totalPV, lcpData.totalPV],
  );

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
        return <SummaryStep projection={projection} hhServices={hhServices} hhsData={hhsData} lcpData={lcpData} algebraic={algebraic} workLifeFactor={workLifeFactor} grandTotal={grandTotal} scenarioProjections={scenarioProjectionsWithIncluded} selectedScenario={earningsParams.selectedScenario} onToggleScenarioIncluded={handleToggleScenarioIncluded} fmtUSD={fmtUSD} fmtPct={fmtPct} />;
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
            scenarioProjections={scenarioProjectionsWithIncluded}
            selectedScenario={earningsParams.selectedScenario}
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
        <div className="print:hidden mb-6">
          <div className="bg-muted border border-border rounded-xl p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Quick start checklist</p>
                  <p className="text-xs text-muted-foreground">
                    Fill the essentials, then jump to the next step that needs attention.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => nextNeededStepIndex !== null && nextNeededStepIndex >= 0 && setCurrentStep(nextNeededStepIndex)}
                  disabled={nextNeededStepIndex === null}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                    nextNeededStepIndex === null
                      ? 'text-muted-foreground border-border cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  }`}
                >
                  {nextNeededStepIndex === null ? 'All essentials complete' : 'Jump to next needed step'}
                </button>
                <button
                  onClick={handleNewCase}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-background"
                >
                  Reset to blank
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {essentialChecks.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {item.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Essentials complete: {completedEssentials}/{essentialsTotal}
            </div>
          </div>
        </div>
        {renderStep()}
      </main>
    </div>
  );
}
