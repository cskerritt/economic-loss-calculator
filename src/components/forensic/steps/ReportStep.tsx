import React from 'react';
import { FileText, FileDown, Download, Loader2 } from 'lucide-react';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection } from '../types';

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
  onPrint: () => void;
  onExportPdf: () => void;
  onExportWord: () => void;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
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
  onPrint,
  onExportPdf,
  onExportWord,
  fmtUSD,
  fmtPct
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '[Date]';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };
  const activeScenario = React.useMemo(
    () => scenarioProjections.find((s) => s.id === selectedScenario),
    [scenarioProjections, selectedScenario]
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Export Buttons */}
      <div className="text-center mb-8 print:hidden">
        <h2 className="text-2xl font-bold text-foreground">Generate Report</h2>
        <p className="text-muted-foreground mt-1">Export your complete economic appraisal report</p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          <button onClick={onPrint} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Print
          </button>
          <button onClick={onExportPdf} disabled={isExportingPdf} className="bg-rose-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50">
            {isExportingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            {isExportingPdf ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={onExportWord} disabled={isExportingWord} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
            {isExportingWord ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExportingWord ? 'Exporting...' : 'Export Word'}
          </button>
        </div>
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

        {/* AEF Table */}
        <section className="mb-8">
          <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 pb-2 mb-4">Adjusted Earnings Factor (AEF) – Algebraic Method</h2>
          <table className="w-full text-sm border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left border border-slate-300">Component</th>
                <th className="p-2 text-right border border-slate-300">Value</th>
                <th className="p-2 text-right border border-slate-300">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-300">Work Life Factor (WLF)</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{algebraic.wlf.toFixed(4)}</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{algebraic.wlf.toFixed(4)}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Net Unemployment Factor</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{algebraic.unempFactor.toFixed(4)}</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.wlf * algebraic.unempFactor).toFixed(4)}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">After-Tax Factor</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{algebraic.afterTaxFactor.toFixed(4)}</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{(algebraic.wlf * algebraic.unempFactor * algebraic.afterTaxFactor).toFixed(4)}</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300">Fringe Benefit Factor</td>
                <td className="p-2 border border-slate-300 text-right font-mono">{algebraic.fringeFactor.toFixed(4)}</td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">{algebraic.fullMultiplier.toFixed(5)}</td>
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
            <p><strong>Unemployment Rate:</strong> {earningsParams.unemploymentRate}%</p>
            <p><strong>UI Replacement Rate:</strong> {earningsParams.uiReplacementRate}%</p>
            <p><strong>Federal Tax Rate:</strong> {earningsParams.fedTaxRate}%</p>
            <p><strong>State Tax Rate:</strong> {earningsParams.stateTaxRate}%</p>
            <p><strong>Combined Tax Rate:</strong> {fmtPct(algebraic.combinedTaxRate)}</p>
            <p><strong>Fringe Rate:</strong> {isUnionMode ? `${((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1)}% (Union)` : `${earningsParams.fringeRate}% (ECEC)`}</p>
          </div>
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
