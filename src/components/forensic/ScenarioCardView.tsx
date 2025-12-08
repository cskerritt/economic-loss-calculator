import React from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Card } from './ui';
import { ScenarioProjection } from './types';
import { Checkbox } from '@/components/ui/checkbox';

interface ScenarioCardViewProps {
  scenarioProjections: ScenarioProjection[];
  selectedScenario: string;
  onToggleScenarioIncluded: (id: string) => void;
  onViewSchedule: (id: string) => void;
  openSchedules: Record<string, boolean>;
  fmtUSD: (n: number) => string;
}

export const ScenarioCardView: React.FC<ScenarioCardViewProps> = ({
  scenarioProjections,
  selectedScenario,
  onToggleScenarioIncluded,
  onViewSchedule,
  openSchedules,
  fmtUSD
}) => {
  return (
    <div className="space-y-3">
      {scenarioProjections.map(scenario => {
        const isActive = scenario.id === selectedScenario;
        
        return (
          <Card 
            key={scenario.id} 
            className={`p-4 transition-all ${isActive ? 'ring-2 ring-primary bg-primary/5' : ''}`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={scenario.included}
                  onCheckedChange={() => onToggleScenarioIncluded(scenario.id)}
                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {scenario.label}
                    </span>
                    {isActive && (
                      <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Ret. Age: {scenario.retirementAge.toFixed(1)}
                  </span>
                </div>
              </div>
              
              {scenario.included && (
                <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 rounded-full">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground mb-0.5">YFS</div>
                <div className="font-mono font-semibold text-sm">{scenario.yfs.toFixed(2)} yrs</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground mb-0.5">WLF</div>
                <div className="font-mono font-semibold text-sm">{scenario.wlfPercent.toFixed(2)}%</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Past Loss</div>
                <div className="font-mono font-semibold text-sm">{fmtUSD(scenario.totalPastLoss)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Future PV</div>
                <div className="font-mono font-semibold text-sm">{fmtUSD(scenario.totalFuturePV)}</div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-primary/10 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                <span className="text-lg font-bold text-primary font-mono">{fmtUSD(scenario.grandTotal)}</span>
              </div>
            </div>

            {/* View YOY Button */}
            <button
              onClick={() => onViewSchedule(scenario.id)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              {openSchedules[scenario.id] ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Hide Year-Over-Year Schedule
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  View Year-Over-Year Schedule
                </>
              )}
            </button>
          </Card>
        );
      })}
    </div>
  );
};
