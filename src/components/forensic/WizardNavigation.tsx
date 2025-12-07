import React from 'react';
import { Check, ChevronLeft, ChevronRight, AlertCircle, type LucideIcon } from 'lucide-react';

export interface WizardStep {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface StepCompletion {
  [stepId: string]: {
    filled: number;
    total: number;
    percentage: number;
  };
}

export interface ValidationCheck {
  id: string;
  label: string;
  ok: boolean;
  stepId: string;
  stepLabel: string;
}

interface WizardNavigationProps {
  steps: WizardStep[];
  currentStep: number;
  stepCompletion: StepCompletion;
  validationChecks?: ValidationCheck[];
  onStepClick: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  steps,
  currentStep,
  stepCompletion,
  validationChecks = [],
  onStepClick,
  onNext,
  onPrevious
}) => {
  // Get validation errors per step
  const getStepValidationErrors = (stepId: string): number => {
    return validationChecks.filter(c => c.stepId === stepId && !c.ok).length;
  };

  return (
    <div className="bg-card border-b border-border sticky top-14 sm:top-16 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Step Indicators - Scrollable on mobile */}
        <div className="flex items-center py-3 sm:py-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center justify-start lg:justify-center w-full min-w-max lg:min-w-0 px-2 lg:px-0 gap-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const completion = stepCompletion[step.id];
              const validationErrors = getStepValidationErrors(step.id);
              const hasValidationErrors = validationErrors > 0;
              const isComplete = completion?.percentage >= 100 && !hasValidationErrors;
              const hasProgress = completion?.percentage > 0 && completion?.percentage < 100;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => onStepClick(index)}
                    className={`flex flex-col items-center min-w-[60px] sm:min-w-[80px] transition-all flex-shrink-0 ${
                      isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="relative">
                      {/* Progress Ring */}
                      {hasProgress && (
                        <svg className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 -rotate-90">
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={`${(completion.percentage / 100) * 113} 113`}
                            className="text-amber-500"
                          />
                        </svg>
                      )}
                      <div className={`
                        w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 transition-all relative z-10
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-lg' 
                          : isComplete
                            ? 'bg-emerald-500 text-white' 
                            : hasValidationErrors
                              ? 'bg-destructive/10 text-destructive border-2 border-destructive'
                              : hasProgress
                                ? 'bg-amber-500/20 text-amber-600 border-2 border-amber-500'
                                : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {isComplete ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : hasValidationErrors ? (
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      {/* Validation error badge */}
                      {hasValidationErrors && !isActive && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center z-20">
                          {validationErrors}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wide ${
                      isActive ? 'text-primary' : hasValidationErrors ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {step.label}
                    </span>
                    {completion && (
                      <span className={`text-[8px] sm:text-[9px] ${
                        isComplete ? 'text-emerald-500' : hasValidationErrors ? 'text-destructive' : hasProgress ? 'text-amber-500' : 'text-muted-foreground'
                      }`}>
                        {hasValidationErrors ? `${validationErrors} issue${validationErrors !== 1 ? 's' : ''}` : `${completion.filled}/${completion.total}`}
                      </span>
                    )}
                  </button>
                  
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-4 sm:w-8 mx-0.5 sm:mx-1 transition-colors flex-shrink-0 ${
                      stepCompletion[steps[index].id]?.percentage >= 100 ? 'bg-emerald-500' : 'bg-border'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Navigation Buttons - Fixed at bottom on mobile */}
        <div className="hidden sm:flex justify-between items-center pb-4">
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
          
          {/* Keyboard hint */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">←</span>
            <span className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">→</span>
            <span>or</span>
            <span className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">1</span>
            <span>-</span>
            <span className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono">7</span>
            <span>to navigate</span>
          </div>
          
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

      {/* Mobile Fixed Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex justify-between items-center z-50 shadow-lg">
        <button
          onClick={onPrevious}
          disabled={currentStep === 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentStep === 0
              ? 'opacity-30 cursor-not-allowed text-muted-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        
        <span className="text-xs text-muted-foreground font-medium">
          {currentStep + 1} / {steps.length}
        </span>
        
        <button
          onClick={onNext}
          disabled={currentStep === steps.length - 1}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentStep === steps.length - 1
              ? 'opacity-30 cursor-not-allowed text-muted-foreground'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
          }`}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
