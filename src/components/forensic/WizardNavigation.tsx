import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface WizardNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  steps,
  currentStep,
  onStepClick,
  onNext,
  onPrevious
}) => {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Step Indicators */}
        <div className="flex items-center justify-center py-4 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onStepClick(index)}
                  className={`flex flex-col items-center min-w-[80px] transition-all ${
                    isActive 
                      ? 'scale-105' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-medium uppercase tracking-wide ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-8 mx-1 ${
                    index < currentStep ? 'bg-emerald-500' : 'bg-border'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pb-4">
          <button
            onClick={onPrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentStep === 0
                ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          
          <button
            onClick={onNext}
            disabled={currentStep === steps.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentStep === steps.length - 1
                ? 'opacity-30 cursor-not-allowed text-muted-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
            }`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
