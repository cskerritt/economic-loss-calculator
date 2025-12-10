import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FileText, FileDown, Download, Loader2, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Scissors } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection, EconomicLossReport } from './types';

// Page dimensions at 96 DPI (screen)
const PAGE_WIDTH_PX = 8.5 * 96; // 816px
const PAGE_HEIGHT_PX = 11 * 96; // 1056px
const PAGE_MARGIN_PX = 0.75 * 96; // 72px margins
const CONTENT_HEIGHT_PX = PAGE_HEIGHT_PX - (2 * PAGE_MARGIN_PX); // ~912px usable

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportSnapshot: EconomicLossReport;
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
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  isExportingPdf: boolean;
  isExportingWord: boolean;
  onPrint: () => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
}

// Page break indicator component
const PageBreakIndicator: React.FC<{ pageNumber: number }> = ({ pageNumber }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t-2 border-dashed border-blue-400" />
    </div>
    <div className="relative flex justify-center">
      <span className="bg-white px-4 py-1 text-xs font-medium text-blue-600 flex items-center gap-1 rounded-full border border-blue-300 shadow-sm">
        <Scissors className="w-3 h-3" />
        Page Break — End of Page {pageNumber}
      </span>
    </div>
  </div>
);

// Page wrapper component
const PageWrapper: React.FC<{ 
  pageNumber: number; 
  totalPages: number;
  children: React.ReactNode;
  zoom: number;
  isLast?: boolean;
}> = ({ pageNumber, totalPages, children, zoom, isLast = false }) => (
  <div className="relative mb-8">
    {/* Page number badge */}
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
      <span className="bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        Page {pageNumber} of {totalPages}
      </span>
    </div>
    
    {/* Page container */}
    <div 
      className="bg-white text-slate-900 shadow-2xl font-serif text-[11pt] leading-relaxed relative overflow-hidden"
      style={{ 
        width: `${PAGE_WIDTH_PX}px`,
        minHeight: `${PAGE_HEIGHT_PX}px`,
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top center',
        padding: `${PAGE_MARGIN_PX}px`,
        marginBottom: isLast ? 0 : `${20 * zoom / 100}px`,
      }}
    >
      {/* Page border overlay */}
      <div className="absolute inset-0 border-2 border-slate-300 pointer-events-none" />
      
      {/* Content */}
      {children}
      
      {/* Page footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[9pt] text-slate-400">
        Page {pageNumber}
      </div>
    </div>
  </div>
);

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  open,
  onOpenChange,
  reportSnapshot,
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
  scenarioProjections,
  selectedScenario,
  isExportingPdf,
  isExportingWord,
  onPrint,
  onExportPdf,
  onExportWord,
  fmtUSD,
  fmtPct,
}) => {
  const [zoom, setZoom] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Calculate total pages based on content
  const hasLcp = lcpItems.length > 0;
  const hasHhs = hhServices.active;
  const hasScenarios = scenarioProjections.filter(s => s.included).length > 0;
  
  // Estimate page count (simplified - in real app would measure content)
  const totalPages = 3 + (hasLcp ? 1 : 0) + (hasScenarios ? 1 : 0);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '[Date]';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 100));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 30));
  const handleFitWidth = () => setZoom(60);

  const handleExportAndClose = (exportFn: () => void) => {
    exportFn();
    onOpenChange(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-lg font-bold">Report Preview</DialogTitle>
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {totalPages} pages
              </span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Page Navigation */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mr-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium w-16 text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mr-2">
                <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleFitWidth} className="h-8 w-8 p-0" title="Fit width">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Export Buttons */}
              <Button variant="outline" size="sm" onClick={() => handleExportAndClose(onPrint)} className="gap-2">
                <FileText className="w-4 h-4" /> Print
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleExportAndClose(onExportPdf)} 
                disabled={isExportingPdf}
                className="gap-2 bg-rose-600 hover:bg-rose-700"
              >
                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                PDF
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleExportAndClose(onExportWord)} 
                disabled={isExportingWord}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isExportingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Word
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area with Multiple Pages */}
        <ScrollArea className="flex-1 bg-slate-300 dark:bg-slate-800" ref={scrollRef}>
          <div className="p-8 flex flex-col items-center min-h-full">
            
            {/* ===== PAGE 1: Title & Summary ===== */}
            <PageWrapper pageNumber={1} totalPages={totalPages} zoom={zoom}>
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
                <p className="text-justify text-[10pt]">
                  This is to certify that we are not related to any of the parties to the subject action, nor do we have any present or intended financial interest in this case beyond the fees due for professional services rendered in connection with this report and possible subsequent services. All assumptions, methodologies, and calculations utilized in this appraisal report are based on current knowledge and methods applied to the determination of projected pecuniary losses, consistent with accepted practices in forensic economics.
                </p>
              </section>

              {/* Opinion of Economic Losses */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Opinion of Economic Losses</h2>
                <p className="mb-4 text-sm">Within a reasonable degree of economic certainty, {caseInfo.plaintiff || '[Plaintiff]'} has sustained compensable economic losses as summarized below.</p>
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
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Background Facts</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <p><strong>Plaintiff:</strong> {caseInfo.plaintiff} ({caseInfo.gender})</p>
                  <p><strong>Date of Birth:</strong> {formatDate(caseInfo.dob)}</p>
                  <p><strong>Date of Injury:</strong> {formatDate(caseInfo.dateOfInjury)}</p>
                  <p><strong>Date of Trial:</strong> {formatDate(caseInfo.dateOfTrial)}</p>
                  <p><strong>Current Age:</strong> {dateCalc.currentAge} years</p>
                  <p><strong>Age at Injury:</strong> {dateCalc.ageInjury} years</p>
                  <p><strong>Life Expectancy:</strong> {caseInfo.lifeExpectancy} years</p>
                  <p><strong>Work Life Expectancy:</strong> {earningsParams.wle} years</p>
                </div>
              </section>
            </PageWrapper>

            <PageBreakIndicator pageNumber={1} />

            {/* ===== PAGE 2: Calculations ===== */}
            <PageWrapper pageNumber={2} totalPages={totalPages} zoom={zoom}>
              {/* AEF Summary */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Adjusted Earnings Factor (AEF) – Tinari Method</h2>
                <p className="text-sm mb-4">
                  Formula: AIF = {`{[((GE × WLF) × (1 - UF)) × (1 + FB)] - [(GE × WLF) × (1 - UF)] × TL}`} × (1 - PC)
                </p>
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
                      <td className="p-2 border border-slate-300">× Work Life Factor (WLF)</td>
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
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border border-slate-300" colSpan={2}>ADJUSTED INCOME FACTOR (AIF)</td>
                      <td className="p-2 border border-slate-300 text-right"></td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.fullMultiplier * 100).toFixed(4)}%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[9pt] text-slate-600">
                  Note: Taxes are applied only to base earnings (Step 5), not to fringe benefits.
                </p>
              </section>

              {/* Economic Variables */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Economic Variables</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <p><strong>Pre-Injury Earnings:</strong> {fmtUSD(earningsParams.baseEarnings)}/year</p>
                  <p><strong>Post-Injury Residual:</strong> {fmtUSD(earningsParams.residualEarnings)}/year</p>
                  <p><strong>Wage Growth Rate:</strong> {earningsParams.wageGrowth}%</p>
                  <p><strong>Discount Rate:</strong> {earningsParams.discountRate}%</p>
                  <p><strong>Unemployment Rate:</strong> {earningsParams.unemploymentRate}%</p>
                  <p><strong>UI Replacement Rate:</strong> {earningsParams.uiReplacementRate}%</p>
                  <p><strong>Federal Tax Rate:</strong> {earningsParams.fedTaxRate}%</p>
                  <p><strong>State Tax Rate:</strong> {earningsParams.stateTaxRate}%</p>
                  <p><strong>Combined Tax Rate:</strong> {fmtPct(algebraic.combinedTaxRate)}</p>
                  <p><strong>Fringe Rate:</strong> {isUnionMode ? `${earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1) : 0}% (Union)` : `${earningsParams.fringeRate}% (ECEC)`}</p>
                  <p><strong>Years to Separation:</strong> {dateCalc.derivedYFS.toFixed(2)} years</p>
                  <p><strong>Work Life Factor:</strong> {workLifeFactor.toFixed(2)}%</p>
                </div>
              </section>

              {/* Earnings Timeline Preview */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Earnings Timeline (Preview)</h2>
                <table className="w-full text-[9pt] border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-1 text-left border border-slate-300">Year</th>
                      <th className="p-1 text-center border border-slate-300">Type</th>
                      <th className="p-1 text-right border border-slate-300">Gross</th>
                      <th className="p-1 text-right border border-slate-300">Net Loss</th>
                      <th className="p-1 text-right border border-slate-300">PV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportSnapshot.periods.slice(0, 8).map((row, idx) => (
                      <tr key={idx} className={row.periodType === 'past' ? 'bg-slate-50' : ''}>
                        <td className="p-1 border border-slate-300 font-mono">{row.calendarYear}</td>
                        <td className="p-1 border border-slate-300 text-center">{row.periodType}</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.grossIncome)}</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.netLoss)}</td>
                        <td className="p-1 border border-slate-300 text-right font-mono">{fmtUSD(row.presentValue)}</td>
                      </tr>
                    ))}
                    {reportSnapshot.periods.length > 8 && (
                      <tr className="bg-slate-100">
                        <td colSpan={5} className="p-1 border border-slate-300 text-center text-[8pt] italic">
                          ... {reportSnapshot.periods.length - 8} more years (see full schedule in export)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            </PageWrapper>

            <PageBreakIndicator pageNumber={2} />

            {/* ===== PAGE 3: Scenarios ===== */}
            {hasScenarios && (
              <>
                <PageWrapper pageNumber={3} totalPages={totalPages} zoom={zoom}>
                  <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Retirement Scenario Analysis</h2>
                    <p className="text-sm mb-4">
                      The following table presents projected damages under multiple retirement age scenarios. 
                      The active scenario ({scenarioProjections.find(s => s.id === selectedScenario)?.label || 'N/A'}) 
                      is used for primary calculations throughout this report.
                    </p>
                    <table className="w-full text-sm border-collapse mb-8">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300">Scenario</th>
                          <th className="p-2 text-right border border-slate-300">Ret. Age</th>
                          <th className="p-2 text-right border border-slate-300">YFS</th>
                          <th className="p-2 text-right border border-slate-300">WLF</th>
                          <th className="p-2 text-right border border-slate-300">Past Loss</th>
                          <th className="p-2 text-right border border-slate-300">Future PV</th>
                          <th className="p-2 text-right border border-slate-300">Grand Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenarioProjections.filter(s => s.included).map(scenario => (
                          <tr key={scenario.id} className={scenario.id === selectedScenario ? 'bg-yellow-50' : ''}>
                            <td className="p-2 border border-slate-300">
                              {scenario.label}
                              {scenario.id === selectedScenario && <span className="ml-1 text-[9px] font-bold text-amber-600">(ACTIVE)</span>}
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
                    <p className="text-[9pt] text-slate-600">
                      <strong>Key:</strong> Ret. Age = Retirement Age; YFS = Years to Final Separation; WLF = Work Life Factor (WLE ÷ YFS × 100%).
                    </p>
                  </section>

                  {/* Household Services Summary */}
                  {hasHhs && (
                    <section className="mb-8">
                      <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Household Services Valuation</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="bg-slate-50 p-4 rounded border">
                          <p className="text-slate-600">Hours per Week</p>
                          <p className="text-2xl font-bold">{hhServices.hoursPerWeek}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border">
                          <p className="text-slate-600">Hourly Rate</p>
                          <p className="text-2xl font-bold">${hhServices.hourlyRate}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded border">
                          <p className="text-slate-600">Nominal Total</p>
                          <p className="text-2xl font-bold">{fmtUSD(hhsData.totalNom)}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded border border-emerald-200">
                          <p className="text-emerald-700">Present Value</p>
                          <p className="text-2xl font-bold text-emerald-700">{fmtUSD(hhsData.totalPV)}</p>
                        </div>
                      </div>
                    </section>
                  )}
                </PageWrapper>

                <PageBreakIndicator pageNumber={3} />
              </>
            )}

            {/* ===== PAGE 4: LCP (if applicable) ===== */}
            {hasLcp && (
              <>
                <PageWrapper pageNumber={hasScenarios ? 4 : 3} totalPages={totalPages} zoom={zoom}>
                  <section className="mb-8">
                    <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Life Care Plan Summary</h2>
                    <table className="w-full text-sm border-collapse mb-4">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left border border-slate-300">Item</th>
                          <th className="p-2 text-left border border-slate-300">Category</th>
                          <th className="p-2 text-right border border-slate-300">Base Cost</th>
                          <th className="p-2 text-right border border-slate-300">Duration</th>
                          <th className="p-2 text-right border border-slate-300">Present Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lcpData.items.map(item => {
                          const endYear = item.endYear ?? item.startYear + item.duration - 1;
                          const duration = Math.max(1, endYear - item.startYear + 1);
                          return (
                            <tr key={item.id}>
                              <td className="p-2 border border-slate-300">{item.name}</td>
                              <td className="p-2 border border-slate-300">{item.categoryId}</td>
                              <td className="p-2 border border-slate-300 text-right">{fmtUSD(item.baseCost)}</td>
                              <td className="p-2 border border-slate-300 text-right">{duration} yrs</td>
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
                </PageWrapper>

                <PageBreakIndicator pageNumber={hasScenarios ? 4 : 3} />
              </>
            )}

            {/* ===== FINAL PAGE: Footer & Metadata ===== */}
            <PageWrapper pageNumber={totalPages} totalPages={totalPages} zoom={zoom} isLast>
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Statement of Ethical Principles</h2>
                <p className="text-justify text-[10pt]">
                  The undersigned certifies that this appraisal was prepared in accordance with the ethical guidelines of the National Association of Forensic Economics (NAFE) and the American Rehabilitation Economics Association (AREA). The opinions expressed are based solely on the facts and data made available, and the undersigned has no financial interest in the outcome of this litigation.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Report Metadata</h2>
                <div className="bg-slate-50 p-4 rounded border text-sm space-y-2">
                  <p><strong>Report ID:</strong> <span className="font-mono text-[9pt]">{reportSnapshot.metadata.reportId}</span></p>
                  <p><strong>Generated:</strong> {new Date(reportSnapshot.metadata.generatedAt).toLocaleString()}</p>
                  <p><strong>Application:</strong> ForensicSuite v{reportSnapshot.metadata.appVersion}</p>
                  <p><strong>Schema Version:</strong> {reportSnapshot.metadata.schemaVersion}</p>
                  <p><strong>Calculation Method:</strong> Tinari Algebraic Method</p>
                  <p><strong>Active Scenario:</strong> {scenarioProjections.find(s => s.id === selectedScenario)?.label || 'N/A'}</p>
                  <p><strong>Included Scenarios:</strong> {reportSnapshot.metadata.includedScenarios.length}</p>
                </div>
              </section>

              <div className="text-center mt-16 pt-8 border-t-2 border-slate-900">
                <p className="text-sm font-bold">END OF REPORT</p>
                <p className="text-[9pt] text-slate-500 mt-2">
                  This document contains {totalPages} pages
                </p>
              </div>
            </PageWrapper>

          </div>
        </ScrollArea>

        {/* Bottom navigation bar */}
        <div className="p-3 border-t border-border bg-muted flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing all {totalPages} pages • Scroll to view entire report
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to Top
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
