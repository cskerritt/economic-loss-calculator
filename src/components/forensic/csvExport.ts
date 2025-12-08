import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CaseInfo, EarningsParams, HhServices, LcpItem, Algebraic, ScenarioProjection } from './types';
import { computeDetailedScenarioSchedule, computeDetailedLcpSchedule, computeDetailedHhsSchedule } from './calculations';

export type CsvExportType = 'earnings' | 'lcp' | 'household' | 'scenario';

export interface CsvExportParams {
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  hhServices: HhServices;
  lcpItems: LcpItem[];
  algebraic: Algebraic;
  scenarioProjections: ScenarioProjection[];
  isUnionMode: boolean;
  baseCalendarYear: number;
  ageAtInjury: number;
}

const escapeCsvField = (value: string | number): string => {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const arrayToCsv = (headers: string[], rows: (string | number)[][]): string => {
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map(row => row.map(escapeCsvField).join(','));
  return [headerLine, ...dataLines].join('\n');
};

const downloadCsv = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Generate earnings CSV content (reusable)
function generateEarningsCsv(params: CsvExportParams, scenarioId?: string): string {
  const { caseInfo, earningsParams, scenarioProjections, isUnionMode, baseCalendarYear, ageAtInjury } = params;
  
  const scenarios = scenarioId 
    ? scenarioProjections.filter(s => s.id === scenarioId)
    : scenarioProjections.filter(s => s.included);

  const headers = ['Scenario', 'Year #', 'Calendar Year', 'Gross Earnings', 'Net Loss', 'Present Value', 'Cumulative PV'];
  const rows: (string | number)[][] = [];

  for (const scenario of scenarios) {
    const schedule = computeDetailedScenarioSchedule(
      caseInfo, earningsParams, scenario.retirementAge, ageAtInjury, isUnionMode, baseCalendarYear
    );
    
    for (const row of schedule) {
      rows.push([
        scenario.label,
        row.yearNum,
        row.calendarYear,
        row.grossEarnings.toFixed(2),
        row.netLoss.toFixed(2),
        row.presentValue.toFixed(2),
        row.cumPV.toFixed(2)
      ]);
    }
  }

  return arrayToCsv(headers, rows);
}

// Generate LCP CSV content (reusable)
function generateLcpCsv(params: CsvExportParams): string {
  const { earningsParams, lcpItems, baseCalendarYear } = params;
  
  const schedule = computeDetailedLcpSchedule(lcpItems, earningsParams.discountRate, baseCalendarYear);
  
  const headers = ['Year #', 'Calendar Year', 'Items', 'Total Inflated Cost', 'Total Present Value', 'Cumulative PV'];
  const rows: (string | number)[][] = schedule.map(row => [
    row.yearNum,
    row.calendarYear,
    row.items.map(i => i.name).join('; '),
    row.totalInflated.toFixed(2),
    row.totalPV.toFixed(2),
    row.cumPV.toFixed(2)
  ]);

  return arrayToCsv(headers, rows);
}

// Generate Household CSV content (reusable)
function generateHouseholdCsv(params: CsvExportParams): string {
  const { hhServices, algebraic, baseCalendarYear } = params;
  
  const schedule = computeDetailedHhsSchedule(hhServices, algebraic.yfs, baseCalendarYear);
  
  const headers = ['Year #', 'Calendar Year', 'Annual Value', 'Present Value', 'Cumulative PV'];
  const rows: (string | number)[][] = schedule.map(row => [
    row.yearNum,
    row.calendarYear,
    row.annualValue.toFixed(2),
    row.presentValue.toFixed(2),
    row.cumPV.toFixed(2)
  ]);

  return arrayToCsv(headers, rows);
}

// Generate Scenario Comparison CSV content (reusable)
function generateScenarioComparisonCsv(params: CsvExportParams): string {
  const { scenarioProjections } = params;
  
  const headers = ['Scenario', 'Retirement Age', 'YFS', 'WLF %', 'Past Loss', 'Future PV', 'Earnings Total', 'Grand Total', 'Included'];
  const rows: (string | number)[][] = scenarioProjections.map(s => [
    s.label,
    s.retirementAge.toFixed(1),
    s.yfs.toFixed(2),
    s.wlfPercent.toFixed(2),
    s.totalPastLoss.toFixed(2),
    s.totalFuturePV.toFixed(2),
    s.totalEarningsLoss.toFixed(2),
    s.grandTotal.toFixed(2),
    s.included ? 'Yes' : 'No'
  ]);

  return arrayToCsv(headers, rows);
}

export function exportEarningsScheduleToCsv(
  params: CsvExportParams,
  scenarioId?: string
): void {
  const csv = generateEarningsCsv(params, scenarioId);
  const filename = `Earnings_YOY_${params.caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportLcpScheduleToCsv(params: CsvExportParams): void {
  const csv = generateLcpCsv(params);
  const filename = `LCP_YOY_${params.caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportHouseholdScheduleToCsv(params: CsvExportParams): void {
  const csv = generateHouseholdCsv(params);
  const filename = `Household_YOY_${params.caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportScenarioComparisonToCsv(params: CsvExportParams): void {
  const csv = generateScenarioComparisonCsv(params);
  const filename = `Scenario_Comparison_${params.caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

// Combined ZIP export with all schedules
export async function exportAllSchedulesToZip(params: CsvExportParams): Promise<void> {
  const zip = new JSZip();
  const dateStr = new Date().toISOString().slice(0, 10);
  const plaintiff = params.caseInfo.plaintiff || 'Report';
  
  // Add scenario comparison
  zip.file(`Scenario_Comparison_${plaintiff}.csv`, generateScenarioComparisonCsv(params));
  
  // Add earnings schedule
  zip.file(`Earnings_YOY_${plaintiff}.csv`, generateEarningsCsv(params));
  
  // Add LCP schedule if there are items
  if (params.lcpItems.length > 0) {
    zip.file(`LCP_YOY_${plaintiff}.csv`, generateLcpCsv(params));
  }
  
  // Add household services schedule if active
  if (params.hhServices.active) {
    zip.file(`Household_YOY_${plaintiff}.csv`, generateHouseholdCsv(params));
  }
  
  // Add a summary info file
  const summaryInfo = [
    `Economic Damages Analysis - ${plaintiff}`,
    `Export Date: ${dateStr}`,
    ``,
    `Case Information:`,
    `  Plaintiff: ${params.caseInfo.plaintiff}`,
    `  Attorney: ${params.caseInfo.attorney}`,
    `  Law Firm: ${params.caseInfo.lawFirm}`,
    `  Date of Injury: ${params.caseInfo.dateOfInjury}`,
    `  Date of Report: ${params.caseInfo.reportDate}`,
    ``,
    `Economic Parameters:`,
    `  Base Earnings: $${params.earningsParams.baseEarnings.toLocaleString()}`,
    `  Residual Earnings: $${params.earningsParams.residualEarnings.toLocaleString()}`,
    `  Wage Growth Rate: ${params.earningsParams.wageGrowth}%`,
    `  Discount Rate: ${params.earningsParams.discountRate}%`,
    `  Work Life Expectancy: ${params.earningsParams.wle} years`,
    ``,
    `Included Scenarios:`,
    ...params.scenarioProjections.filter(s => s.included).map(s => 
      `  ${s.label}: Grand Total = $${s.grandTotal.toLocaleString()}`
    ),
    ``,
    `Files Included:`,
    `  - Scenario_Comparison_${plaintiff}.csv`,
    `  - Earnings_YOY_${plaintiff}.csv`,
    params.lcpItems.length > 0 ? `  - LCP_YOY_${plaintiff}.csv` : null,
    params.hhServices.active ? `  - Household_YOY_${plaintiff}.csv` : null,
  ].filter(Boolean).join('\n');
  
  zip.file(`README_${plaintiff}.txt`, summaryInfo);
  
  // Generate and download zip
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `Economic_Analysis_${plaintiff}_${dateStr}.zip`);
}
