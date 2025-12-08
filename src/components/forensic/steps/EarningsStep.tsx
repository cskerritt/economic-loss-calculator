import React, { useMemo, useState, useCallback } from 'react';
import { Briefcase, TrendingUp, HeartPulse, History, Calendar, Target, AlertCircle } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { EarningsParams, DateCalc, Algebraic, RETIREMENT_SCENARIOS } from '../types';
import { parseDate } from '../calculations';

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

interface ValidationErrors {
  baseEarnings?: string;
  wle?: string;
  wageGrowth?: string;
  discountRate?: string;
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (earningsParams.baseEarnings <= 0) {
      errors.baseEarnings = 'Pre-injury earnings must be greater than 0';
    } else if (earningsParams.baseEarnings > 10000000) {
      errors.baseEarnings = 'Value seems unrealistic (max $10M)';
    }
    
    if (earningsParams.wle <= 0) {
      errors.wle = 'Work life expectancy must be greater than 0';
    } else if (earningsParams.wle > 60) {
      errors.wle = 'WLE cannot exceed 60 years';
    }
    
    if (earningsParams.wageGrowth < 0) {
      errors.wageGrowth = 'Wage growth cannot be negative';
    } else if (earningsParams.wageGrowth > 15) {
      errors.wageGrowth = 'Wage growth rate seems unrealistic (max 15%)';
    }
    
    if (earningsParams.discountRate < 0) {
      errors.discountRate = 'Discount rate cannot be negative';
    } else if (earningsParams.discountRate > 20) {
      errors.discountRate = 'Discount rate seems unrealistic (max 20%)';
    }
    
