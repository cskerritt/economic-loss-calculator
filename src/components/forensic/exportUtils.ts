import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DateCalc, Algebraic, Projection, HhsData, LcpData, ScenarioProjection } from './types';
import { computeDetailedScenarioSchedule, computeDetailedLcpSchedule, computeDetailedHhsSchedule } from './calculations';

export type ExportSection = 'earnings' | 'lcp' | 'scenarios' | 'household';

const createBorderedCell = (text: string, options: { bold?: boolean; alignment?: typeof AlignmentType[keyof typeof AlignmentType] } = {}) => {
  return new TableCell({
    children: [new Paragraph({ 
      children: [new TextRun({ text, bold: options.bold, size: 20 })],
      alignment: options.alignment || AlignmentType.LEFT
    })],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
    }
  });
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '[Date]';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

interface ExportParams {
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  projection: Projection;
  hhServices: HhServices;
  hhsData: HhsData;
  lcpItems: LcpItem[];
  lcpData: LcpData;
  algebraic: Algebraic;
  dateCalc: DateCalc;
  scenarioProjections: ScenarioProjection[];
  isUnionMode: boolean;
  baseCalendarYear: number;
  ageAtInjury: number;
  fmtUSD: (n: number) => string;
}

export async function exportSectionToWord(
  section: ExportSection,
  params: ExportParams
): Promise<void> {
  const { caseInfo, earningsParams, projection, hhServices, hhsData, lcpItems, lcpData, algebraic, dateCalc, scenarioProjections, isUnionMode, baseCalendarYear, ageAtInjury, fmtUSD } = params;

  let docChildren: (Paragraph | Table)[] = [];
  let filename = '';

  // Common header
  const headerParagraphs = [
    new Paragraph({ 
      children: [new TextRun({ text: `ECONOMIC APPRAISAL - ${section.toUpperCase()} SECTION`, bold: true, size: 32 })], 
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({ 
      children: [new TextRun({ text: `Plaintiff: ${caseInfo.plaintiff || '[Plaintiff]'}`, size: 22 })], 
      alignment: AlignmentType.CENTER
    }),
    new Paragraph({ 
      children: [new TextRun({ text: `Report Date: ${formatDate(caseInfo.reportDate)}`, size: 22 })], 
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
  ];

  switch (section) {
    case 'earnings': {
      filename = `Earnings_Schedule_${caseInfo.plaintiff || 'Report'}.docx`;
      
      // Earnings Schedule Table
      const earningsScheduleRows = [
        new TableRow({
          children: [
            createBorderedCell('Year', { bold: true }),
            createBorderedCell('Type', { bold: true }),
            createBorderedCell('Gross Earnings', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Net Loss', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Present Value', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      // Add past schedule
      for (const row of projection.pastSchedule) {
        earningsScheduleRows.push(new TableRow({
          children: [
            createBorderedCell(String(row.year)),
            createBorderedCell('Past'),
            createBorderedCell(fmtUSD(row.grossBase), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.netLoss), { alignment: AlignmentType.RIGHT }),
            createBorderedCell('—', { alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      // Add future schedule
      for (const row of projection.futureSchedule) {
        earningsScheduleRows.push(new TableRow({
          children: [
            createBorderedCell(`Year ${row.year}`),
            createBorderedCell('Future'),
            createBorderedCell(fmtUSD(row.gross), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.netLoss), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.pv), { alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      // Add totals row
      earningsScheduleRows.push(new TableRow({
        children: [
          createBorderedCell('TOTALS', { bold: true }),
          createBorderedCell(''),
          createBorderedCell('—', { alignment: AlignmentType.RIGHT }),
          createBorderedCell(fmtUSD(projection.totalPastLoss + projection.totalFutureNominal), { bold: true, alignment: AlignmentType.RIGHT }),
          createBorderedCell(fmtUSD(projection.totalPastLoss + projection.totalFuturePV), { bold: true, alignment: AlignmentType.RIGHT }),
        ]
      }));

      // Tinari AEF Methodology Table
      const aefRows = [
        new TableRow({
          children: [
            createBorderedCell('Step', { bold: true }),
            createBorderedCell('Component', { bold: true }),
            createBorderedCell('Factor', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Cumulative', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
        new TableRow({
          children: [
            createBorderedCell('1'),
            createBorderedCell('Gross Earnings Base'),
            createBorderedCell('100.00%', { alignment: AlignmentType.RIGHT }),
            createBorderedCell('100.00%', { alignment: AlignmentType.RIGHT }),
          ]
        }),
        new TableRow({
          children: [
            createBorderedCell('2'),
            createBorderedCell('× Work Life Factor (WLF)'),
            createBorderedCell(`${(algebraic.wlf * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.worklifeAdjustedBase * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
          ]
        }),
        new TableRow({
          children: [
            createBorderedCell('3'),
            createBorderedCell('× (1 - Unemployment Factor)'),
            createBorderedCell(`${(algebraic.unempFactor * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.unemploymentAdjustedBase * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
          ]
        }),
        new TableRow({
          children: [
            createBorderedCell('4'),
            createBorderedCell('× (1 + Fringe Benefits)'),
            createBorderedCell(`${(algebraic.fringeFactor * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.grossCompensationWithFringes * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
          ]
        }),
        new TableRow({
          children: [
            createBorderedCell('5'),
            createBorderedCell('− Tax on Base Earnings'),
            createBorderedCell(`-${(algebraic.taxOnBaseEarnings * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.afterTaxCompensation * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      // Add personal consumption rows for wrongful death
      if (earningsParams.isWrongfulDeath) {
        aefRows.push(new TableRow({
          children: [
            createBorderedCell('6a'),
            createBorderedCell('× (1 - Personal Consumption) Era 1'),
            createBorderedCell(`${(algebraic.era1PersonalConsumptionFactor * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.era1AIF * 100).toFixed(2)}%`, { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
        aefRows.push(new TableRow({
          children: [
            createBorderedCell('6b'),
            createBorderedCell('× (1 - Personal Consumption) Era 2'),
            createBorderedCell(`${(algebraic.era2PersonalConsumptionFactor * 100).toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${(algebraic.era2AIF * 100).toFixed(2)}%`, { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      aefRows.push(new TableRow({
        children: [
          createBorderedCell(''),
          createBorderedCell('ADJUSTED INCOME FACTOR (AIF)', { bold: true }),
          createBorderedCell('', { alignment: AlignmentType.RIGHT }),
          createBorderedCell(`${(algebraic.fullMultiplier * 100).toFixed(4)}%`, { bold: true, alignment: AlignmentType.RIGHT }),
        ]
      }));

      // Build wage growth description
      const wageGrowthDesc = earningsParams.useEraSplit 
        ? `Era 1: ${earningsParams.era1WageGrowth}% | Era 2: ${earningsParams.era2WageGrowth}%`
        : `${earningsParams.wageGrowth}%`;

      docChildren = [
        ...headerParagraphs,
        new Paragraph({ text: 'TINARI ALGEBRAIC METHOD - AEF CALCULATION', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Case Type: ${earningsParams.isWrongfulDeath ? 'Wrongful Death' : 'Personal Injury'}`,
            size: 20, bold: true
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Formula: AIF = {[(GE × WLF) × (1-UF)) × (1+FB)] − [(GE × WLF) × (1-UF)] × TL} × (1-PC)`,
            size: 18, italics: true
          })],
          spacing: { after: 200 }
        }),
        new Table({ rows: aefRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: 'Note: Taxes applied only to base earnings (not fringes) per Tinari method.',
            size: 18, italics: true
          })],
          spacing: { before: 100, after: 300 }
        }),
        new Paragraph({ text: 'EARNINGS DAMAGE SCHEDULE', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Pre-Injury Earnings: ${fmtUSD(earningsParams.baseEarnings)}/year | Post-Injury Residual: ${fmtUSD(earningsParams.residualEarnings)}/year`,
            size: 20
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Wage Growth: ${wageGrowthDesc} | Discount Rate: ${earningsParams.discountRate}% | WLF: ${(algebraic.wlf * 100).toFixed(2)}%`,
            size: 20
          })],
          spacing: { after: 200 }
        }),
        new Table({ rows: earningsScheduleRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ];
      break;
    }

    case 'lcp': {
      filename = `Life_Care_Plan_${caseInfo.plaintiff || 'Report'}.docx`;
      
      // LCP Summary Table
      const lcpSummaryRows = [
        new TableRow({
          children: [
            createBorderedCell('Item', { bold: true }),
            createBorderedCell('Category', { bold: true }),
            createBorderedCell('Base Cost', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Frequency', { bold: true }),
            createBorderedCell('Duration', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Nominal Total', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Present Value', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      for (const item of lcpData.items) {
        const endYear = item.endYear ?? item.startYear + item.duration - 1;
        const duration = Math.max(1, endYear - item.startYear + 1);
        const durationLabel = item.useCustomYears ? `${item.customYears.length} selected` : `${duration} yrs`;
        
        lcpSummaryRows.push(new TableRow({
          children: [
            createBorderedCell(item.name),
            createBorderedCell(item.categoryId),
            createBorderedCell(fmtUSD(item.baseCost), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(item.freqType),
            createBorderedCell(durationLabel, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(item.totalNom), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(item.totalPV), { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      lcpSummaryRows.push(new TableRow({
        children: [
          createBorderedCell('TOTAL', { bold: true }),
          createBorderedCell(''),
          createBorderedCell(''),
          createBorderedCell(''),
          createBorderedCell(''),
          createBorderedCell(fmtUSD(lcpData.totalNom), { bold: true, alignment: AlignmentType.RIGHT }),
          createBorderedCell(fmtUSD(lcpData.totalPV), { bold: true, alignment: AlignmentType.RIGHT }),
        ]
      }));

      // Year-over-year LCP schedule
      const lcpSchedule = computeDetailedLcpSchedule(lcpItems, earningsParams.discountRate, baseCalendarYear);
      const lcpYoyRows = [
        new TableRow({
          children: [
            createBorderedCell('Year', { bold: true }),
            createBorderedCell('Calendar', { bold: true }),
            createBorderedCell('Items', { bold: true }),
            createBorderedCell('Inflated Cost', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Present Value', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Cumulative PV', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      for (const row of lcpSchedule) {
        lcpYoyRows.push(new TableRow({
          children: [
            createBorderedCell(String(row.yearNum)),
            createBorderedCell(String(row.calendarYear)),
            createBorderedCell(row.items.map(i => i.name).join(', ')),
            createBorderedCell(fmtUSD(row.totalInflated), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.totalPV), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.cumPV), { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      docChildren = [
        ...headerParagraphs,
        new Paragraph({ text: 'LIFE CARE PLAN SUMMARY', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Life Expectancy: ${caseInfo.lifeExpectancy} years | Discount Rate: ${earningsParams.discountRate}%`,
            size: 20
          })],
          spacing: { after: 200 }
        }),
        new Table({ rows: lcpSummaryRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        new Paragraph({ text: 'YEAR-OVER-YEAR SCHEDULE', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
        new Table({ rows: lcpYoyRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ];
      break;
    }

    case 'scenarios': {
      filename = `Scenario_Comparison_${caseInfo.plaintiff || 'Report'}.docx`;
      
      // Scenario comparison table
      const scenarioRows = [
        new TableRow({
          children: [
            createBorderedCell('Scenario', { bold: true }),
            createBorderedCell('Ret. Age', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('YFS', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('WLF', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Past Loss', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Future PV', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Grand Total', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      for (const scenario of scenarioProjections.filter(s => s.included)) {
        scenarioRows.push(new TableRow({
          children: [
            createBorderedCell(scenario.label + (scenario.id === earningsParams.selectedScenario ? ' (ACTIVE)' : '')),
            createBorderedCell(scenario.retirementAge.toFixed(1), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(scenario.yfs.toFixed(2), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(`${scenario.wlfPercent.toFixed(2)}%`, { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(scenario.totalPastLoss), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(scenario.totalFuturePV), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(scenario.grandTotal), { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      // Add YOY schedules for each scenario
      const scenarioYoyTables: (Paragraph | Table)[] = [];
      for (const scenario of scenarioProjections.filter(s => s.included)) {
        const schedule = computeDetailedScenarioSchedule(
          caseInfo, earningsParams, scenario.retirementAge, ageAtInjury, isUnionMode, baseCalendarYear
        );
        
        const yoyRows = [
          new TableRow({
            children: [
              createBorderedCell('Year', { bold: true }),
              createBorderedCell('Calendar', { bold: true }),
              createBorderedCell('Gross Earnings', { bold: true, alignment: AlignmentType.RIGHT }),
              createBorderedCell('Net Loss', { bold: true, alignment: AlignmentType.RIGHT }),
              createBorderedCell('Present Value', { bold: true, alignment: AlignmentType.RIGHT }),
              createBorderedCell('Cumulative PV', { bold: true, alignment: AlignmentType.RIGHT }),
            ]
          }),
        ];

        for (const row of schedule) {
          yoyRows.push(new TableRow({
            children: [
              createBorderedCell(String(row.yearNum)),
              createBorderedCell(String(row.calendarYear)),
              createBorderedCell(fmtUSD(row.grossEarnings), { alignment: AlignmentType.RIGHT }),
              createBorderedCell(fmtUSD(row.netLoss), { alignment: AlignmentType.RIGHT }),
              createBorderedCell(fmtUSD(row.presentValue), { alignment: AlignmentType.RIGHT }),
              createBorderedCell(fmtUSD(row.cumPV), { bold: true, alignment: AlignmentType.RIGHT }),
            ]
          }));
        }

        scenarioYoyTables.push(
          new Paragraph({ 
            children: [new TextRun({ text: `${scenario.label} - Year-Over-Year Schedule`, bold: true, size: 24 })],
            spacing: { before: 400, after: 200 }
          }),
          new Table({ rows: yoyRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        );
      }

      // Methodology description
      const methodologyDesc = earningsParams.isWrongfulDeath 
        ? `Wrongful Death case with ${earningsParams.era1PersonalConsumption}%/${earningsParams.era2PersonalConsumption}% personal consumption (Era 1/Era 2)`
        : 'Personal Injury case (no personal consumption deduction)';

      const eraDesc = earningsParams.useEraSplit
        ? `Era-Based: ${earningsParams.era1WageGrowth}% (past) / ${earningsParams.era2WageGrowth}% (future) wage growth`
        : `Uniform ${earningsParams.wageGrowth}% wage growth`;

      docChildren = [
        ...headerParagraphs,
        new Paragraph({ text: 'RETIREMENT SCENARIO COMPARISON', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Methodology: Tinari Algebraic Method`,
            size: 20, bold: true
          })],
          spacing: { after: 50 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: methodologyDesc,
            size: 18
          })],
          spacing: { after: 50 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: eraDesc,
            size: 18
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Age at Injury: ${ageAtInjury.toFixed(1)} | WLE: ${earningsParams.wle} years | AIF: ${(algebraic.fullMultiplier * 100).toFixed(2)}%`,
            size: 20
          })],
          spacing: { after: 200 }
        }),
        new Table({ rows: scenarioRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
        ...scenarioYoyTables,
      ];
      break;
    }

    case 'household': {
      filename = `Household_Services_${caseInfo.plaintiff || 'Report'}.docx`;
      
      const hhsSchedule = computeDetailedHhsSchedule(hhServices, dateCalc.derivedYFS, baseCalendarYear);
      
      const hhsRows = [
        new TableRow({
          children: [
            createBorderedCell('Year', { bold: true }),
            createBorderedCell('Calendar', { bold: true }),
            createBorderedCell('Annual Value', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Present Value', { bold: true, alignment: AlignmentType.RIGHT }),
            createBorderedCell('Cumulative PV', { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }),
      ];

      for (const row of hhsSchedule) {
        hhsRows.push(new TableRow({
          children: [
            createBorderedCell(String(row.yearNum)),
            createBorderedCell(String(row.calendarYear)),
            createBorderedCell(fmtUSD(row.annualValue), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.presentValue), { alignment: AlignmentType.RIGHT }),
            createBorderedCell(fmtUSD(row.cumPV), { bold: true, alignment: AlignmentType.RIGHT }),
          ]
        }));
      }

      docChildren = [
        ...headerParagraphs,
        new Paragraph({ text: 'HOUSEHOLD SERVICES VALUATION', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Hours per Week: ${hhServices.hoursPerWeek} | Hourly Rate: $${hhServices.hourlyRate}`,
            size: 20
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Growth Rate: ${hhServices.growthRate}% | Discount Rate: ${hhServices.discountRate}%`,
            size: 20
          })],
          spacing: { after: 100 }
        }),
        new Paragraph({ 
          children: [new TextRun({ 
            text: `Nominal Total: ${fmtUSD(hhsData.totalNom)} | Present Value: ${fmtUSD(hhsData.totalPV)}`,
            size: 20, bold: true
          })],
          spacing: { after: 200 }
        }),
        new Paragraph({ text: 'YEAR-OVER-YEAR SCHEDULE', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),
        new Table({ rows: hhsRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ];
      break;
    }
  }

  const doc = new Document({
    sections: [{ children: docChildren }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}