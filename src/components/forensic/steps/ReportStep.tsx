import React, { useMemo, useState } from 'react';
import { FileText, FileDown, Download, Loader2, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, Briefcase, HeartPulse, Target, Home, Copy, FileSpreadsheet, FileJson, Eye } from 'lucide-react';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection, EconomicLossReport } from '../types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { exportSectionToWord, ExportSection } from '../exportUtils';
import { generateReportSnapshot } from '../reportSnapshot';
import { exportReportToJson, copyReportSummaryToClipboard } from '../jsonExport';
import { exportReportToExcel } from '../excelExport';
import { ReportPreviewModal } from '../ReportPreviewModal';
import { toast } from 'sonner';

export interface ValidationCheck {
  id: string;
  label: string;
  ok: boolean;
  stepId: string;
  stepLabel: string;
}

interface ReportStepProps {
  reportRef: React.RefObject<HTMLDivElement>;
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  hhServices: HhServices;
  lcpItems: LcpItem[];
  dateCalc: DateCalc;
  algebraic: Algebraic;
  projection: Projection;
  hhsData: HhsData;
  lcpData: LcpData;
  workLifeFactor: number;
  grandTotal: number;
  isUnionMode: boolean;
  isExportingPdf: boolean;
  isExportingWord: boolean;
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  validationChecks?: ValidationCheck[];
  onGoToStep?: (stepIndex: number) => void;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
  baseCalendarYear: number;
  ageAtInjury: number;
  userId?: string;
  caseId?: string;
}

