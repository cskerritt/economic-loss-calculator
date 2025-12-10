import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { EconomicLossReport, CPI_CATEGORIES } from './types';
import { formatReportFilename } from './reportSnapshot';

/**
 * Export the full report as a multi-sheet Excel workbook
 */
export function exportReportToExcel(report: EconomicLossReport): void {
  const { metadata, assumptions, calculations, results, periods } = report;
  const { caseInfo, earningsParams, hhServices, lcpItems, isUnionMode } = assumptions;
  const { algebraic, dateCalc, hhsData, lcpData, workLifeFactor } = calculations;
  const { scenarioProjections, summaryMetrics } = results;

  const wb = XLSX.utils.book_new();

  // ============= SHEET 1: SUMMARY =============
  const summaryData = [
    ['ECONOMIC LOSS APPRAISAL - SUMMARY'],
    [],
    ['Plaintiff', caseInfo.plaintiff],
    ['Report Date', caseInfo.reportDate],
    ['Report ID', metadata.reportId],
    ['Generated At', metadata.generatedAt],
    [],
    ['DAMAGE TOTALS'],
    ['Category', 'Past Value', 'Future (PV)', 'Total'],
    ['Lost Earning Capacity', summaryMetrics.totalPastLoss, summaryMetrics.totalFuturePV, summaryMetrics.totalEarningsLoss],
    ['Household Services', 0, summaryMetrics.householdServicesPV, summaryMetrics.householdServicesPV],
    ['Life Care Plan', 0, summaryMetrics.lifeCareplanPV, summaryMetrics.lifeCareplanPV],
    ['GRAND TOTAL', summaryMetrics.totalPastLoss, summaryMetrics.totalFuturePV + summaryMetrics.householdServicesPV + summaryMetrics.lifeCareplanPV, summaryMetrics.grandTotal],
    [],
    ['ACTIVE SCENARIO'],
    ['Scenario', scenarioProjections.find(s => s.id === metadata.activeScenario)?.label || 'N/A'],
    ['WLF', `${workLifeFactor.toFixed(2)}%`],
    ['AIF', `${(algebraic.fullMultiplier * 100).toFixed(4)}%`],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // ============= SHEET 2: ASSUMPTIONS =============
  const assumptionsData = [
    ['ECONOMIC ASSUMPTIONS'],
    [],
    ['CASE INFORMATION'],
    ['Field', 'Value'],
    ['Plaintiff', caseInfo.plaintiff],
    ['Date of Birth', caseInfo.dob],
    ['Gender', caseInfo.gender],
    ['Date of Injury', caseInfo.dateOfInjury],
    ['Date of Trial', caseInfo.dateOfTrial],
    ['Retirement Age', caseInfo.retirementAge],
    ['Life Expectancy', caseInfo.lifeExpectancy],
    ['Jurisdiction', caseInfo.jurisdiction],
    ['Case Type', caseInfo.caseType],
    [],
    ['EARNINGS PARAMETERS'],
    ['Field', 'Value'],
    ['Pre-Injury Earnings', earningsParams.baseEarnings],
    ['Post-Injury Residual', earningsParams.residualEarnings],
    ['Work Life Expectancy (WLE)', earningsParams.wle],
    ['Wage Growth Rate', `${earningsParams.wageGrowth}%`],
    ['Discount Rate', `${earningsParams.discountRate}%`],
    ['Fringe Rate', isUnionMode ? `Union Mode (${((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1)}%)` : `${earningsParams.fringeRate}%`],
    ['Unemployment Rate', `${earningsParams.unemploymentRate}%`],
    ['UI Replacement Rate', `${earningsParams.uiReplacementRate}%`],
    ['Federal Tax Rate', `${earningsParams.fedTaxRate}%`],
    ['State Tax Rate', `${earningsParams.stateTaxRate}%`],
    ['Combined Tax Rate', `${(algebraic.combinedTaxRate * 100).toFixed(2)}%`],
    [],
    ['DERIVED VALUES'],
    ['Field', 'Value'],
    ['Age at Injury', dateCalc.ageInjury],
    ['Age at Trial', dateCalc.ageTrial],
    ['Current Age', dateCalc.currentAge],
    ['Past Years', dateCalc.pastYears],
    ['Years to Final Separation (YFS)', dateCalc.derivedYFS.toFixed(2)],
    ['Work Life Factor (WLF)', `${workLifeFactor.toFixed(2)}%`],
    ['Adjusted Income Factor (AIF)', `${(algebraic.fullMultiplier * 100).toFixed(4)}%`],
  ];
  const assumptionsSheet = XLSX.utils.aoa_to_sheet(assumptionsData);
  assumptionsSheet['!cols'] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, assumptionsSheet, 'Assumptions');

  // ============= SHEET 3: PERIODS (Timeline) =============
  const periodsData = [
    ['YEAR-OVER-YEAR TIMELINE'],
    [],
    ['Year #', 'Calendar Year', 'Period Type', 'Gross Income', 'Net Loss', 'Discount Factor', 'Present Value', 'Cumulative PV'],
    ...periods.map(p => [
      p.yearNum,
      p.calendarYear,
      p.periodType,
      p.grossIncome,
      p.netLoss,
      p.discountFactor.toFixed(6),
      p.presentValue,
      p.cumulativePV,
    ]),
  ];
  const periodsSheet = XLSX.utils.aoa_to_sheet(periodsData);
  periodsSheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 16 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, periodsSheet, 'Periods');

  // ============= SHEET 4: SCENARIOS =============
  const scenariosData = [
    ['RETIREMENT SCENARIO COMPARISON'],
    [],
    ['Scenario', 'Retirement Age', 'YFS', 'WLF %', 'Past Loss', 'Future PV', 'Earnings Total', 'Grand Total', 'Included'],
    ...scenarioProjections.map(s => [
      s.label + (s.id === metadata.activeScenario ? ' (ACTIVE)' : ''),
      s.retirementAge.toFixed(1),
      s.yfs.toFixed(2),
      s.wlfPercent.toFixed(2),
      s.totalPastLoss,
      s.totalFuturePV,
      s.totalEarningsLoss,
      s.grandTotal,
      s.included ? 'Yes' : 'No',
    ]),
  ];
  const scenariosSheet = XLSX.utils.aoa_to_sheet(scenariosData);
  scenariosSheet['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, scenariosSheet, 'Scenarios');

  // ============= SHEET 5: LCP ITEMS (if any) =============
  if (lcpItems.length > 0) {
    const getCategoryLabel = (id: string) => CPI_CATEGORIES.find(c => c.id === id)?.label || id;
    const lcpData = [
      ['LIFE CARE PLAN ITEMS'],
      [],
      ['Item Name', 'Category', 'Base Cost', 'Frequency', 'Start Year', 'End Year', 'CPI Rate', 'Nominal Total', 'Present Value'],
      ...lcpItems.map(item => {
        const lcpItem = calculations.lcpData.items.find(i => i.id === item.id);
        return [
          item.name,
          getCategoryLabel(item.categoryId),
          item.baseCost,
          item.freqType,
          item.startYear,
          item.endYear,
          `${item.cpi}%`,
          lcpItem?.totalNom || 0,
          lcpItem?.totalPV || 0,
        ];
      }),
      [],
      ['TOTALS', '', '', '', '', '', '', calculations.lcpData.totalNom, calculations.lcpData.totalPV],
    ];
    const lcpSheet = XLSX.utils.aoa_to_sheet(lcpData);
    lcpSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, lcpSheet, 'LCP Items');
  }

  // ============= SHEET 6: HOUSEHOLD SERVICES (if active) =============
  if (hhServices.active) {
    const hhsSheetData = [
      ['HOUSEHOLD SERVICES VALUATION'],
      [],
      ['Parameter', 'Value'],
      ['Hours per Week', hhServices.hoursPerWeek],
      ['Hourly Rate', `$${hhServices.hourlyRate}`],
      ['Growth Rate', `${hhServices.growthRate}%`],
      ['Discount Rate', `${hhServices.discountRate}%`],
      [],
      ['TOTALS'],
      ['Nominal Total', hhsData.totalNom],
      ['Present Value', hhsData.totalPV],
    ];
    const hhsSheet = XLSX.utils.aoa_to_sheet(hhsSheetData);
    hhsSheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, hhsSheet, 'Household Services');
  }

  // ============= SHEET 7: METADATA =============
  const metadataData = [
    ['REPORT METADATA'],
    [],
    ['Field', 'Value'],
    ['Report ID', metadata.reportId],
    ['Generated At', metadata.generatedAt],
    ['App Version', metadata.appVersion],
    ['Schema Version', metadata.schemaVersion],
    ['Environment', metadata.environment],
    ['Calculation Method', metadata.calculationMethod],
    ['Active Scenario', metadata.activeScenario],
    ['Included Scenarios', metadata.includedScenarios.join(', ')],
    ['User ID', metadata.userId || 'N/A'],
    ['Case ID', metadata.caseId || 'N/A'],
  ];
  const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
  metadataSheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');

  // Generate and save the workbook
  const filename = formatReportFilename(
    'Economic-Analysis',
    caseInfo.plaintiff,
    undefined,
    'xlsx'
  );
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
}