    return errors;
  }, [earningsParams]);

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;

  const startYear = dateOfInjury ? parseDate(dateOfInjury).getFullYear() : new Date().getFullYear();
  const fullPast = Math.floor(dateCalc.pastYears);
  const applyRecommendedEconomic = useCallback(() => {
    setEarningsParams(prev => ({
      ...prev,
      wageGrowth: 3.0,
      discountRate: 4.25,
      unemploymentRate: 4.2,
      uiReplacementRate: 40.0,
      fedTaxRate: 15.0,
      stateTaxRate: 4.5,
      fringeRate: isUnionMode ? prev.fringeRate : 21.5
    }));
  }, [setEarningsParams, isUnionMode]);

  // Calculate age at injury (with NaN protection)
  const ageAtInjury = useMemo(() => {
    if (!dob || !dateOfInjury) return 0;
    const dobDate = parseDate(dob);
    const injuryDate = parseDate(dateOfInjury);
    if (isNaN(dobDate.getTime()) || isNaN(injuryDate.getTime())) return 0;
    const age = (injuryDate.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return isNaN(age) ? 0 : age;
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
      <div className="print:hidden bg-muted border border-border rounded-xl p-3 sm:p-4 flex flex-col gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">Don’t know what to enter?</p>
          <p className="text-xs text-muted-foreground mt-1">Use the recommended baseline to fill growth, discount, unemployment, tax, and fringe.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={applyRecommendedEconomic}
            className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 shadow-sm touch-manipulation active:scale-[0.98]"
          >
            Apply recommended baseline
          </button>
          <button
            onClick={() => setEarningsParams(prev => ({ ...prev, useManualYFS: false, selectedScenario: prev.selectedScenario || 'age67' }))}
            className="px-4 py-3 sm:py-2 min-h-[44px] rounded-lg border border-border text-sm text-muted-foreground hover:bg-background touch-manipulation active:scale-[0.98]"
          >
            Use calculated YFS
          </button>
        </div>
      </div>

      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Earnings & Economic Variables</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure earnings capacity, work life, and retirement scenarios</p>
        {hasErrors && Object.keys(touched).length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Please review the highlighted fields</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Vocational Statistics */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-indigo">
          <SectionHeader icon={Briefcase} title="Vocational Statistics" subtitle="Earnings & Work Life" />
          <div className="space-y-2 sm:space-y-3">
            <InputGroup 
              label="Pre-Injury Earnings Capacity" 
              prefix="$" 
              value={earningsParams.baseEarnings} 
              onChange={v => setEarningsParams({...earningsParams, baseEarnings: parseFloat(v) || 0})} 
              onBlur={() => markTouched('baseEarnings')}
              placeholder="Annual gross pay before the injury" 
              required
              error={touched.baseEarnings ? errors.baseEarnings : undefined}
            />
            <InputGroup label="Post-Injury Residual Capacity" prefix="$" value={earningsParams.residualEarnings} onChange={v => setEarningsParams({...earningsParams, residualEarnings: parseFloat(v) || 0})} placeholder="Set to 0 if unable to work" />
            <p className="text-xs text-muted-foreground -mt-1">Use yearly amounts. Residual is what the person can realistically earn after the injury.</p>
            
            <div className="border-t border-border pt-3 mt-2 sm:mt-3">
              <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground mb-2">Work Life Expectancy</h4>
              <InputGroup 
                label="WLE (from injury date)" 
                suffix="years" 
                value={earningsParams.wle} 
                onChange={v => setEarningsParams({...earningsParams, wle: parseFloat(v) || 0})} 
                onBlur={() => markTouched('wle')}
                step="0.01"
                placeholder="Years expected in workforce (e.g., 17.5)"
                required
                error={touched.wle ? errors.wle : undefined}
              />
              
              {ageAtInjury > 0 && (
                <div className="bg-indigo/10 p-3 rounded-lg mt-2 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">Age at Injury:</span>
                    <span className="font-bold">{ageAtInjury.toFixed(2)} yrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs sm:text-sm">WLE Retirement Age:</span>
                    <span className="font-bold">{(ageAtInjury + earningsParams.wle).toFixed(2)} yrs</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 mt-2 sm:mt-3">
              <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground mb-2">Years to Final Separation (YFS)</h4>
              <label className="flex items-center gap-3 text-xs sm:text-sm mb-2 cursor-pointer min-h-[40px] touch-manipulation">
                <input 
                  type="checkbox" 
                  checked={earningsParams.useManualYFS} 
                  onChange={e => setEarningsParams({...earningsParams, useManualYFS: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
                <span>Use Manual YFS Override</span>
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
                <p className="text-xs text-muted-foreground">YFS is auto-calculated from the active retirement scenario. Only override if you must force a specific timeline.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Retirement Scenarios */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-amber-500">
          <SectionHeader icon={Target} title="Retirement Scenarios" subtitle="Compare different retirement ages" />
          
          <div className="space-y-3">
            {/* Scenario Selector */}
            <div className="mb-3 sm:mb-4">
              <label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground mb-1 block">Active Scenario for Calculations</label>
              <select 
                value={earningsParams.selectedScenario}
                onChange={e => setEarningsParams({...earningsParams, selectedScenario: e.target.value})}
                className="w-full px-3 py-3 sm:py-2 min-h-[44px] rounded-lg border border-border bg-background text-foreground text-sm touch-manipulation"
              >
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* PJI Toggle */}
            <label className="flex items-center gap-3 text-sm cursor-pointer bg-muted p-3 sm:p-2 rounded-lg min-h-[44px] touch-manipulation">
              <input 
                type="checkbox" 
                checked={earningsParams.enablePJI} 
                onChange={e => setEarningsParams({...earningsParams, enablePJI: e.target.checked})}
                className="w-5 h-5 rounded"
              />
              <span>Enable PJI (Permanent Job Incapacity)</span>
            </label>
            
            {earningsParams.enablePJI && (
              <InputGroup 
                label="PJI Retirement Age" 
                value={earningsParams.pjiAge} 
                onChange={v => setEarningsParams({...earningsParams, pjiAge: parseInt(v) || 62})} 
                suffix="years"
              />
            )}

            {/* Scenarios - Card view on mobile, table on desktop */}
            <div className="mt-3 sm:mt-4">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2">
                {scenarios.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => setEarningsParams({...earningsParams, selectedScenario: s.id})}
                    className={`p-3 rounded-lg border cursor-pointer touch-manipulation active:scale-[0.99] transition-all ${
                      s.id === earningsParams.selectedScenario 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${s.id === earningsParams.selectedScenario ? 'text-primary' : 'text-foreground'}`}>
                        {s.label}
                      </span>
                      {s.id === earningsParams.selectedScenario && (
                        <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-muted rounded p-2">
                        <span className="block text-muted-foreground text-[9px]">Ret Age</span>
                        <span className="font-mono font-bold">{(s.retirementAge ?? 0).toFixed(1)}</span>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <span className="block text-muted-foreground text-[9px]">YFS</span>
                        <span className="font-mono font-bold">{(s.yfs ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <span className="block text-muted-foreground text-[9px]">WLF</span>
                        <span className="font-mono font-bold text-primary">{(s.wlf ?? 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
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
                        className={`border-b border-border cursor-pointer hover:bg-muted/50 ${s.id === earningsParams.selectedScenario ? 'bg-primary/10' : ''}`}
                        onClick={() => setEarningsParams({...earningsParams, selectedScenario: s.id})}
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
            </div>

            {/* Selected Scenario Summary */}
            <div className="bg-amber-500/10 p-3 rounded-lg mt-3">
              <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-amber-600 mb-2">Selected: {selectedScenarioData?.label ?? 'N/A'}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-background/50 rounded-lg p-2">
                  <span className="block text-[10px] text-muted-foreground">YFS</span>
                  <span className="font-bold text-base sm:text-lg">{(selectedScenarioData?.yfs ?? 0).toFixed(2)}</span>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                  <span className="block text-[10px] text-muted-foreground">WLF</span>
                  <span className="font-bold text-base sm:text-lg text-primary">{(selectedScenarioData?.wlf ?? 0).toFixed(2)}%</span>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                  <span className="block text-[10px] text-muted-foreground">Ret Age</span>
                  <span className="font-bold text-base sm:text-lg">{(selectedScenarioData?.retirementAge ?? 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Fringe Benefits */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-sky">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
            <SectionHeader icon={HeartPulse} title="Fringe Benefits" subtitle="Employer-paid benefits" />
            <label className="text-xs sm:text-[10px] flex items-center gap-2 cursor-pointer bg-muted px-3 py-2 sm:px-2 sm:py-1 rounded min-h-[40px] sm:min-h-0 touch-manipulation">
              <input type="checkbox" checked={isUnionMode} onChange={e => setIsUnionMode(e.target.checked)} className="w-5 h-5 sm:w-4 sm:h-4" />
              <span>Union Mode</span>
            </label>
          </div>
          
          {isUnionMode ? (
            <div className="space-y-2">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mb-2">Enter annualized union benefit amounts:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InputGroup label="Pension ($/yr)" prefix="$" value={earningsParams.pension} onChange={v => setEarningsParams({...earningsParams, pension: parseFloat(v) || 0})} />
                <InputGroup label="Health & Welfare ($/yr)" prefix="$" value={earningsParams.healthWelfare} onChange={v => setEarningsParams({...earningsParams, healthWelfare: parseFloat(v) || 0})} />
                <InputGroup label="Annuity ($/yr)" prefix="$" value={earningsParams.annuity} onChange={v => setEarningsParams({...earningsParams, annuity: parseFloat(v) || 0})} />
                <InputGroup label="Clothing Allow ($/yr)" prefix="$" value={earningsParams.clothingAllowance} onChange={v => setEarningsParams({...earningsParams, clothingAllowance: parseFloat(v) || 0})} />
              </div>
              <InputGroup label="Other Benefits ($/yr)" prefix="$" value={earningsParams.otherBenefits} onChange={v => setEarningsParams({...earningsParams, otherBenefits: parseFloat(v) || 0})} />
              <div className="bg-sky/10 p-3 rounded text-xs sm:text-sm text-center">
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
        <Card className="p-4 sm:p-5 border-l-4 border-l-emerald">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <SectionHeader icon={TrendingUp} title="Economic Variables" />
            <button
              onClick={applyRecommendedEconomic}
              className="text-xs px-4 py-2.5 sm:px-3 sm:py-1.5 min-h-[40px] sm:min-h-0 rounded-lg border border-border text-foreground hover:bg-muted touch-manipulation active:scale-[0.98]"
            >
              Quick fill defaults
            </button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Growth & Discounting</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InputGroup 
                label="Wage Growth Rate" 
                suffix="%" 
                value={earningsParams.wageGrowth} 
                onChange={v => setEarningsParams({...earningsParams, wageGrowth: parseFloat(v) || 0})} 
                onBlur={() => markTouched('wageGrowth')}
                required
                error={touched.wageGrowth ? errors.wageGrowth : undefined}
              />
              <InputGroup 
                label="Discount Rate" 
                suffix="%" 
                value={earningsParams.discountRate} 
                onChange={v => setEarningsParams({...earningsParams, discountRate: parseFloat(v) || 0})} 
                onBlur={() => markTouched('discountRate')}
                required
                error={touched.discountRate ? errors.discountRate : undefined}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-1">Typical defaults: Wage growth ~3%, Discount ~4–4.5%.</p>
            
            <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground pt-2">Unemployment Adjustment</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InputGroup label="Unemployment Rate" suffix="%" value={earningsParams.unemploymentRate} onChange={v => setEarningsParams({...earningsParams, unemploymentRate: parseFloat(v) || 0})} />
              <InputGroup label="UI Replacement Rate" suffix="%" value={earningsParams.uiReplacementRate} onChange={v => setEarningsParams({...earningsParams, uiReplacementRate: parseFloat(v) || 0})} />
            </div>

            <h4 className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground pt-2">Tax Rates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InputGroup label="Federal Tax Rate" suffix="%" value={earningsParams.fedTaxRate} onChange={v => setEarningsParams({...earningsParams, fedTaxRate: parseFloat(v) || 0})} />
              <InputGroup label="State Tax Rate" suffix="%" value={earningsParams.stateTaxRate} onChange={v => setEarningsParams({...earningsParams, stateTaxRate: parseFloat(v) || 0})} />
            </div>
            <div className="bg-muted p-3 rounded text-xs sm:text-sm text-center">
              <span className="text-muted-foreground">Combined Tax Rate: </span>
              <strong>{fmtPct(algebraic.combinedTaxRate)}</strong>
            </div>
          </div>
        </Card>

        {/* Past Actual Earnings */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-rose lg:col-span-2">
          <SectionHeader icon={History} title="Past Actual Earnings" subtitle="Override residual for specific years" />
          {fullPast > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
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
