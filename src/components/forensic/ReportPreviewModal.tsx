import React, { useRef } from 'react';
import { X, FileText, FileDown, Download, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection, EconomicLossReport } from './types';

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
  const [zoom, setZoom] = React.useState(75);
  const previewRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '[Date]';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleFitWidth = () => setZoom(75);

  const handleExportAndClose = (exportFn: () => void) => {
    exportFn();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-background">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Report Preview</DialogTitle>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 mr-4 bg-muted rounded-lg p-1">
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

        {/* Preview Area */}
        <ScrollArea className="flex-1 bg-slate-200 dark:bg-slate-800">
          <div className="p-8 flex justify-center min-h-full">
            <div 
              ref={previewRef}
              className="bg-white text-slate-900 shadow-2xl font-serif text-[11pt] leading-relaxed origin-top transition-transform"
              style={{ 
                width: `${8.5 * 96}px`, // 8.5 inches at 96dpi
                minHeight: `${11 * 96}px`, // 11 inches at 96dpi
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                padding: '0.75in',
              }}
            >
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
                  This is to certify that we are not related to any of the parties to the subject action, nor do we have any present or intended financial interest in this case beyond the fees due for professional services rendered in connection with this report and possible subsequent services.
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
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-4">
                  <p><strong>Plaintiff:</strong> {caseInfo.plaintiff} ({caseInfo.gender})</p>
                  <p><strong>Date of Birth:</strong> {formatDate(caseInfo.dob)}</p>
                  <p><strong>Date of Injury:</strong> {formatDate(caseInfo.dateOfInjury)}</p>
                  <p><strong>Date of Trial:</strong> {formatDate(caseInfo.dateOfTrial)}</p>
                  <p><strong>Current Age:</strong> {dateCalc.currentAge} years</p>
                  <p><strong>Age at Injury:</strong> {dateCalc.ageInjury} years</p>
                  <p><strong>Life Expectancy:</strong> {caseInfo.lifeExpectancy} years</p>
                  <p><strong>Work Life Expectancy:</strong> {earningsParams.wle} years</p>
                  <p><strong>Years to Separation:</strong> {dateCalc.derivedYFS.toFixed(2)} years</p>
                  <p><strong>Work Life Factor:</strong> {workLifeFactor.toFixed(2)}%</p>
                </div>
              </section>

              {/* AEF Summary */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Adjusted Earnings Factor (AEF)</h2>
                <table className="w-full text-sm border-collapse mb-4">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left border border-slate-300">Component</th>
                      <th className="p-2 text-right border border-slate-300">Factor</th>
                      <th className="p-2 text-right border border-slate-300">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-300">Gross Earnings Base</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">100.00%</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">100.00%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300">× Work Life Factor (WLF)</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.wlf * 100).toFixed(2)}%</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.worklifeAdjustedBase * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300">× (1 - Unemployment Factor)</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.unempFactor * 100).toFixed(2)}%</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.unemploymentAdjustedBase * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300">× (1 + Fringe Benefits)</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.fringeFactor * 100).toFixed(2)}%</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.grossCompensationWithFringes * 100).toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300">− Tax on Base Earnings</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">-{(algebraic.taxOnBaseEarnings * 100).toFixed(2)}%</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.afterTaxCompensation * 100).toFixed(2)}%</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border border-slate-300">ADJUSTED INCOME FACTOR (AIF)</td>
                      <td className="p-2 border border-slate-300 text-right"></td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.fullMultiplier * 100).toFixed(4)}%</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Economic Variables */}
              <section className="mb-8">
                <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Economic Variables</h2>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                  <p><strong>Pre-Injury Earnings:</strong> {fmtUSD(earningsParams.baseEarnings)}/year</p>
                  <p><strong>Post-Injury Residual:</strong> {fmtUSD(earningsParams.residualEarnings)}/year</p>
                  <p><strong>Wage Growth Rate:</strong> {earningsParams.wageGrowth}%</p>
                  <p><strong>Discount Rate:</strong> {earningsParams.discountRate}%</p>
                  <p><strong>Federal Tax Rate:</strong> {earningsParams.fedTaxRate}%</p>
                  <p><strong>State Tax Rate:</strong> {earningsParams.stateTaxRate}%</p>
                  <p><strong>Combined Tax Rate:</strong> {fmtPct(algebraic.combinedTaxRate)}</p>
                  <p><strong>Fringe Rate:</strong> {isUnionMode ? `${earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1) : 0}% (Union)` : `${earningsParams.fringeRate}% (ECEC)`}</p>
                </div>
              </section>

              {/* Retirement Scenarios */}
              {scenarioProjections.filter(s => s.included).length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Retirement Scenario Analysis</h2>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-2 text-left border border-slate-300">Scenario</th>
                        <th className="p-2 text-right border border-slate-300">Ret. Age</th>
                        <th className="p-2 text-right border border-slate-300">YFS</th>
                        <th className="p-2 text-right border border-slate-300">WLF</th>
                        <th className="p-2 text-right border border-slate-300">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioProjections.filter(s => s.included).map(scenario => (
                        <tr key={scenario.id} className={scenario.id === selectedScenario ? 'bg-slate-50' : ''}>
                          <td className="p-2 border border-slate-300">
                            {scenario.label}
                            {scenario.id === selectedScenario && <span className="ml-1 text-[9px] font-bold">(ACTIVE)</span>}
                          </td>
                          <td className="p-2 border border-slate-300 text-right font-mono">{scenario.retirementAge.toFixed(1)}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono">{scenario.yfs.toFixed(2)}</td>
                          <td className="p-2 border border-slate-300 text-right font-mono">{scenario.wlfPercent.toFixed(2)}%</td>
                          <td className="p-2 border border-slate-300 text-right font-mono font-bold">{fmtUSD(scenario.grandTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* Report Metadata Footer */}
              <footer className="mt-12 pt-4 border-t border-slate-300 text-[9pt] text-slate-500">
                <p>Report ID: {reportSnapshot.metadata.reportId}</p>
                <p>Generated by ForensicSuite v{reportSnapshot.metadata.appVersion} • {new Date(reportSnapshot.metadata.generatedAt).toLocaleString()}</p>
              </footer>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
