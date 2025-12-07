import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Sigma, User, Briefcase, BookOpen, Home, HeartPulse, FileText, BarChart3,
  Menu, X, AlertCircle, CheckCircle2, Sparkles, Save, Clock, Cloud
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

import { WizardNavigation, WizardStep, StepCompletion } from './forensic/WizardNavigation';
import { CaseManager, SavedCase, getDefaultCaseData } from './forensic/CaseManager';
import { ThemeToggle } from './ThemeToggle';
import { ExportHistory, addExportRecord } from './ExportHistory';
import { DataImport } from './DataImport';
import { Dashboard } from './Dashboard';
import { UserMenu } from './UserMenu';
import { AIAssistant } from './AIAssistant';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useSessionTracking } from '@/hooks/useSessionTracking';
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

// Format relative time
const formatLastSaved = (date: Date | null): string => {
  if (!date) return 'Not saved';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ForensicSuite() {
  const [currentStep, setCurrentStep] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUnionMode, setIsUnionMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveIndicatorVisible, setSaveIndicatorVisible] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Track user session for session management
  useSessionTracking();
  const normalizeLcpItems = useCallback((items: LcpItem[] = []): LcpItem[] => {
    return items.map((item) => {
      const startYear = Math.max(1, item.startYear || 1);
      const duration = Math.max(1, item.duration || 1);
      const endYear = Math.max(startYear, item.endYear ?? startYear + duration - 1);
      return {
        ...item,
        startYear,
        duration,
        endYear,
        recurrenceInterval: Math.max(1, item.recurrenceInterval || 1),
        useCustomYears: item.useCustomYears ?? false,
        customYears: item.customYears ?? [],
      };
    });
  }, []);

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
      const parsed = saved ? JSON.parse(saved) : [];
      return normalizeLcpItems(parsed);
    } catch {
      return [];
    }
  });

  // Auto-Save with timestamp tracking (local storage)
  const triggerLocalSave = useCallback(() => {
    setLastSaved(new Date());
    setSaveIndicatorVisible(true);
    setTimeout(() => setSaveIndicatorVisible(false), 2000);
  }, []);

  useEffect(() => { localStorage.setItem('fs_case_v10', JSON.stringify(caseInfo)); triggerLocalSave(); }, [caseInfo]);
  useEffect(() => { localStorage.setItem('fs_params_v10', JSON.stringify(earningsParams)); triggerLocalSave(); }, [earningsParams]);
  useEffect(() => { localStorage.setItem('fs_lcp_v10', JSON.stringify(lcpItems)); triggerLocalSave(); }, [lcpItems]);
  useEffect(() => { localStorage.setItem('fs_past_actuals_v10', JSON.stringify(pastActuals)); triggerLocalSave(); }, [pastActuals]);
  useEffect(() => { localStorage.setItem('fs_hhs_v10', JSON.stringify(hhServices)); triggerLocalSave(); }, [hhServices]);

  // Cloud Auto-Save Hook
  const caseData = useMemo(() => ({
    caseInfo,
    earningsParams,
    hhServices,
    lcpItems,
    pastActuals,
    isUnionMode,
  }), [caseInfo, earningsParams, hhServices, lcpItems, pastActuals, isUnionMode]);

  const { 
    activeCaseId, 
    setActiveCase, 
    clearActiveCase, 
    lastAutoSave, 
    isSaving: isAutoSaving 
  } = useAutoSave(caseData, { intervalMs: 2 * 60 * 1000 });

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCurrentStep(prev => Math.max(prev - 1, 0));
      } else if (e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const stepIndex = parseInt(e.key) - 1;
        if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
          setCurrentStep(stepIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update last saved time display periodically
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

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
  const handleLoadCase = useCallback((savedCase: SavedCase) => {
    setCaseInfo(savedCase.caseInfo);
    setEarningsParams(savedCase.earningsParams);
    setHhServices(savedCase.hhServices);
    setLcpItems(normalizeLcpItems(savedCase.lcpItems));
    setPastActuals(savedCase.pastActuals);
    setIsUnionMode(savedCase.isUnionMode);
    setCurrentStep(0);
    
    // Set active case for cloud auto-save if it's a cloud case
    if (savedCase.isCloud && savedCase.id) {
      setActiveCase(savedCase.id, {
        caseInfo: savedCase.caseInfo,
        earningsParams: savedCase.earningsParams,
        hhServices: savedCase.hhServices,
        lcpItems: savedCase.lcpItems,
        pastActuals: savedCase.pastActuals,
        isUnionMode: savedCase.isUnionMode,
      });
    } else {
      clearActiveCase();
    }
  }, [normalizeLcpItems, setActiveCase, clearActiveCase]);

  const handleNewCase = useCallback(() => {
    const defaults = getDefaultCaseData();
    setCaseInfo(defaults.caseInfo);
    setEarningsParams(defaults.earningsParams);
    setHhServices(defaults.hhServices);
    setLcpItems(normalizeLcpItems(defaults.lcpItems));
    setPastActuals(defaults.pastActuals);
    setIsUnionMode(defaults.isUnionMode);
    setCurrentStep(0);
    clearActiveCase();
  }, [normalizeLcpItems, clearActiveCase]);

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
  const baseCalendarYear = useMemo(() => {
    const year = caseInfo.dateOfTrial ? new Date(caseInfo.dateOfTrial).getFullYear() : new Date().getFullYear();
    return Number.isFinite(year) ? year : new Date().getFullYear();
  }, [caseInfo.dateOfTrial]);

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
      { id: 'plaintiff', label: 'Plaintiff name', ok: !!caseInfo.plaintiff.trim(), stepId: 'case', stepLabel: 'Case Info' },
      { id: 'dob', label: 'Date of birth', ok: !!caseInfo.dob, stepId: 'case', stepLabel: 'Case Info' },
      { id: 'injuryDate', label: 'Date of injury', ok: !!caseInfo.dateOfInjury, stepId: 'case', stepLabel: 'Case Info' },
      { id: 'trialDate', label: 'Trial/valuation date', ok: !!caseInfo.dateOfTrial, stepId: 'case', stepLabel: 'Case Info' },
      { id: 'lifeExpectancy', label: 'Life expectancy', ok: caseInfo.lifeExpectancy > 0, stepId: 'case', stepLabel: 'Case Info' },
      { id: 'baseEarnings', label: 'Pre-injury earnings', ok: earningsParams.baseEarnings > 0, stepId: 'earnings', stepLabel: 'Earnings' },
      { id: 'wle', label: 'Work life expectancy', ok: earningsParams.wle > 0, stepId: 'earnings', stepLabel: 'Earnings' },
      { id: 'wageGrowth', label: 'Wage growth rate', ok: earningsParams.wageGrowth >= 0, stepId: 'earnings', stepLabel: 'Earnings' },
      { id: 'discountRate', label: 'Discount rate', ok: earningsParams.discountRate >= 0, stepId: 'earnings', stepLabel: 'Earnings' },
    ],
    [caseInfo.plaintiff, caseInfo.dob, caseInfo.dateOfInjury, caseInfo.dateOfTrial, caseInfo.lifeExpectancy, earningsParams.baseEarnings, earningsParams.wle, earningsParams.wageGrowth, earningsParams.discountRate],
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
      addExportRecord({ type: 'pdf', plaintiffName: caseInfo.plaintiff, grandTotal });
    } finally {
      setIsExportingPdf(false);
    }
  }, [caseInfo.plaintiff, grandTotal]);

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
      addExportRecord({ type: 'word', plaintiffName: caseInfo.plaintiff, grandTotal });
    } finally {
      setIsExportingWord(false);
    }
  }, [caseInfo.plaintiff, grandTotal, fmtUSD]);

  const handlePrint = useCallback(() => {
    addExportRecord({ type: 'print', plaintiffName: caseInfo.plaintiff, grandTotal });
    window.print();
  }, [caseInfo.plaintiff, grandTotal]);

  const renderStep = () => {
    switch (WIZARD_STEPS[currentStep].id) {
      case 'case':
        return <CaseInfoStep caseInfo={caseInfo} setCaseInfo={setCaseInfo} dateCalc={dateCalc} />;
      case 'earnings':
        return <EarningsStep earningsParams={earningsParams} setEarningsParams={setEarningsParams} dateCalc={dateCalc} algebraic={algebraic} workLifeFactor={workLifeFactor} isUnionMode={isUnionMode} setIsUnionMode={setIsUnionMode} pastActuals={pastActuals} setPastActuals={setPastActuals} dateOfInjury={caseInfo.dateOfInjury} dob={caseInfo.dob} fmtUSD={fmtUSD} fmtPct={fmtPct} />;
      case 'narratives':
        return <NarrativesStep caseInfo={caseInfo} setCaseInfo={setCaseInfo} earningsParams={earningsParams} />;
      case 'household':
        return <HouseholdStep hhServices={hhServices} setHhServices={setHhServices} hhsData={hhsData} fmtUSD={fmtUSD} />;
      case 'lcp':
        return <LCPStep lcpItems={lcpItems} setLcpItems={setLcpItems} lcpData={lcpData} lifeExpectancy={caseInfo.lifeExpectancy} fmtUSD={fmtUSD} baseYear={baseCalendarYear} />;
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
            validationChecks={essentialChecks}
            onGoToStep={setCurrentStep}
            onPrint={handlePrint}
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
    <div className="min-h-screen bg-background font-sans text-foreground pb-24 md:pb-20 print:bg-white print:pb-0">
      {/* Navbar */}
      <nav className="bg-navy text-primary-foreground sticky top-0 z-50 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-indigo to-indigo-light p-1.5 sm:p-2 rounded-lg shadow-lg">
              <Sigma className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-lg tracking-tight">ForensicSuite <span className="text-indigo-light font-light">V10</span></h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            {/* Auto-save indicator */}
            <div className={`flex items-center gap-1.5 text-xs transition-all duration-300 ${saveIndicatorVisible || isAutoSaving ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {isAutoSaving ? (
                <>
                  <Cloud className="w-3.5 h-3.5 animate-pulse" />
                  <span>Syncing...</span>
                </>
              ) : saveIndicatorVisible ? (
                <>
                  <Save className="w-3.5 h-3.5 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : activeCaseId ? (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{lastAutoSave ? `Synced ${formatLastSaved(lastAutoSave)}` : formatLastSaved(lastSaved)}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatLastSaved(lastSaved)}</span>
                </>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep].label}
            </span>
            <CaseManager
              currentCase={{ caseInfo, earningsParams, hhServices, lcpItems, pastActuals, isUnionMode }}
              onLoadCase={handleLoadCase}
              onNewCase={handleNewCase}
              onOpenImport={() => setShowImportModal(true)}
              onOpenDashboard={() => setShowDashboard(true)}
              onCaseSaved={(caseId) => setActiveCase(caseId, caseData)}
            />
            <ExportHistory fmtUSD={fmtUSD} />
            <ThemeToggle />
            <UserMenu />
          </div>

          {/* Mobile/Tablet Header Actions */}
          <div className="flex lg:hidden items-center gap-1">
            <ThemeToggle />
            <UserMenu />
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-light border-t border-navy p-3 sm:p-4 space-y-2 print:hidden animate-in">
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-navy">
            <CaseManager
              currentCase={{ caseInfo, earningsParams, hhServices, lcpItems, pastActuals, isUnionMode }}
              onLoadCase={handleLoadCase}
              onNewCase={handleNewCase}
              onOpenImport={() => setShowImportModal(true)}
              onOpenDashboard={() => setShowDashboard(true)}
              onCaseSaved={(caseId) => setActiveCase(caseId, caseData)}
            />
            <ExportHistory fmtUSD={fmtUSD} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WIZARD_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <button 
                  key={step.id} 
                  onClick={() => { setCurrentStep(idx); setMobileMenuOpen(false); }} 
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                    currentStep === idx 
                      ? 'bg-indigo text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:bg-navy bg-navy/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard Navigation */}
      <WizardNavigation 
        steps={WIZARD_STEPS} 
        currentStep={currentStep}
        stepCompletion={stepCompletion}
        validationChecks={essentialChecks}
        onStepClick={setCurrentStep}
        onNext={() => setCurrentStep(Math.min(currentStep + 1, WIZARD_STEPS.length - 1))}
        onPrevious={() => setCurrentStep(Math.max(currentStep - 1, 0))}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8 print:p-0">
        <EmailVerificationBanner />
        <div className="print:hidden mb-4 sm:mb-6">
          <div className="bg-muted border border-border rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Quick start checklist</p>
                  <p className="text-xs text-muted-foreground">
                    Fill the essentials, then jump to the next step.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => nextNeededStepIndex !== null && nextNeededStepIndex >= 0 && setCurrentStep(nextNeededStepIndex)}
                  disabled={nextNeededStepIndex === null}
                  className={`flex-1 sm:flex-none px-3 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    nextNeededStepIndex === null
                      ? 'text-muted-foreground border-border cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                  }`}
                >
                  {nextNeededStepIndex === null ? 'All essentials complete' : 'Jump to next needed'}
                </button>
                <button
                  onClick={handleNewCase}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:bg-background transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {essentialChecks.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                    item.ok 
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' 
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
                  }`}
                >
                  {item.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Essentials: {completedEssentials}/{essentialsTotal}
            </div>
          </div>
        </div>
        {renderStep()}
      </main>

      {/* Import Modal */}
      {showImportModal && (
        <DataImport
          onImport={(importedCase) => {
            handleLoadCase(importedCase);
            setShowImportModal(false);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Dashboard Modal */}
      {showDashboard && (
        <Dashboard
          onClose={() => setShowDashboard(false)}
          onLoadCase={handleLoadCase}
          fmtUSD={fmtUSD}
        />
      )}

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
