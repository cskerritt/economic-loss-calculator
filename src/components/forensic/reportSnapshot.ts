import { v4 as uuidv4 } from 'uuid';
import {
  CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic,
  Projection, HhsData, LcpData, ScenarioProjection,
  ReportMetadata, PeriodRow, SummaryMetrics, EconomicLossReport
} from './types';

const APP_VERSION = '1.0.0';
const SCHEMA_VERSION = 'v10';

interface GenerateReportSnapshotParams {
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  hhServices: HhServices;
  lcpItems: LcpItem[];
  isUnionMode: boolean;
  dateCalc: DateCalc;
  algebraic: Algebraic;
  projection: Projection;
  hhsData: HhsData;
  lcpData: LcpData;
  workLifeFactor: number;
  grandTotal: number;
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  baseCalendarYear: number;
  userId?: string;
  caseId?: string;
}

/**
 * Compute unified period rows from past and future schedules
 */
export function computePeriodRows(
  projection: Projection,
  baseCalendarYear: number,
  discountRate: number
): PeriodRow[] {
  const rows: PeriodRow[] = [];
  let cumulativePV = 0;
  
  // Past periods (already at nominal = PV since past)
  for (const row of projection.pastSchedule) {
    cumulativePV += row.netLoss;
    rows.push({
      yearNum: row.year,
      calendarYear: baseCalendarYear - (projection.pastSchedule.length - row.year),
      periodType: 'past',
      grossIncome: row.grossBase,
      netLoss: row.netLoss,
      discountFactor: 1.0, // Past losses not discounted
      presentValue: row.netLoss,
      cumulativePV,
    });
  }
  
  // Future periods
  for (const row of projection.futureSchedule) {
    const discountFactor = Math.pow(1 + discountRate / 100, -row.year);
    cumulativePV += row.pv;
    rows.push({
      yearNum: row.year,
      calendarYear: baseCalendarYear + row.year,
      periodType: 'future',
      grossIncome: row.gross,
      netLoss: row.netLoss,
      discountFactor,
      presentValue: row.pv,
      cumulativePV,
    });
  }
  
  return rows;
}

/**
 * Compute summary metrics for quick reference
 */
export function computeSummaryMetrics(
  projection: Projection,
  hhServices: HhServices,
  hhsData: HhsData,
  lcpData: LcpData,
  grandTotal: number
): SummaryMetrics {
  return {
    totalPastLoss: projection.totalPastLoss,
    totalFuturePV: projection.totalFuturePV,
    totalEarningsLoss: projection.totalPastLoss + projection.totalFuturePV,
    householdServicesPV: hhServices.active ? hhsData.totalPV : 0,
    lifeCareplanPV: lcpData.totalPV,
    grandTotal,
  };
}

/**
 * Generate a complete report snapshot for exports
 */
export function generateReportSnapshot(params: GenerateReportSnapshotParams): EconomicLossReport {
  const {
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
  } = params;

  const metadata: ReportMetadata = {
    reportId: uuidv4(),
    generatedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    environment: import.meta.env.MODE === 'production' ? 'production' : 'development',
    userId,
    caseId,
    calculationMethod: 'tinari-algebraic',
    activeScenario: selectedScenario,
    includedScenarios: scenarioProjections.filter(s => s.included).map(s => s.id),
  };

  const periods = computePeriodRows(projection, baseCalendarYear, earningsParams.discountRate);
  const summaryMetrics = computeSummaryMetrics(projection, hhServices, hhsData, lcpData, grandTotal);

  return {
    metadata,
    assumptions: {
      caseInfo,
      earningsParams,
      hhServices,
      lcpItems,
      isUnionMode,
    },
    calculations: {
      dateCalc,
      algebraic,
      projection,
      hhsData,
      lcpData,
      workLifeFactor,
    },
    results: {
      scenarioProjections,
      grandTotal,
      summaryMetrics,
    },
    periods,
  };
}

/**
 * Format a report filename with consistent naming
 */
export function formatReportFilename(
  reportType: string,
  plaintiffName: string,
  scenario?: string,
  extension: string = ''
): string {
  const safeName = (plaintiffName || 'Report').replace(/[^a-zA-Z0-9]/g, '-');
  const dateStr = new Date().toISOString().slice(0, 10);
  const scenarioPart = scenario ? `_${scenario.replace(/\s+/g, '')}` : '';
  const ext = extension ? `.${extension}` : '';
  return `${reportType}_${safeName}_${dateStr}${scenarioPart}${ext}`;
}
