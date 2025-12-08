import { CaseInfo, EarningsParams, HhServices, LcpItem, Algebraic, ScenarioProjection } from './types';
import { computeDetailedScenarioSchedule, computeDetailedLcpSchedule, computeDetailedHhsSchedule, DetailedScheduleRow, DetailedLcpScheduleRow, DetailedHhsScheduleRow } from './calculations';

export type CsvExportType = 'earnings' | 'lcp' | 'household' | 'scenario';

interface CsvExportParams {
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

export function exportEarningsScheduleToCsv(
  params: CsvExportParams,
  scenarioId?: string
): void {
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

  const csv = arrayToCsv(headers, rows);
  const filename = `Earnings_YOY_${caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportLcpScheduleToCsv(params: CsvExportParams): void {
  const { caseInfo, earningsParams, lcpItems, baseCalendarYear } = params;
  
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

  const csv = arrayToCsv(headers, rows);
  const filename = `LCP_YOY_${caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportHouseholdScheduleToCsv(params: CsvExportParams): void {
  const { caseInfo, hhServices, algebraic, baseCalendarYear } = params;
  
  const schedule = computeDetailedHhsSchedule(hhServices, algebraic.yfs, baseCalendarYear);
  
  const headers = ['Year #', 'Calendar Year', 'Annual Value', 'Present Value', 'Cumulative PV'];
  const rows: (string | number)[][] = schedule.map(row => [
    row.yearNum,
    row.calendarYear,
    row.annualValue.toFixed(2),
    row.presentValue.toFixed(2),
    row.cumPV.toFixed(2)
  ]);

  const csv = arrayToCsv(headers, rows);
  const filename = `Household_YOY_${caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}

export function exportScenarioComparisonToCsv(params: CsvExportParams): void {
  const { caseInfo, scenarioProjections } = params;
  
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

  const csv = arrayToCsv(headers, rows);
  const filename = `Scenario_Comparison_${caseInfo.plaintiff || 'Report'}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(csv, filename);
}
