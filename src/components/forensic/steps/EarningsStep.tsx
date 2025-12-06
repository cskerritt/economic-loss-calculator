import React, { useMemo } from 'react';
import { Briefcase, TrendingUp, HeartPulse, History, Calendar, Target } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { EarningsParams, DateCalc, Algebraic, RETIREMENT_SCENARIOS } from '../types';

interface RetirementScenarioCalc {
  id: string;
  label: string;
  retirementAge: number;
  yfs: number;
  wlf: number;
  enabled: boolean;
}

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
  dob: string;
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
  dob,
  fmtUSD,
  fmtPct
}) => {
  const startYear = dateOfInjury ? new Date(dateOfInjury).getFullYear() : new Date().getFullYear();
  const fullPast = Math.floor(dateCalc.pastYears);

  // Calculate age at injury
  const ageAtInjury = useMemo(() => {
    if (!dob || !dateOfInjury) return 0;
    const dobDate = new Date(dob);
    const injuryDate = new Date(dateOfInjury);
    return (injuryDate.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  }, [dob, dateOfInjury]);

  // Calculate all retirement scenarios
  const scenarios: RetirementScenarioCalc[] = useMemo(() => {
    const results: RetirementScenarioCalc[] = [];
    
    // WLE-based scenario: WLE retirement age is when WLE years have passed from injury
    const wleRetAge = ageAtInjury + earningsParams.wle;
    const wleYFS = earningsParams.useManualYFS ? earningsParams.yfsManual : earningsParams.wle;
    const wleWLF = wleYFS > 0 ? (earningsParams.wle / wleYFS) * 100 : 0;
    
    results.push({
      id: 'wle',
      label: `WLE (Age ${wleRetAge.toFixed(1)})`,
      retirementAge: wleRetAge,
      yfs: wleYFS,
      wlf: wleWLF,
      enabled: true
    });

    // Standard age scenarios
    for (const scenario of RETIREMENT_SCENARIOS.filter(s => s.retirementAge !== null)) {
      const retAge = scenario.retirementAge!;
      const yfs = Math.max(0, retAge - ageAtInjury);
      const wlf = yfs > 0 ? (earningsParams.wle / yfs) * 100 : 0;
      
      results.push({
        id: scenario.id,
        label: scenario.label,
        retirementAge: retAge,
        yfs,
        wlf,
        enabled: true
      });
    }

    // PJI scenario if enabled
    if (earningsParams.enablePJI) {
      const pjiYFS = Math.max(0, earningsParams.pjiAge - ageAtInjury);
      const pjiWLF = pjiYFS > 0 ? (earningsParams.wle / pjiYFS) * 100 : 0;
      
      results.push({
        id: 'pji',
        label: `PJI (Age ${earningsParams.pjiAge})`,
        retirementAge: earningsParams.pjiAge,
        yfs: pjiYFS,
        wlf: pjiWLF,
        enabled: true
      });
    }

    return results;
  }, [ageAtInjury, earningsParams.wle, earningsParams.useManualYFS, earningsParams.yfsManual, earningsParams.enablePJI, earningsParams.pjiAge]);

  const selectedScenarioData = scenarios.find(s => s.id === earningsParams.selectedScenario) || scenarios[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Earnings & Economic Variables</h2>
        <p className="text-muted-foreground mt-1">Configure earnings capacity, work life, and retirement scenarios</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vocational Statistics */}
        <Card className="p-5 border-l-4 border-l-indigo">
          <SectionHeader icon={Briefcase} title="Vocational Statistics" subtitle="Earnings & Work Life" />
          <div className="space-y-3">
            <InputGroup label="Pre-Injury Earnings Capacity" prefix="$" value={earningsParams.baseEarnings} onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} />
            <InputGroup label="Post-Injury Residual Capacity" prefix="$" value={earningsParams.residualEarnings} onChange={v => setEarningsParams({...earningsParams, residualEarnings: parseFloat(v) || 0})} />
            
            <div className="border-t border-border pt-3 mt-3">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Work Life Expectancy</h4>
              <InputGroup 
                label="WLE (from injury date)" 
                suffix="years" 
                value={earningsParams.wle} 
                onChange={v => setEarningsParams({...earningsParams, wle: parseFloat(v) || 0})} 
                step="0.01"
                placeholder="XX.XX"
              />
              
              {ageAtInjury > 0 && (
                <div className="bg-indigo/10 p-3 rounded-lg mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age at Injury:</span>
                    <span className="font-bold">{ageAtInjury.toFixed(2)} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WLE Retirement Age:</span>
                    <span className="font-bold">{(ageAtInjury + earningsParams.wle).toFixed(2)} years</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Years to Final Separation (YFS)</h4>
              <label className="flex items-center gap-2 text-xs mb-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={earningsParams.useManualYFS} 
                  onChange={e => setEarningsParams({...earningsParams, useManualYFS: e.target.checked})} 
                />
                Use Manual YFS Override
              </label>
              {earningsParams.useManualYFS ? (
                <InputGroup 
                  label="Manual YFS" 
                  suffix="years" 
                  value={earningsParams.yfsManual} 
                  onChange={v => setEarningsParams({...earningsParams, yfsManual: parseFloat(v) || 0})} 
                  step="0.01"
                />
              ) : (
                <p className="text-xs text-muted-foreground">YFS calculated automatically from selected scenario</p>
              )}
            </div>
          </div>
        </Card>

        {/* Retirement Scenarios */}
        <Card className="p-5 border-l-4 border-l-amber">
          <SectionHeader icon={Target} title="Retirement Scenarios" subtitle="Compare different retirement ages" />
          
          <div className="space-y-3">
            {/* Scenario Selector */}
            <div className="mb-4">
              <label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Active Scenario for Calculations</label>
              <select 
                value={earningsParams.selectedScenario}
                onChange={e => setEarningsParams({...earningsParams, selectedScenario: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* PJI Toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer bg-muted p-2 rounded-lg">
              <input 
                type="checkbox" 
                checked={earningsParams.enablePJI} 
                onChange={e => setEarningsParams({...earningsParams, enablePJI: e.target.checked})} 
              />
              <span>Enable PJI (Permanent Job Incapacity) Scenario</span>
            </label>
            
            {earningsParams.enablePJI && (
              <InputGroup 
                label="PJI Retirement Age" 
                value={earningsParams.pjiAge} 
                onChange={v => setEarningsParams({...earningsParams, pjiAge: parseInt(v) || 62})} 
                suffix="years"
              />
            )}

            {/* Scenarios Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left font-bold">Scenario</th>
                    <th className="p-2 text-right font-bold">Ret. Age</th>
                    <th className="p-2 text-right font-bold">YFS</th>
                    <th className="p-2 text-right font-bold">WLF</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map(s => (
                    <tr 
                      key={s.id} 
                      className={`border-b border-border ${s.id === earningsParams.selectedScenario ? 'bg-primary/10' : ''}`}
                    >
                      <td className="p-2">
                        <span className={s.id === earningsParams.selectedScenario ? 'font-bold text-primary' : ''}>
                          {s.label}
                        </span>
                        {s.id === earningsParams.selectedScenario && (
                          <span className="ml-1 text-[9px] bg-primary text-primary-foreground px-1 rounded">ACTIVE</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono">{(s.retirementAge ?? 0).toFixed(1)}</td>
                      <td className="p-2 text-right font-mono">{(s.yfs ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right font-mono font-bold text-primary">{(s.wlf ?? 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Scenario Summary */}
            <div className="bg-amber/10 p-3 rounded-lg mt-3">
              <h4 className="text-[10px] font-bold uppercase text-amber-600 mb-2">Selected: {selectedScenarioData?.label ?? 'N/A'}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="block text-[10px] text-muted-foreground">YFS</span>
                  <span className="font-bold text-lg">{(selectedScenarioData?.yfs ?? 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">WLF</span>
                  <span className="font-bold text-lg text-primary">{(selectedScenarioData?.wlf ?? 0).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">Ret Age</span>
                  <span className="font-bold text-lg">{(selectedScenarioData?.retirementAge ?? 0).toFixed(1)}</span>
                </div>
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
        <Card className="p-5 border-l-4 border-l-rose lg:col-span-2">
          <SectionHeader icon={History} title="Past Actual Earnings" subtitle="Override residual for specific years" />
          {fullPast > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: fullPast + 1 }, (_, i) => startYear + i).map(year => (
                <InputGroup
                  key={year}
                  label={`${year}`}
                  prefix="$"
                  value={pastActuals[year] ?? ''}
                  onChange={v => setPastActuals({ ...pastActuals, [year]: v })}
                  placeholder="Residual"
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
