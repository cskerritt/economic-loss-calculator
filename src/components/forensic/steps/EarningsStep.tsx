import React from 'react';
import { Briefcase, TrendingUp, HeartPulse, History } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { EarningsParams, DateCalc, Algebraic } from '../types';

interface EarningsStepProps {
  earningsParams: EarningsParams;
  setEarningsParams: React.Dispatch<React.SetStateAction<EarningsParams>>;
  dateCalc: DateCalc;
  algebraic: Algebraic;
  workLifeFactor: number;
  isUnionMode: boolean;
  setIsUnionMode: (v: boolean) => void;
  pastActuals: Record<number, string>;
  setPastActuals: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  dateOfInjury: string;
  fmtUSD: (n: number) => string;
  fmtPct: (n: number) => string;
}

export const EarningsStep: React.FC<EarningsStepProps> = ({
  earningsParams,
  setEarningsParams,
  dateCalc,
  algebraic,
  workLifeFactor,
  isUnionMode,
  setIsUnionMode,
  pastActuals,
  setPastActuals,
  dateOfInjury,
  fmtUSD,
  fmtPct
}) => {
  const startYear = dateOfInjury ? new Date(dateOfInjury).getFullYear() : new Date().getFullYear();
  const fullPast = Math.floor(dateCalc.pastYears);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Earnings & Economic Variables</h2>
        <p className="text-muted-foreground mt-1">Configure earnings capacity, fringe benefits, and economic factors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vocational Statistics */}
        <Card className="p-5 border-l-4 border-l-indigo">
          <SectionHeader icon={Briefcase} title="Vocational Statistics" subtitle="Earnings & Work Life" />
          <div className="space-y-2">
            <InputGroup label="Pre-Injury Earnings Capacity" prefix="$" value={earningsParams.baseEarnings} onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} />
            <InputGroup label="Post-Injury Residual Capacity" prefix="$" value={earningsParams.residualEarnings} onChange={v => setEarningsParams({...earningsParams, residualEarnings: parseFloat(v) || 0})} />
            <InputGroup label="Work Life Expectancy (WLE)" suffix="years" value={earningsParams.wle} onChange={v => setEarningsParams({...earningsParams, wle: parseFloat(v) || 0})} />
            
            <div className="bg-indigo/10 p-3 rounded-lg mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Years to Separation:</span>
                <span className="font-bold">{dateCalc.derivedYFS.toFixed(2)} yrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Work Life Factor:</span>
                <span className="font-bold text-indigo">{workLifeFactor.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Fringe Benefits */}
        <Card className="p-5 border-l-4 border-l-sky">
          <div className="flex justify-between items-center mb-3">
            <SectionHeader icon={HeartPulse} title="Fringe Benefits" subtitle="Employer-paid benefits" />
            <label className="text-[10px] flex items-center gap-1 cursor-pointer bg-muted px-2 py-1 rounded">
              <input type="checkbox" checked={isUnionMode} onChange={e => setIsUnionMode(e.target.checked)} />
              Union Mode
            </label>
          </div>
          
          {isUnionMode ? (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground mb-2">Enter annualized union benefit amounts:</p>
              <div className="grid grid-cols-2 gap-2">
                <InputGroup label="Pension ($/yr)" prefix="$" value={earningsParams.pension} onChange={v => setEarningsParams({...earningsParams, pension: parseFloat(v) || 0})} />
                <InputGroup label="Health & Welfare ($/yr)" prefix="$" value={earningsParams.healthWelfare} onChange={v => setEarningsParams({...earningsParams, healthWelfare: parseFloat(v) || 0})} />
                <InputGroup label="Annuity ($/yr)" prefix="$" value={earningsParams.annuity} onChange={v => setEarningsParams({...earningsParams, annuity: parseFloat(v) || 0})} />
                <InputGroup label="Clothing Allow ($/yr)" prefix="$" value={earningsParams.clothingAllowance} onChange={v => setEarningsParams({...earningsParams, clothingAllowance: parseFloat(v) || 0})} />
              </div>
              <InputGroup label="Other Benefits ($/yr)" prefix="$" value={earningsParams.otherBenefits} onChange={v => setEarningsParams({...earningsParams, otherBenefits: parseFloat(v) || 0})} />
              <div className="bg-sky/10 p-2 rounded text-xs text-center">
                <span className="text-muted-foreground">Total Annual Fringe: </span>
                <strong>{fmtUSD(algebraic.flatFringeAmount)}</strong>
                <span className="text-muted-foreground ml-2">({earningsParams.baseEarnings > 0 ? ((algebraic.flatFringeAmount / earningsParams.baseEarnings) * 100).toFixed(1) : 0}% of base)</span>
              </div>
            </div>
          ) : (
            <InputGroup label="ECEC Loading Rate" suffix="%" value={earningsParams.fringeRate} onChange={v => setEarningsParams({...earningsParams, fringeRate: parseFloat(v) || 0})} />
          )}
        </Card>

        {/* Economic Variables */}
        <Card className="p-5 border-l-4 border-l-emerald">
          <SectionHeader icon={TrendingUp} title="Economic Variables" />
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Growth & Discounting</h4>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Wage Growth Rate" suffix="%" value={earningsParams.wageGrowth} onChange={v => setEarningsParams({...earningsParams, wageGrowth: parseFloat(v) || 0})} />
              <InputGroup label="Discount Rate" suffix="%" value={earningsParams.discountRate} onChange={v => setEarningsParams({...earningsParams, discountRate: parseFloat(v) || 0})} />
            </div>
            
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground pt-2">Unemployment Adjustment</h4>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Unemployment Rate" suffix="%" value={earningsParams.unemploymentRate} onChange={v => setEarningsParams({...earningsParams, unemploymentRate: parseFloat(v) || 0})} />
              <InputGroup label="UI Replacement Rate" suffix="%" value={earningsParams.uiReplacementRate} onChange={v => setEarningsParams({...earningsParams, uiReplacementRate: parseFloat(v) || 0})} />
            </div>

            <h4 className="text-[10px] font-bold uppercase text-muted-foreground pt-2">Tax Rates</h4>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Federal Tax Rate" suffix="%" value={earningsParams.fedTaxRate} onChange={v => setEarningsParams({...earningsParams, fedTaxRate: parseFloat(v) || 0})} />
              <InputGroup label="State Tax Rate" suffix="%" value={earningsParams.stateTaxRate} onChange={v => setEarningsParams({...earningsParams, stateTaxRate: parseFloat(v) || 0})} />
            </div>
            <div className="bg-muted p-2 rounded text-xs text-center">
              <span className="text-muted-foreground">Combined Tax Rate: </span>
              <strong>{fmtPct(algebraic.combinedTaxRate)}</strong>
            </div>
          </div>
        </Card>

        {/* Past Actual Earnings */}
        <Card className="p-5 border-l-4 border-l-amber">
          <SectionHeader icon={History} title="Past Actual Earnings" subtitle="Override residual for specific years" />
          {fullPast > 0 ? (
            <div className="space-y-2">
              {Array.from({ length: fullPast + 1 }, (_, i) => startYear + i).map(year => (
                <InputGroup
                  key={year}
                  label={`${year} Actual Earnings`}
                  prefix="$"
                  value={pastActuals[year] ?? ''}
                  onChange={v => setPastActuals({ ...pastActuals, [year]: v })}
                  placeholder="Leave blank to use residual"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Enter injury and trial dates to calculate past period
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
