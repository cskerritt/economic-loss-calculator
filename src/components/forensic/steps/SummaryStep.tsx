import React from 'react';
import { Table, Copy, Check } from 'lucide-react';
import { Card } from '../ui';
import { Projection, HhServices, HhsData, LcpData, Algebraic } from '../types';

interface SummaryStepProps {
  projection: Projection;
  hhServices: HhServices;
  hhsData: HhsData;
  lcpData: LcpData;
  algebraic: Algebraic;
  workLifeFactor: number;
  grandTotal: number;
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
  fmtUSD,
  fmtPct
}) => {
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
