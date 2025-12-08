import React, { useMemo, useState } from 'react';
import { Table, Copy, Check, Target, BarChart3, TrendingUp, ChevronDown, ChevronRight, HeartPulse, Home, Download, FileSpreadsheet } from 'lucide-react';
import { Card } from '../ui';
import { Projection, HhServices, HhsData, LcpData, Algebraic, ScenarioProjection, CaseInfo, EarningsParams, LcpItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScenarioCardView } from '../ScenarioCardView';
import {
  computeDetailedScenarioSchedule,
  computeDetailedLcpSchedule,
  computeDetailedHhsSchedule,
  DetailedScheduleRow,
  DetailedLcpScheduleRow,
  DetailedHhsScheduleRow,
} from '../calculations';
import {
  exportEarningsScheduleToCsv,
  exportLcpScheduleToCsv,
  exportHouseholdScheduleToCsv,
  exportScenarioComparisonToCsv
} from '../csvExport';

interface SummaryStepProps {
  projection: Projection;
  hhServices: HhServices;
  hhsData: HhsData;
  lcpData: LcpData;
  lcpItems: LcpItem[];
  algebraic: Algebraic;
  workLifeFactor: number;
  grandTotal: number;
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  onToggleScenarioIncluded: (id: string) => void;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  isUnionMode: boolean;
  baseCalendarYear: number;
  ageAtInjury: number;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  projection,
  hhServices,
  hhsData,
  lcpData,
  lcpItems,
  algebraic,
  workLifeFactor,
  grandTotal,
  scenarioProjections,
  selectedScenario,
  onToggleScenarioIncluded,
  fmtUSD,
  fmtPct,
  caseInfo,
  earningsParams,
  isUnionMode,
  baseCalendarYear,
  ageAtInjury
}) => {
  const isMobile = useIsMobile();
  const [copySuccess, setCopySuccess] = useState('');
  const [openScenarioSchedules, setOpenScenarioSchedules] = useState<Record<string, boolean>>({});
  const [lcpScheduleOpen, setLcpScheduleOpen] = useState(false);
  const [hhsScheduleOpen, setHhsScheduleOpen] = useState(false);
  const [scenarioTableOpen, setScenarioTableOpen] = useState(true);
  const [damageScheduleOpen, setDamageScheduleOpen] = useState(true);
  const [chartsOpen, setChartsOpen] = useState(true);
  const [showMobileCards, setShowMobileCards] = useState(true);
  const activeScenario = scenarioProjections.find((s) => s.id === selectedScenario);

  // CSV export params object
  const csvExportParams = useMemo(() => ({
    caseInfo,
    earningsParams,
    hhServices,
    lcpItems,
    algebraic,
    scenarioProjections,
    isUnionMode,
    baseCalendarYear,
    ageAtInjury
  }), [caseInfo, earningsParams, hhServices, lcpItems, algebraic, scenarioProjections, isUnionMode, baseCalendarYear, ageAtInjury]);

  // Compute detailed schedules for each scenario
  const scenarioSchedules = useMemo(() => {
    const schedules: Record<string, DetailedScheduleRow[]> = {};
    for (const scenario of scenarioProjections) {
      schedules[scenario.id] = computeDetailedScenarioSchedule(
        caseInfo,
        earningsParams,
        scenario.retirementAge,
        ageAtInjury,
        isUnionMode,
        baseCalendarYear
      );
    }
    return schedules;
  }, [scenarioProjections, caseInfo, earningsParams, ageAtInjury, isUnionMode, baseCalendarYear]);

  // Compute detailed LCP schedule
  const lcpSchedule: DetailedLcpScheduleRow[] = useMemo(() => {
    return computeDetailedLcpSchedule(lcpItems, earningsParams.discountRate, baseCalendarYear);
  }, [lcpItems, earningsParams.discountRate, baseCalendarYear]);

  // Compute detailed household services schedule
  const hhsSchedule: DetailedHhsScheduleRow[] = useMemo(() => {
    return computeDetailedHhsSchedule(hhServices, algebraic.yfs, baseCalendarYear);
  }, [hhServices, algebraic.yfs, baseCalendarYear]);

  // Prepare data for earnings comparison chart
  const earningsChartData = useMemo(() => {
    const maxYears = Math.max(...scenarioProjections.map(s => scenarioSchedules[s.id]?.length || 0));
    const data: { year: number; [key: string]: number }[] = [];
    
    for (let i = 0; i < Math.min(maxYears, 40); i++) {
      const row: { year: number; [key: string]: number } = { year: baseCalendarYear + i };
      for (const scenario of scenarioProjections.filter(s => s.included)) {
        const schedule = scenarioSchedules[scenario.id];
        if (schedule && schedule[i]) {
          row[scenario.id] = schedule[i].presentValue;
        }
      }
      data.push(row);
    }
    return data;
  }, [scenarioProjections, scenarioSchedules, baseCalendarYear]);

  // LCP chart data
  const lcpChartData = useMemo(() => {
    return lcpSchedule.map(row => ({
      year: row.calendarYear,
      cost: row.totalInflated,
      pv: row.totalPV
    }));
  }, [lcpSchedule]);

  // Grand total breakdown chart
  const breakdownData = useMemo(() => {
    const data = [
      { name: 'Past Earnings', value: projection.totalPastLoss, fill: 'hsl(var(--primary))' },
      { name: 'Future Earnings', value: projection.totalFuturePV, fill: 'hsl(142 76% 36%)' },
    ];
    if (hhServices.active && hhsData.totalPV > 0) {
      data.push({ name: 'Household Svc', value: hhsData.totalPV, fill: 'hsl(45 93% 47%)' });
    }
    if (lcpData.totalPV > 0) {
      data.push({ name: 'Life Care Plan', value: lcpData.totalPV, fill: 'hsl(280 65% 60%)' });
    }
    return data;
  }, [projection, hhServices.active, hhsData.totalPV, lcpData.totalPV]);

  const copyTable = () => {
    const txt = projection.futureSchedule.map(r => `${r.year}\t${r.gross.toFixed(2)}\t${r.netLoss.toFixed(2)}\t${r.pv.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`Year\tGross\tNetLoss\tPV\n${txt}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const toggleScenarioSchedule = (id: string) => {
    setOpenScenarioSchedules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const colors = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Analysis Summary</h2>
        <p className="text-muted-foreground mt-1">Review calculated damages and projection schedules</p>
      </div>

      <div className="print:hidden bg-muted border border-border rounded-lg p-4">
        <p className="text-sm font-bold text-foreground">How to read this page</p>
        <p className="text-xs text-muted-foreground mt-1">
          Active scenario: <span className="font-semibold text-foreground">{activeScenario?.label || 'Not set'}</span>. 
          Work Life Participation Factor (WLE/YFS): <span className="font-semibold text-primary">{earningsParams.wle.toFixed(2)} ÷ {algebraic.yfs.toFixed(2)} = {algebraic.wlf.toFixed(4)} ({workLifeFactor.toFixed(2)}%)</span>.
          Use the checkboxes to include/exclude scenarios. Only checked rows flow into the exported report.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AEF Breakdown */}
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Adjusted Earnings Factor (AEF)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Work Life Factor (WLE/YFS)</span>
              <span className="font-mono font-bold">{algebraic.wlf.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Net Unemp Factor</span>
              <span className="font-mono font-bold">{algebraic.unempFactor.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">After-Tax Factor</span>
              <span className="font-mono font-bold">{algebraic.afterTaxFactor.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Fringe Factor</span>
              <span className="font-mono font-bold">{algebraic.fringeFactor.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-3 bg-primary/10 -mx-5 px-5 rounded-b-xl">
              <span className="font-bold text-primary">Full AEF Multiplier</span>
              <span className="font-mono font-bold text-primary">{algebraic.fullMultiplier.toFixed(5)}</span>
            </div>
          </div>
        </Card>

        {/* Damage Summary */}
        <Card className="p-5 bg-navy text-primary-foreground border-none">
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Damage Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Past Lost Earnings:</span>
              <span className="font-bold">{fmtUSD(projection.totalPastLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Future Lost Earnings (PV):</span>
              <span className="font-bold">{fmtUSD(projection.totalFuturePV)}</span>
            </div>
            {hhServices.active && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Household Services (PV):</span>
                <span className="font-bold">{fmtUSD(hhsData.totalPV)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Life Care Plan (PV):</span>
              <span className="font-bold">{fmtUSD(lcpData.totalPV)}</span>
            </div>
            <div className="border-t border-muted-foreground/30 pt-3 mt-3 flex justify-between">
              <span className="text-muted-foreground font-bold">GRAND TOTAL:</span>
              <span className="text-2xl font-bold text-emerald">{fmtUSD(grandTotal)}</span>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Key Metrics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">WLE (Years)</span>
              <span className="font-bold text-primary">{earningsParams.wle.toFixed(2)} yrs</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">YFS (Years to Separation)</span>
              <span className="font-bold">{algebraic.yfs.toFixed(2)} yrs</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Work Life Factor (WLE/YFS)</span>
              <span className="font-bold text-primary">{workLifeFactor.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Combined Tax Rate</span>
              <span className="font-bold">{fmtPct(algebraic.combinedTaxRate)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Future Nominal Total</span>
              <span className="font-bold">{fmtUSD(projection.totalFutureNominal)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grand Total Breakdown Chart */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase text-muted-foreground">Damage Component Breakdown</h3>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdownData} layout="vertical" margin={{ left: 100, right: 30 }}>
              <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(value: number) => [fmtUSD(value), 'Amount']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList dataKey="value" position="right" formatter={(v: number) => fmtUSD(v)} style={{ fontSize: 10 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Retirement Scenario Comparison */}
      {scenarioProjections.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <Collapsible open={scenarioTableOpen} onOpenChange={setScenarioTableOpen}>
              <CollapsibleTrigger className="w-full bg-muted border-b border-border p-3 flex items-center justify-between hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold uppercase text-muted-foreground">Retirement Scenario Comparison</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Check scenarios to include in report</span>
                  {scenarioTableOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* CSV Export & View Toggle Toolbar */}
                <div className="p-3 bg-background border-b border-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportScenarioComparisonToCsv(csvExportParams)}
                      className="h-8 text-xs"
                    >
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportEarningsScheduleToCsv(csvExportParams)}
                      className="h-8 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      YOY CSV
                    </Button>
                  </div>
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMobileCards(!showMobileCards)}
                      className="h-8 text-xs"
                    >
                      {showMobileCards ? 'Table View' : 'Card View'}
                    </Button>
                  )}
                </div>

                {/* Mobile Card View */}
                {isMobile && showMobileCards ? (
                  <div className="p-4">
                    <ScenarioCardView
                      scenarioProjections={scenarioProjections}
                      selectedScenario={selectedScenario}
                      onToggleScenarioIncluded={onToggleScenarioIncluded}
                      onViewSchedule={toggleScenarioSchedule}
                      openSchedules={openScenarioSchedules}
                      fmtUSD={fmtUSD}
                    />
                    {/* Expanded YOY schedules for mobile */}
                    {scenarioProjections.map(scenario => (
                      openScenarioSchedules[scenario.id] && (
                        <div key={`${scenario.id}-schedule`} className="mt-3 bg-muted/50 rounded-lg p-3 border border-border">
                          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">
                            {scenario.label} - Year-Over-Year
                          </h4>
                          <div className="overflow-x-auto max-h-[250px]">
                            <table className="w-full text-[10px] border-collapse">
                              <thead className="bg-background sticky top-0">
                                <tr>
                                  <th className="p-1.5 text-left border border-border">Yr</th>
                                  <th className="p-1.5 text-right border border-border">Gross</th>
                                  <th className="p-1.5 text-right border border-border">Net</th>
                                  <th className="p-1.5 text-right border border-border">PV</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scenarioSchedules[scenario.id]?.map((row) => (
                                  <tr key={row.yearNum}>
                                    <td className="p-1.5 border border-border">{row.calendarYear}</td>
                                    <td className="p-1.5 text-right border border-border font-mono">{fmtUSD(row.grossEarnings)}</td>
                                    <td className="p-1.5 text-right border border-border font-mono text-primary">{fmtUSD(row.netLoss)}</td>
                                    <td className="p-1.5 text-right border border-border font-mono">{fmtUSD(row.presentValue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="p-3 text-center font-bold w-12">Include</th>
                          <th className="p-3 text-left font-bold">Scenario</th>
                          <th className="p-3 text-right font-bold hidden md:table-cell">Ret. Age</th>
                          <th className="p-3 text-right font-bold hidden md:table-cell">YFS</th>
                          <th className="p-3 text-right font-bold hidden lg:table-cell">WLF</th>
                          <th className="p-3 text-right font-bold hidden lg:table-cell">Past Loss</th>
                          <th className="p-3 text-right font-bold hidden md:table-cell">Future (PV)</th>
                          <th className="p-3 text-right font-bold hidden lg:table-cell">Earnings Total</th>
                          <th className="p-3 text-right font-bold bg-primary/10">Grand Total</th>
                          <th className="p-3 text-center font-bold">YOY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {scenarioProjections.map(scenario => (
                          <React.Fragment key={scenario.id}>
                            <tr className={scenario.id === selectedScenario ? 'bg-primary/10' : 'hover:bg-muted/50'}>
                              <td className="p-3 text-center">
                                <Checkbox
                                  checked={scenario.included}
                                  onCheckedChange={() => onToggleScenarioIncluded(scenario.id)}
                                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                />
                              </td>
                              <td className="p-3 text-left">
                                <span className={scenario.id === selectedScenario ? 'font-bold text-primary' : ''}>
                                  {scenario.label}
                                </span>
                                {scenario.id === selectedScenario && (
                                  <span className="ml-2 text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">ACTIVE</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono hidden md:table-cell">{scenario.retirementAge.toFixed(1)}</td>
                              <td className="p-3 text-right font-mono hidden md:table-cell">{scenario.yfs.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono hidden lg:table-cell">{scenario.wlfPercent.toFixed(2)}%</td>
                              <td className="p-3 text-right font-mono hidden lg:table-cell">{fmtUSD(scenario.totalPastLoss)}</td>
                              <td className="p-3 text-right font-mono hidden md:table-cell">{fmtUSD(scenario.totalFuturePV)}</td>
                              <td className="p-3 text-right font-mono font-bold hidden lg:table-cell">{fmtUSD(scenario.totalEarningsLoss)}</td>
                              <td className="p-3 text-right font-mono font-bold text-primary bg-primary/5">{fmtUSD(scenario.grandTotal)}</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => toggleScenarioSchedule(scenario.id)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
                                >
                                  {openScenarioSchedules[scenario.id] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  <span className="hidden sm:inline">View</span>
                                </button>
                              </td>
                            </tr>
                            {openScenarioSchedules[scenario.id] && (
                              <tr>
                                <td colSpan={10} className="p-0">
                                  <div className="bg-muted/50 p-4 border-t border-border">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">
                                      Year-Over-Year Schedule: {scenario.label}
                                    </h4>
                                    <div className="overflow-x-auto max-h-[300px]">
                                      <table className="w-full text-xs border-collapse">
                                        <thead className="bg-background sticky top-0">
                                          <tr>
                                            <th className="p-2 text-left border border-border">Year #</th>
                                            <th className="p-2 text-left border border-border">Calendar Year</th>
                                            <th className="p-2 text-right border border-border">Gross Earnings</th>
                                            <th className="p-2 text-right border border-border">Net Loss</th>
                                            <th className="p-2 text-right border border-border">Present Value</th>
                                            <th className="p-2 text-right border border-border">Cumulative PV</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {scenarioSchedules[scenario.id]?.map((row) => (
                                            <tr key={row.yearNum} className="hover:bg-background/50">
                                              <td className="p-2 border border-border">{row.yearNum}</td>
                                              <td className="p-2 border border-border">{row.calendarYear}</td>
                                              <td className="p-2 text-right border border-border font-mono">{fmtUSD(row.grossEarnings)}</td>
                                              <td className="p-2 text-right border border-border font-mono text-primary">{fmtUSD(row.netLoss)}</td>
                                              <td className="p-2 text-right border border-border font-mono">{fmtUSD(row.presentValue)}</td>
                                              <td className="p-2 text-right border border-border font-mono font-bold">{fmtUSD(row.cumPV)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="p-3 bg-muted/50 text-xs text-muted-foreground">
                  <strong>Note:</strong> Grand Total includes earnings loss, household services (if enabled), and life care plan costs. Only checked scenarios will appear in the exported report.
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Earnings Loss Trend Chart */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Earnings Loss Present Value by Scenario (Year-Over-Year)</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: number) => [fmtUSD(value), 'PV']} />
                  <Legend />
                  {scenarioProjections.filter(s => s.included).map((scenario, idx) => (
                    <Line
                      key={scenario.id}
                      type="monotone"
                      dataKey={scenario.id}
                      name={scenario.label}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={scenario.id === selectedScenario ? 3 : 1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bar Chart Visualization */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Grand Total by Retirement Scenario</h3>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={scenarioProjections.map(s => ({
                    name: s.label,
                    total: s.grandTotal,
                    isActive: s.id === selectedScenario,
                    included: s.included
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [fmtUSD(value), 'Grand Total']}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {scenarioProjections.map((s, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={s.id === selectedScenario ? 'hsl(var(--primary))' : s.included ? '#10b981' : 'hsl(var(--muted-foreground))'}
                        opacity={s.included ? 1 : 0.4}
                      />
                    ))}
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                      style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary"></div>
                <span>Active Scenario</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span>Included in Report</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted-foreground opacity-40"></div>
                <span>Not Included</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Life Care Plan Year-Over-Year Schedule */}
      {lcpItems.length > 0 && lcpSchedule.length > 0 && (
        <Card className="overflow-hidden">
          <Collapsible open={lcpScheduleOpen} onOpenChange={setLcpScheduleOpen}>
            <CollapsibleTrigger className="w-full bg-muted border-b border-border p-3 flex items-center justify-between hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold uppercase text-muted-foreground">Life Care Plan Year-Over-Year Schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Total PV: {fmtUSD(lcpData.totalPV)}</span>
                {lcpScheduleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4">
                {/* CSV Export Button */}
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportLcpScheduleToCsv(csvExportParams)}
                    className="h-8 text-xs"
                  >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Export LCP CSV
                  </Button>
                </div>
                {/* LCP Chart */}
                <div className="h-[200px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lcpChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => [fmtUSD(value), '']} />
                      <Area type="monotone" dataKey="cost" name="Inflated Cost" stroke="hsl(280 65% 60%)" fill="hsl(280 65% 60% / 0.3)" />
                      <Area type="monotone" dataKey="pv" name="Present Value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* LCP Table */}
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left border border-border">Year #</th>
                        <th className="p-2 text-left border border-border">Calendar</th>
                        <th className="p-2 text-left border border-border">Items</th>
                        <th className="p-2 text-right border border-border">Total Inflated</th>
                        <th className="p-2 text-right border border-border">Total PV</th>
                        <th className="p-2 text-right border border-border">Cumulative PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lcpSchedule.map((row) => (
                        <tr key={row.yearNum} className="hover:bg-muted/50">
                          <td className="p-2 border border-border">{row.yearNum}</td>
                          <td className="p-2 border border-border">{row.calendarYear}</td>
                          <td className="p-2 border border-border">
                            <div className="flex flex-wrap gap-1">
                              {row.items.map((item, idx) => (
                                <span key={idx} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.name}: {fmtUSD(item.inflatedCost)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-right border border-border font-mono">{fmtUSD(row.totalInflated)}</td>
                          <td className="p-2 text-right border border-border font-mono text-primary">{fmtUSD(row.totalPV)}</td>
                          <td className="p-2 text-right border border-border font-mono font-bold">{fmtUSD(row.cumPV)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Household Services Year-Over-Year Schedule */}
      {hhServices.active && hhsSchedule.length > 0 && (
        <Card className="overflow-hidden">
          <Collapsible open={hhsScheduleOpen} onOpenChange={setHhsScheduleOpen}>
            <CollapsibleTrigger className="w-full bg-muted border-b border-border p-3 flex items-center justify-between hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold uppercase text-muted-foreground">Household Services Year-Over-Year Schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Total PV: {fmtUSD(hhsData.totalPV)}</span>
                {hhsScheduleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4">
                {/* CSV Export Button */}
                <div className="flex justify-end mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportHouseholdScheduleToCsv(csvExportParams)}
                    className="h-8 text-xs"
                  >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Export Household CSV
                  </Button>
                </div>
              </div>
              <div className="px-4 pb-4 overflow-x-auto max-h-[400px]">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left border border-border">Year #</th>
                      <th className="p-2 text-left border border-border">Calendar Year</th>
                      <th className="p-2 text-right border border-border">Annual Value</th>
                      <th className="p-2 text-right border border-border">Present Value</th>
                      <th className="p-2 text-right border border-border">Cumulative PV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hhsSchedule.map((row) => (
                      <tr key={row.yearNum} className="hover:bg-muted/50">
                        <td className="p-2 border border-border">{row.yearNum}</td>
                        <td className="p-2 border border-border">{row.calendarYear}</td>
                        <td className="p-2 text-right border border-border font-mono">{fmtUSD(row.annualValue)}</td>
                        <td className="p-2 text-right border border-border font-mono text-primary">{fmtUSD(row.presentValue)}</td>
                        <td className="p-2 text-right border border-border font-mono font-bold">{fmtUSD(row.cumPV)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Damage Schedule Table */}
      <Card className="overflow-hidden">
        <div className="bg-muted border-b border-border p-3 flex justify-between items-center">
          <span className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Table className="w-4 h-4" /> Primary Damage Schedule (Active Scenario)
          </span>
          <button 
            onClick={copyTable} 
            className="text-xs bg-background border border-border px-3 py-1.5 rounded-lg shadow-sm hover:bg-muted flex items-center gap-1 text-muted-foreground"
          >
            {copySuccess ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} 
            {copySuccess || 'Copy'}
          </button>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-muted text-muted-foreground font-bold sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left">Year</th>
                <th className="p-3">Gross</th>
                <th className="p-3 bg-primary/10 text-primary">Net Loss</th>
                <th className="p-3">Present Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {projection.pastSchedule.map((row) => (
                <tr key={`past-${row.year}`} className="bg-muted/30">
                  <td className="p-3 text-left text-muted-foreground">
                    {row.year} <span className="opacity-75 text-[9px]">PAST</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{fmtUSD(row.grossBase)}</td>
                  <td className="p-3 bg-primary/5 text-primary font-medium">{fmtUSD(row.netLoss)}</td>
                  <td className="p-3 text-muted-foreground">—</td>
                </tr>
              ))}
              {projection.futureSchedule.map((row) => (
                <tr key={`future-${row.year}`} className="hover:bg-muted/50">
                  <td className="p-3 text-left text-muted-foreground">{row.year}</td>
                  <td className="p-3 text-foreground">{fmtUSD(row.gross)}</td>
                  <td className="p-3 bg-primary/5 text-primary font-bold">{fmtUSD(row.netLoss)}</td>
                  <td className="p-3 text-foreground font-bold">{fmtUSD(row.pv)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted font-bold sticky bottom-0">
              <tr>
                <td className="p-3 text-left">TOTALS</td>
                <td className="p-3">—</td>
                <td className="p-3 bg-primary/10 text-primary">{fmtUSD(projection.totalPastLoss + projection.totalFutureNominal)}</td>
                <td className="p-3">{fmtUSD(projection.totalPastLoss + projection.totalFuturePV)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};