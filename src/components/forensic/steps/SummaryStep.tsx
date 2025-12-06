import React, { useState } from 'react';
import { Table, Copy, Check, Target, BarChart3, Palette, Settings2 } from 'lucide-react';
import { Card } from '../ui';
import { Projection, HhServices, HhsData, LcpData, Algebraic, ScenarioProjection } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Checkbox } from '../../../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

interface ChartStyle {
  activeColor: string;
  includedColor: string;
  excludedColor: string;
  showLabels: boolean;
  barRadius: number;
}

const CHART_PRESETS: { name: string; style: ChartStyle }[] = [
  { name: 'Default', style: { activeColor: '#3b82f6', includedColor: '#10b981', excludedColor: '#6b7280', showLabels: true, barRadius: 4 } },
  { name: 'Ocean', style: { activeColor: '#0ea5e9', includedColor: '#06b6d4', excludedColor: '#94a3b8', showLabels: true, barRadius: 6 } },
  { name: 'Sunset', style: { activeColor: '#f97316', includedColor: '#eab308', excludedColor: '#a3a3a3', showLabels: true, barRadius: 4 } },
  { name: 'Forest', style: { activeColor: '#22c55e', includedColor: '#84cc16', excludedColor: '#78716c', showLabels: true, barRadius: 8 } },
  { name: 'Royal', style: { activeColor: '#8b5cf6', includedColor: '#a855f7', excludedColor: '#71717a', showLabels: true, barRadius: 2 } },
  { name: 'Monochrome', style: { activeColor: '#18181b', includedColor: '#52525b', excludedColor: '#d4d4d8', showLabels: false, barRadius: 0 } },
];