export const ReportStep: React.FC<ReportStepProps> = ({
  reportRef,
  caseInfo,
  earningsParams,
  hhServices,
  lcpItems,
  dateCalc,
  algebraic,
  projection,
  hhsData,
  lcpData,
  workLifeFactor,
  grandTotal,
  isUnionMode,
  isExportingPdf,
  isExportingWord,
  scenarioProjections,
  selectedScenario,
  validationChecks = [],
  onGoToStep,
  onPrint,
  onExportPdf,
  onExportWord,
  fmtUSD,
  fmtPct,
  baseCalendarYear,
  ageAtInjury,
  userId,
  caseId
}) => {
  const [sectionExportsOpen, setSectionExportsOpen] = useState(false);
  const [dataExportsOpen, setDataExportsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [exportingSection, setExportingSection] = useState<ExportSection | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '[Date]';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const activeScenario = useMemo(
    () => scenarioProjections.find((s) => s.id === selectedScenario),
    [scenarioProjections, selectedScenario]
  );

  const failedChecks = validationChecks.filter(c => !c.ok);
  const passedChecks = validationChecks.filter(c => c.ok);
  const allValid = failedChecks.length === 0;

  // Group failed checks by step
  const failedByStep = useMemo(() => {
    const grouped: Record<string, { stepLabel: string; stepId: string; checks: ValidationCheck[] }> = {};
    failedChecks.forEach(check => {
      if (!grouped[check.stepId]) {
        grouped[check.stepId] = { stepLabel: check.stepLabel, stepId: check.stepId, checks: [] };
      }
      grouped[check.stepId].checks.push(check);
    });
    return Object.values(grouped);
  }, [failedChecks]);

  const stepIdToIndex: Record<string, number> = {
    case: 0,
    earnings: 1,
    narratives: 2,
    household: 3,
    lcp: 4,
    summary: 5,
    report: 6
  };

  const handleExportSection = async (section: ExportSection) => {
    setExportingSection(section);
    try {
      await exportSectionToWord(section, {
        caseInfo,
        earningsParams,
        projection,
        hhServices,
        hhsData,
        lcpItems,
        lcpData,
        algebraic,
        dateCalc,
        scenarioProjections,
        isUnionMode,
        baseCalendarYear,
        ageAtInjury,
        fmtUSD,
      });
    } finally {
      setExportingSection(null);
    }
  };

  // Generate report snapshot for exports
  const reportSnapshot = useMemo(() => generateReportSnapshot({
    caseInfo,
    earningsParams,
    hhServices,
    lcpItems,
    isUnionMode,
    dateCalc,
    algebraic,
    projection,
    hhsData,
    lcpData,
    workLifeFactor,
    grandTotal,
    scenarioProjections,
    selectedScenario,
    baseCalendarYear,
    userId,
    caseId,
  }), [caseInfo, earningsParams, hhServices, lcpItems, isUnionMode, dateCalc, algebraic, projection, hhsData, lcpData, workLifeFactor, grandTotal, scenarioProjections, selectedScenario, baseCalendarYear, userId, caseId]);

  const handleExportJson = async () => {
    setIsExportingJson(true);
    try {
      exportReportToJson(reportSnapshot);
      toast.success('JSON export completed');
    } catch (error) {
      toast.error('Failed to export JSON');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      exportReportToExcel(reportSnapshot);
      toast.success('Excel export completed');
    } catch (error) {
      toast.error('Failed to export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleCopySummary = async () => {
    try {
      await copyReportSummaryToClipboard(reportSnapshot);
      toast.success('Summary copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy summary');
    }
  };

  const sectionExportButtons: { section: ExportSection; label: string; icon: React.ElementType; disabled: boolean }[] = [
    { section: 'earnings', label: 'Earnings Schedule', icon: Briefcase, disabled: false },
    { section: 'scenarios', label: 'Scenario Comparison', icon: Target, disabled: scenarioProjections.length === 0 },
    { section: 'lcp', label: 'Life Care Plan', icon: HeartPulse, disabled: lcpItems.length === 0 },
    { section: 'household', label: 'Household Services', icon: Home, disabled: !hhServices.active },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Validation Panel */}
      <div className="print:hidden mb-6">
        {!allValid ? (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Validation Required</h3>
                <p className="text-sm text-muted-foreground">
                  {failedChecks.length} required field{failedChecks.length !== 1 ? 's' : ''} need attention before exporting
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {failedByStep.map(group => (
                <div key={group.stepId} className="bg-background rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-muted-foreground">{group.stepLabel}</span>
                    {onGoToStep && (
                      <button
                        onClick={() => onGoToStep(stepIdToIndex[group.stepId] ?? 0)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Go to step <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {group.checks.map(check => (
                      <li key={check.id} className="flex items-center gap-2 text-sm text-destructive">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                        {check.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Ready to Export</h3>
                <p className="text-sm text-muted-foreground">
                  All {passedChecks.length} required fields are complete
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Buttons */}
      <div className="text-center mb-6 print:hidden">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Generate Report</h2>
        <p className="text-sm text-muted-foreground mt-1">Export your complete economic appraisal report</p>
        
        {/* Preview Button */}
        <div className="mt-4">
          <button 
            onClick={() => setPreviewOpen(true)} 
            disabled={!allValid}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 min-h-[48px] rounded-full font-bold shadow-lg hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]"
          >
            <Eye className="w-5 h-5" /> Preview Report
          </button>
        </div>
        
        {/* Primary Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mt-4">
          <button onClick={onPrint} disabled={!allValid} className="bg-slate-900 text-white px-5 py-3 min-h-[48px] rounded-full font-bold shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]">
            <FileText className="w-5 h-5" /> Print Report
          </button>
          <button onClick={onExportPdf} disabled={isExportingPdf || !allValid} className="bg-rose-600 text-white px-5 py-3 min-h-[48px] rounded-full font-bold shadow-lg hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]">
            {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            {isExportingPdf ? 'Exporting...' : 'Download PDF'}
          </button>
          <button onClick={onExportWord} disabled={isExportingWord || !allValid} className="bg-blue-600 text-white px-5 py-3 min-h-[48px] rounded-full font-bold shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation active:scale-[0.98]">
            {isExportingWord ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExportingWord ? 'Exporting...' : 'Download Word'}
          </button>
        </div>

        {/* Secondary Export Buttons - Data Formats */}
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          <button onClick={handleExportExcel} disabled={isExportingExcel || !allValid} className="bg-emerald-600 text-white px-4 py-2 rounded-full font-medium shadow hover:bg-emerald-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Excel
          </button>
          <button onClick={handleExportJson} disabled={isExportingJson || !allValid} className="bg-amber-600 text-white px-4 py-2 rounded-full font-medium shadow hover:bg-amber-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isExportingJson ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            JSON
          </button>
          <button onClick={handleCopySummary} disabled={!allValid} className="bg-slate-600 text-white px-4 py-2 rounded-full font-medium shadow hover:bg-slate-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Copy className="w-4 h-4" /> Copy Summary
          </button>
        </div>

        {!allValid && (
          <p className="text-xs text-destructive mt-3">Complete all required fields above to enable export</p>
        )}
      </div>

      {/* Report Preview Modal */}
      <ReportPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        reportSnapshot={reportSnapshot}
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
        scenarioProjections={scenarioProjections}
        selectedScenario={selectedScenario}
        isExportingPdf={isExportingPdf}
        isExportingWord={isExportingWord}
        onPrint={onPrint}
        onExportPdf={onExportPdf}
        onExportWord={onExportWord}
        fmtUSD={fmtUSD}
        fmtPct={fmtPct}
      />

      {/* Section Export Options */}
      <div className="print:hidden mb-6">
        <Collapsible open={sectionExportsOpen} onOpenChange={setSectionExportsOpen}>
          <CollapsibleTrigger className="w-full bg-muted border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/80 transition-colors">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Export Individual Sections</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Word documents for specific sections</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sectionExportsOpen ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border border-t-0 border-border rounded-b-lg p-4 bg-background">
              <p className="text-xs text-muted-foreground mb-4">
                Export individual sections as separate Word documents for modularity and focused review.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {sectionExportButtons.map(({ section, label, icon: Icon, disabled }) => (
                  <button
                    key={section}
                    onClick={() => handleExportSection(section)}
                    disabled={disabled || exportingSection === section}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingSection === section ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <Icon className="w-5 h-5 text-primary" />
                    )}
                    <span className="text-xs font-medium text-center">{label}</span>
                    {disabled && <span className="text-[10px] text-muted-foreground">No data</span>}
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="print:hidden bg-muted border border-border rounded-lg p-4 mb-6">
        <p className="text-sm font-bold text-foreground">Before you export</p>
        <p className="text-xs text-muted-foreground mt-1">
          The report uses the active scenario (<span className="font-semibold text-foreground">{activeScenario?.label || 'Not set'}</span>) and only the scenarios you checked on the Summary page. When ready, choose Print, PDF, or Word above.
        </p>
      </div>

      {/* Full Report */}
      <div ref={reportRef} className="bg-white text-slate-900 p-8 shadow-lg rounded-lg print:shadow-none print:rounded-none font-serif text-[11pt] leading-relaxed">
        
        {/* Header */}
        <header className="text-center mb-8 border-b-2 border-slate-900 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-4">Appraisal of Economic Loss</h1>
          <p className="text-sm">PREPARED BY: Kincaid Wolstein Vocational and Rehabilitation Services</p>
          <p className="text-sm">One University Plaza ~ Suite 302, Hackensack, New Jersey 07601</p>
          <div className="mt-4 text-sm space-y-1">
            <p>PREPARED FOR: {caseInfo.attorney || '[Attorney]'} — {caseInfo.lawFirm || '[Law Firm]'}</p>
            <p>REGARDING: {caseInfo.plaintiff || '[Plaintiff]'}</p>
            <p>DATE OF BIRTH: {formatDate(caseInfo.dob)}</p>
            <p>REPORT DATE: {formatDate(caseInfo.reportDate)}</p>
          </div>
        </header>

        {/* Certification */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Certification</h2>
          <p className="text-justify">
            This is to certify that we are not related to any of the parties to the subject action, nor do we have any present or intended financial interest in this case beyond the fees due for professional services rendered in connection with this report and possible subsequent services. All assumptions, methodologies, and calculations utilized in this appraisal report are based on current knowledge and methods applied to the determination of projected pecuniary losses, consistent with accepted practices in forensic economics.
          </p>
        </section>

        {/* Opinion of Economic Losses */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Opinion of Economic Losses</h2>
          <p className="mb-4">Within a reasonable degree of economic certainty, {caseInfo.plaintiff || '[Plaintiff]'} has sustained compensable economic losses as summarized below.</p>
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left border border-slate-300">Category</th>
                <th className="p-2 text-right border border-slate-300">Past Value</th>
                <th className="p-2 text-right border border-slate-300">Future (PV)</th>
                <th className="p-2 text-right border border-slate-300">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-300">Lost Earning Capacity</td>
                <td className="p-2 border border-slate-300 text-right">{fmtUSD(projection.totalPastLoss)}</td>
                <td className="p-2 border border-slate-300 text-right">{fmtUSD(projection.totalFuturePV)}</td>
                <td className="p-2 border border-slate-300 text-right font-bold">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
              </tr>
              {hhServices.active && (
                <tr>
                  <td className="p-2 border border-slate-300">Household Services</td>
                  <td className="p-2 border border-slate-300 text-right">—</td>
                  <td className="p-2 border border-slate-300 text-right">{fmtUSD(hhsData.totalPV)}</td>
                  <td className="p-2 border border-slate-300 text-right font-bold">{fmtUSD(hhsData.totalPV)}</td>
                </tr>
              )}
              {lcpItems.length > 0 && (
                <tr>
                  <td className="p-2 border border-slate-300">Life Care Plan</td>
                  <td className="p-2 border border-slate-300 text-right">—</td>
                  <td className="p-2 border border-slate-300 text-right">{fmtUSD(lcpData.totalPV)}</td>
                  <td className="p-2 border border-slate-300 text-right font-bold">{fmtUSD(lcpData.totalPV)}</td>
                </tr>
              )}
              <tr className="bg-slate-100 font-bold">
                <td className="p-2 border border-slate-300">GRAND TOTAL</td>
                <td className="p-2 border border-slate-300 text-right">{fmtUSD(projection.totalPastLoss)}</td>
                <td className="p-2 border border-slate-300 text-right">{fmtUSD(projection.totalFuturePV + (hhServices.active ? hhsData.totalPV : 0) + lcpData.totalPV)}</td>
                <td className="p-2 border border-slate-300 text-right text-lg">{fmtUSD(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Background Facts */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Background Facts and Assumptions</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4">
            <p><strong>Plaintiff:</strong> {caseInfo.plaintiff} ({caseInfo.gender})</p>
            <p><strong>Date of Birth:</strong> {formatDate(caseInfo.dob)}</p>
            <p><strong>Date of Injury:</strong> {formatDate(caseInfo.dateOfInjury)}</p>
            <p><strong>Date of Trial:</strong> {formatDate(caseInfo.dateOfTrial)}</p>
            <p><strong>Residence:</strong> {[caseInfo.city, caseInfo.county, caseInfo.state].filter(Boolean).join(', ')}</p>
            <p><strong>Education:</strong> {caseInfo.education}</p>
            <p><strong>Current Age:</strong> {dateCalc.currentAge} years</p>
            <p><strong>Age at Injury:</strong> {dateCalc.ageInjury} years</p>
            <p><strong>Life Expectancy:</strong> {caseInfo.lifeExpectancy} years</p>
            <p><strong>Work Life Expectancy:</strong> {earningsParams.wle} years</p>
            <p><strong>Years to Separation:</strong> {dateCalc.derivedYFS.toFixed(2)} years</p>
            <p><strong>Work Life Factor:</strong> {workLifeFactor.toFixed(2)}%</p>
          </div>
          
          {caseInfo.medicalSummary && (
            <div className="mb-4">
              <h3 className="font-bold text-sm uppercase mb-1">Medical Summary</h3>
              <p className="text-justify">{caseInfo.medicalSummary}</p>
            </div>
          )}
          {caseInfo.employmentHistory && (
            <div className="mb-4">
              <h3 className="font-bold text-sm uppercase mb-1">Employment History</h3>
              <p className="text-justify">{caseInfo.employmentHistory}</p>
            </div>
          )}
          {caseInfo.preInjuryCapacity && (
            <div className="mb-4">
              <h3 className="font-bold text-sm uppercase mb-1">Pre-Injury Earning Capacity</h3>
              <p className="text-justify">{caseInfo.preInjuryCapacity}</p>
            </div>
          )}
          {caseInfo.postInjuryCapacity && (
            <div className="mb-4">
              <h3 className="font-bold text-sm uppercase mb-1">Post-Injury Earning Capacity</h3>
              <p className="text-justify">{caseInfo.postInjuryCapacity}</p>
            </div>
          )}
        </section>

        {/* AEF Table - Tinari Algebraic Method */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Adjusted Earnings Factor (AEF) – Tinari Algebraic Method</h2>
          <p className="text-sm mb-4">The Tinari method calculates the Adjusted Income Factor (AIF) using the formula: AIF = {`{[((GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL}`} × (1 - PC)</p>
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left border border-slate-300">Step</th>
                <th className="p-2 text-left border border-slate-300">Component</th>
                <th className="p-2 text-right border border-slate-300">Factor</th>
                <th className="p-2 text-right border border-slate-300">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-300">1</td>
                <td className="p-2 border border-slate-300">Gross Earnings Base</td>
                <td className="p-2 border border-slate-300 text-right font-mono">100.00%</td>
                <td className="p-2 border border-slate-300 text-right font-mono">100.00%</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">2</td>
                <td className="p-2 border border-slate-300">× Work Life Factor (WLF = WLE ÷ YFS)</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.wlf * 100).toFixed(2)}%</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.worklifeAdjustedBase * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">3</td>
                <td className="p-2 border border-slate-300">× (1 - Unemployment Factor)</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.unempFactor * 100).toFixed(2)}%</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.unemploymentAdjustedBase * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">4</td>
                <td className="p-2 border border-slate-300">× (1 + Fringe Benefits)</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.fringeFactor * 100).toFixed(2)}%</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.grossCompensationWithFringes * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">5</td>
                <td className="p-2 border border-slate-300">− Tax on Base Earnings (not fringes)</td>
                <td className="p-2 border border-slate-300 text-right font-mono">-{(algebraic.taxOnBaseEarnings * 100).toFixed(2)}%</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.afterTaxCompensation * 100).toFixed(2)}%</td>
              </tr>
              {earningsParams.isWrongfulDeath && (
                <>
                  <tr className="bg-rose-50">
                    <td className="p-2 border border-slate-300">6</td>
                    <td className="p-2 border border-slate-300">× (1 - Personal Consumption) Era 1</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.era1PersonalConsumptionFactor * 100).toFixed(2)}%</td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">{(algebraic.era1AIF * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="bg-rose-50">
                    <td className="p-2 border border-slate-300">6</td>
                    <td className="p-2 border border-slate-300">× (1 - Personal Consumption) Era 2</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.era2PersonalConsumptionFactor * 100).toFixed(2)}%</td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">{(algebraic.era2AIF * 100).toFixed(2)}%</td>
                  </tr>
                </>
              )}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={2} className="p-2 border border-slate-300">ADJUSTED INCOME FACTOR (AIF)</td>
                <td className="p-2 border border-slate-300 text-right"></td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.fullMultiplier * 100).toFixed(4)}%</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10pt] text-slate-600">
            <strong>Key:</strong> Taxes are applied only to base earnings (Step 5), not to fringe benefits—this is critical to the Tinari method.
            {earningsParams.isWrongfulDeath && " Personal consumption is deducted in wrongful death cases (Step 6)."}
            {earningsParams.useEraSplit && ` Era-based calculations use ${earningsParams.era1WageGrowth}% wage growth for past and ${earningsParams.era2WageGrowth}% for future periods.`}
          </p>
        </section>

        {/* Economic Variables */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Economic Variables</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <p><strong>Pre-Injury Earnings:</strong> {fmtUSD(earningsParams.baseEarnings)}/year</p>
            <p><strong>Post-Injury Residual:</strong> {fmtUSD(earningsParams.residualEarnings)}/year</p>
            <p><strong>Wage Growth Rate:</strong> {earningsParams.wageGrowth}%</p>
            <p><strong>Discount Rate:</strong> {earningsParams.discountRate}%</p>
            <p><strong>Unemployment Rate:</strong> {earningsParams.unemploymentRate}%</p>
            <p><strong>UI Replacement Rate:</strong> {earningsParams.uiReplacementRate}%</p>
            <p><strong>Federal Tax Rate:</strong> {earningsParams.fedTaxRate}%</p>
            <p><strong>State Tax Rate:</strong> {earningsParams.stateTaxRate}%</p>
            <p><strong>Combined Tax Rate:</strong> {fmtPct(algebraic.combinedTaxRate)}</p>
            <p><strong>Fringe Rate:</strong> {isUnionMode ? `${((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1)}% (Union)` : `${earningsParams.fringeRate}% (ECEC)`}</p>
          </div>
        </section>

        {/* Year-Over-Year Timeline (Collapsible in print, always visible) */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Year-Over-Year Earnings Timeline</h2>
          <p className="text-sm mb-4">The following table shows the projected earnings loss for each year from the date of injury through assumed retirement.</p>
          
          {/* Combined Past & Future Table */}
          <table className="w-full text-[9pt] border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-1 text-left border border-slate-300">Year</th>
                <th className="p-1 text-center border border-slate-300">Calendar</th>
                <th className="p-1 text-center border border-slate-300">Period</th>
                <th className="p-1 text-right border border-slate-300">Gross Income</th>
                <th className="p-1 text-right border border-slate-300">Net Loss</th>
                <th className="p-1 text-right border border-slate-300">Discount</th>
                <th className="p-1 text-right border border-slate-300">PV</th>
                <th className="p-1 text-right border border-slate-300">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {reportSnapshot.periods.map((row, idx) => (
                <tr key={idx} className={row.periodType === 'past' ? 'bg-slate-50' : ''}>
                  <td className="p-1 border border-slate-300 font-mono">{row.yearNum}</td>
                  <td className="p-1 border border-slate-300 text-center font-mono">{row.calendarYear}</td>
                  <td className="p-1 border border-slate-300 text-center text-[8pt]">{row.periodType === 'past' ? 'Past' : 'Future'}</td>
                  <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.grossIncome)}</td>
                  <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.netLoss)}</td>
                  <td className="p-1 border border-slate-300 text-right font-mono">{row.discountFactor.toFixed(4)}</td>
                  <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.presentValue)}</td>
                  <td className="p-1 border border-slate-300 text-right font-mono font-bold">{fmtUSD(row.cumulativePV)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="p-1 border border-slate-300 text-right">TOTALS</td>
                <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(projection.totalPastLoss + projection.totalFutureNominal)}</td>
                <td className="p-1 border border-slate-300"></td>
                <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
                <td className="p-1 border border-slate-300"></td>
              </tr>
            </tbody>
          </table>
          <p className="text-[9pt] text-slate-600 mt-2">
            <strong>Note:</strong> Past losses are shown at nominal value (discount factor = 1.0). Future losses are discounted to present value using a {earningsParams.discountRate}% annual rate with mid-year convention.
          </p>
        </section>

        {/* LCP Summary */}
        {lcpItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Life Care Plan Summary</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left border border-slate-300">Item</th>
                  <th className="p-2 text-left border border-slate-300">Category</th>
                  <th className="p-2 text-right border border-slate-300">Base Cost</th>
                  <th className="p-2 text-right border border-slate-300">Duration</th>
                  <th className="p-2 text-right border border-slate-300">PV</th>
                </tr>
              </thead>
              <tbody>
                {lcpData.items.map(item => {
                  const endYear = item.endYear ?? item.startYear + item.duration - 1;
                  const duration = Math.max(1, endYear - item.startYear + 1);
                  const durationLabel = item.useCustomYears
                    ? `${item.customYears.length} selected`
                    : `${duration} yrs`;
                  return (
                    <tr key={item.id}>
                      <td className="p-2 border border-slate-300">{item.name}</td>
                      <td className="p-2 border border-slate-300">{item.categoryId}</td>
                      <td className="p-2 border border-slate-300 text-right">{fmtUSD(item.baseCost)}</td>
                      <td className="p-2 border border-slate-300 text-right">{durationLabel}</td>
                      <td className="p-2 border border-slate-300 text-right font-bold">{fmtUSD(item.totalPV)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={4} className="p-2 border border-slate-300 text-right">TOTAL</td>
                  <td className="p-2 border border-slate-300 text-right">{fmtUSD(lcpData.totalPV)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Retirement Scenario Comparison */}
        {scenarioProjections.filter(s => s.included).length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Retirement Scenario Analysis</h2>
            <p className="mb-4 text-sm">
              The following table presents projected damages under multiple retirement age scenarios. The active scenario ({scenarioProjections.find(s => s.id === selectedScenario)?.label || 'N/A'}) is used for primary calculations throughout this report.
            </p>
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left border border-slate-300">Scenario</th>
                  <th className="p-2 text-right border border-slate-300">Ret. Age</th>
                  <th className="p-2 text-right border border-slate-300">YFS</th>
                  <th className="p-2 text-right border border-slate-300">WLF</th>
                  <th className="p-2 text-right border border-slate-300">Past Loss</th>
                  <th className="p-2 text-right border border-slate-300">Future (PV)</th>
                  <th className="p-2 text-right border border-slate-300">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {scenarioProjections.filter(s => s.included).map(scenario => (
                  <tr key={scenario.id} className={scenario.id === selectedScenario ? 'bg-slate-100' : ''}>
                    <td className="p-2 border border-slate-300">
                      {scenario.label}
                      {scenario.id === selectedScenario && <span className="ml-1 text-[9px] font-bold">(ACTIVE)</span>}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{scenario.retirementAge.toFixed(1)}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{scenario.yfs.toFixed(2)}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{scenario.wlfPercent.toFixed(2)}%</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{fmtUSD(scenario.totalPastLoss)}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{fmtUSD(scenario.totalFuturePV)}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-bold">{fmtUSD(scenario.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10pt] text-slate-600">
              <strong>Key:</strong> Ret. Age = Retirement Age; YFS = Years to Final Separation (from injury date to retirement); WLF = Work Life Factor (WLE ÷ YFS × 100%). Grand Total includes earnings loss, household services (if applicable), and life care plan costs.
            </p>
          </section>
        )}

        {/* APPENDIX */}
        <section className="mb-8 page-break-before">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-6 text-center">APPENDIX – TERMINOLOGY AND METHODOLOGY</h2>
          
          <div className="mb-6">
            <h3 className="font-bold mb-2">Life Expectancy</h3>
            <p className="text-justify text-[10pt]">
              Life expectancy is the average number of years remaining for a person of a given age, sex, and demographic profile, based on actuarial mortality tables. For this appraisal, life expectancy is drawn from {caseInfo.lifeTableSource || 'the most recent United States life tables published by the National Center for Health Statistics'}. The remaining life expectancy of {caseInfo.lifeExpectancy || '[X.XX]'} years is used as the planning horizon for life care plan items that extend through the end of life.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Work Life Expectancy</h3>
            <p className="text-justify text-[10pt]">
              Work life expectancy (WLE) is the expected number of years a person will remain in the labor force, accounting for periods of employment, unemployment, and labor-force withdrawal. WLE differs from life expectancy because not all remaining years of life are spent working. For this appraisal, WLE of {earningsParams.wle} years is based on {caseInfo.wleSource || 'authoritative work life expectancy tables'}.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Years to Final Separation</h3>
            <p className="text-justify text-[10pt]">
              Years to Final Separation (YFS) is the number of years from the valuation date to the assumed retirement or final separation from the labor force. For this appraisal, YFS is calculated as {dateCalc.derivedYFS.toFixed(2)} years, representing the time from the valuation date until the assumed retirement age of {caseInfo.retirementAge}.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Work Life Factor</h3>
            <p className="text-justify text-[10pt]">
              The Work Life Factor (WLF) represents the ratio of expected work life to years from the valuation date to assumed retirement. It is calculated as:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              WLF = WLE ÷ YFS = {earningsParams.wle} ÷ {dateCalc.derivedYFS.toFixed(2)} = {algebraic.wlf.toFixed(4)} ({workLifeFactor.toFixed(2)}%)
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Wage Growth Rate</h3>
            <p className="text-justify text-[10pt]">
              To project future losses, a constant nominal wage and benefit growth rate of {earningsParams.wageGrowth}% is applied. This rate incorporates both expected general price inflation and real wage growth and is anchored to long-run U.S. Bureau of Labor Statistics Employment Cost Index (ECI) data.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Net Unemployment Adjustment</h3>
            <p className="text-justify text-[10pt]">
              During periods of involuntary unemployment, unemployment insurance (UI) benefits partially offset wage loss. The net unemployment adjustment is calculated as:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              Net Unemp Factor = 1 − (UF × [1 − UI]) = 1 − ({(earningsParams.unemploymentRate/100).toFixed(4)} × [1 − {(earningsParams.uiReplacementRate/100).toFixed(2)}]) = {algebraic.unempFactor.toFixed(4)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Tax Adjustment Factor</h3>
            <p className="text-justify text-[10pt]">
              The tax adjustment factor reflects the fact that compensatory damages for personal physical injury are generally excluded from gross income under IRC §104(a)(2). The combined effective tax rate is calculated multiplicatively:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              Combined = 1 − (1 − FedTax) × (1 − StateTax) = 1 − (1 − {(earningsParams.fedTaxRate/100).toFixed(4)}) × (1 − {(earningsParams.stateTaxRate/100).toFixed(4)}) = {fmtPct(algebraic.combinedTaxRate)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Discount Rate</h3>
            <p className="text-justify text-[10pt]">
              Where the governing legal framework requires conversion of future losses to present value, this appraisal discounts the projected after-tax loss stream using a discount rate of {earningsParams.discountRate}%, consistent with <em>Jones & Laughlin Steel Corp. v. Pfeifer</em>.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Net Discount Rate</h3>
            <p className="text-justify text-[10pt]">
              The net discount rate (NDR) captures the combined effect of the discount rate and the assumed growth rate:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              NDR = (1 + r) / (1 + g) − 1 = (1 + {(earningsParams.discountRate/100).toFixed(4)}) / (1 + {(earningsParams.wageGrowth/100).toFixed(4)}) − 1 = {(((1 + earningsParams.discountRate/100) / (1 + earningsParams.wageGrowth/100)) - 1).toFixed(4)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Present Value</h3>
            <p className="text-justify text-[10pt]">
              Present value is the idea that a dollar received in the future is worth less than a dollar received today. Using a mid-year convention:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              PV<sub>t</sub> = FV<sub>t</sub> / (1 + r)<sup>t−0.5</sup>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Adjusted Earnings Factor (AEF)</h3>
            <p className="text-justify text-[10pt]">
              The AEF is an algebraic shorthand that combines several adjustments into a single multiplicative term:
            </p>
            <div className="bg-slate-50 p-3 my-2 text-center font-mono text-[10pt] border border-slate-200 rounded">
              AEF = WLF × (1 − UF) × (1 − TR) × (1 + FB) = {algebraic.fullMultiplier.toFixed(5)}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold mb-2">Fringe-Benefit Loading Rate</h3>
            <p className="text-justify text-[10pt]">
              Employer-paid benefits are valued relative to wages through a fringe-benefit loading rate. {isUnionMode ? `For this case using union plan values, the total annual fringe benefits of ${fmtUSD(algebraic.flatFringeAmount)} relative to base earnings of ${fmtUSD(earningsParams.baseEarnings)} yields an effective loading rate of ${earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(2) : 0}%.` : `For this case using ECEC benchmark values, a fringe loading rate of ${earningsParams.fringeRate}% is applied.`}
            </p>
          </div>

          {hhServices.active && (
            <div className="mb-6">
              <h3 className="font-bold mb-2">Household Services Valuation</h3>
              <p className="text-justify text-[10pt]">
                Household services represent the economic value of unpaid domestic work. The valuation is based on {hhServices.hoursPerWeek} hours per week at ${hhServices.hourlyRate}/hour, grown at {hhServices.growthRate}% annually and discounted at {hhServices.discountRate}%. The resulting present value is {fmtUSD(hhsData.totalPV)}.
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-bold mb-2">Mitigation and Replacement Earnings</h3>
            <p className="text-justify text-[10pt]">
              Under the doctrine of mitigation, an injured party has a duty to minimize damages. Post-injury earnings capacity of {fmtUSD(earningsParams.residualEarnings)} per year represents the earnings the plaintiff can reasonably be expected to obtain given functional limitations. The difference between but-for earnings and actual/attainable post-injury earnings constitutes the compensable loss.
            </p>
          </div>

          {lcpItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold mb-2">Life Care Plan Costing Methodology</h3>
              <p className="text-justify text-[10pt]">
                Life care plan costs are projected using category-specific CPI growth rates and discounted to present value. Each item is inflated from its base-year cost using the applicable medical price index, then discounted using the mid-year convention.
              </p>
            </div>
          )}
        </section>

        {/* Statement of Ethics */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Statement of Ethical Principles</h2>
          <p className="text-justify text-[10pt]">
            The undersigned certifies that this appraisal was prepared in accordance with the ethical guidelines of the National Association of Forensic Economics (NAFE) and the American Rehabilitation Economics Association (AREA). The opinions expressed are based solely on the facts and data made available, and the undersigned has no financial interest in the outcome of this litigation.
          </p>
        </section>

      </div>
    </div>
  );
};