interface SummaryStepProps {
  projection: Projection;
  hhServices: HhServices;
  hhsData: HhsData;
  lcpData: LcpData;
  algebraic: Algebraic;
  workLifeFactor: number;
  grandTotal: number;
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  onToggleScenarioIncluded: (id: string) => void;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({
  projection,
  hhServices,
  hhsData,
  lcpData,
  algebraic,
  workLifeFactor,
  grandTotal,
  scenarioProjections,
  selectedScenario,
  onToggleScenarioIncluded,
  fmtUSD,
  fmtPct
}) => {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(CHART_PRESETS[0].style);
  const [copySuccess, setCopySuccess] = React.useState('');

  const copyTable = () => {
    const txt = projection.futureSchedule.map(r => `${r.year}\t${r.gross.toFixed(2)}\t${r.netLoss.toFixed(2)}\t${r.pv.toFixed(2)}`).join('\n');
    navigator.clipboard.writeText(`Year\tGross\tNetLoss\tPV\n${txt}`);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Analysis Summary</h2>
        <p className="text-muted-foreground mt-1">Review calculated damages and projection schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AEF Breakdown */}
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4">Adjusted Earnings Factor (AEF)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Work Life Factor</span>
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
              <span className="text-muted-foreground">Work Life Factor</span>
              <span className="font-bold text-primary">{workLifeFactor.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Combined Tax Rate</span>
              <span className="font-bold">{fmtPct(algebraic.combinedTaxRate)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Years to Separation</span>
              <span className="font-bold">{algebraic.yfs.toFixed(2)} yrs</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Future Nominal Total</span>
              <span className="font-bold">{fmtUSD(projection.totalFutureNominal)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Retirement Scenario Comparison */}
      {scenarioProjections.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <div className="bg-muted border-b border-border p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold uppercase text-muted-foreground">Retirement Scenario Comparison</span>
              </div>
              <span className="text-xs text-muted-foreground">Check scenarios to include in report</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-3 text-center font-bold w-12">Include</th>
                    <th className="p-3 text-left font-bold">Scenario</th>
                    <th className="p-3 text-right font-bold">Ret. Age</th>
                    <th className="p-3 text-right font-bold">YFS</th>
                    <th className="p-3 text-right font-bold">WLF</th>
                    <th className="p-3 text-right font-bold">Past Loss</th>
                    <th className="p-3 text-right font-bold">Future (PV)</th>
                    <th className="p-3 text-right font-bold">Earnings Total</th>
                    <th className="p-3 text-right font-bold bg-primary/10">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {scenarioProjections.map(scenario => (
                    <tr 
                      key={scenario.id} 
                      className={scenario.id === selectedScenario ? 'bg-primary/10' : 'hover:bg-muted/50'}
                    >
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
                      <td className="p-3 text-right font-mono">{scenario.retirementAge.toFixed(1)}</td>
                      <td className="p-3 text-right font-mono">{scenario.yfs.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">{scenario.wlfPercent.toFixed(2)}%</td>
                      <td className="p-3 text-right font-mono">{fmtUSD(scenario.totalPastLoss)}</td>
                      <td className="p-3 text-right font-mono">{fmtUSD(scenario.totalFuturePV)}</td>
                      <td className="p-3 text-right font-mono font-bold">{fmtUSD(scenario.totalEarningsLoss)}</td>
                      <td className="p-3 text-right font-mono font-bold text-primary bg-primary/5">{fmtUSD(scenario.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-muted/50 text-xs text-muted-foreground">
              <strong>Note:</strong> Grand Total includes earnings loss, household services (if enabled), and life care plan costs. Only checked scenarios will appear in the exported report.
            </div>
          </Card>

          {/* Bar Chart Visualization */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Grand Total by Retirement Scenario</h3>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Customize</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-bold text-sm">Chart Style</span>
                    </div>
                    
                    {/* Presets */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Presets</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CHART_PRESETS.map(preset => (
                          <button
                            key={preset.name}
                            onClick={() => setChartStyle(preset.style)}
                            className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                              JSON.stringify(chartStyle) === JSON.stringify(preset.style) 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Colors</label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Active Scenario</span>
                          <input
                            type="color"
                            value={chartStyle.activeColor}
                            onChange={(e) => setChartStyle(prev => ({ ...prev, activeColor: e.target.value }))}
                            className="w-8 h-6 rounded cursor-pointer border border-border"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Included</span>
                          <input
                            type="color"
                            value={chartStyle.includedColor}
                            onChange={(e) => setChartStyle(prev => ({ ...prev, includedColor: e.target.value }))}
                            className="w-8 h-6 rounded cursor-pointer border border-border"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Excluded</span>
                          <input
                            type="color"
                            value={chartStyle.excludedColor}
                            onChange={(e) => setChartStyle(prev => ({ ...prev, excludedColor: e.target.value }))}
                            className="w-8 h-6 rounded cursor-pointer border border-border"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">Options</label>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Show Labels</span>
                        <Checkbox
                          checked={chartStyle.showLabels}
                          onCheckedChange={(checked) => setChartStyle(prev => ({ ...prev, showLabels: !!checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Bar Radius</span>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          value={chartStyle.barRadius}
                          onChange={(e) => setChartStyle(prev => ({ ...prev, barRadius: parseInt(e.target.value) }))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                  <Bar dataKey="total" radius={[chartStyle.barRadius, chartStyle.barRadius, 0, 0]}>
                    {scenarioProjections.map((s, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={s.id === selectedScenario ? chartStyle.activeColor : s.included ? chartStyle.includedColor : chartStyle.excludedColor}
                        opacity={s.included ? 1 : 0.4}
                      />
                    ))}
                    {chartStyle.showLabels && (
                      <LabelList 
                        dataKey="total" 
                        position="top" 
                        formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                        style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: chartStyle.activeColor }}></div>
                <span>Active Scenario</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: chartStyle.includedColor }}></div>
                <span>Included in Report</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded opacity-40" style={{ backgroundColor: chartStyle.excludedColor }}></div>
                <span>Not Included</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Damage Schedule Table */}
      <Card className="overflow-hidden">
        <div className="bg-muted border-b border-border p-3 flex justify-between items-center">
          <span className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
            <Table className="w-4 h-4" /> Damage Schedule
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
