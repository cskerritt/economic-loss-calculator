import React, { useState } from 'react';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from '../ui';
import { CaseInfo, EarningsParams } from '../types';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NarrativesStepProps {
  caseInfo: CaseInfo;
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>;
  earningsParams?: EarningsParams;
}

type NarrativeField = 'medicalSummary' | 'employmentHistory' | 'earningsHistory' | 'preInjuryCapacity' | 'postInjuryCapacity' | 'functionalLimitations';

export const NarrativesStep: React.FC<NarrativesStepProps> = ({ caseInfo, setCaseInfo, earningsParams }) => {
  const [generatingField, setGeneratingField] = useState<NarrativeField | null>(null);
  const { toast } = useToast();

  const generateNarrative = async (field: NarrativeField) => {
    setGeneratingField(field);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'generate_narrative',
          field,
          caseContext: {
            plaintiff: caseInfo.plaintiff,
            gender: caseInfo.gender,
            dob: caseInfo.dob,
            dateOfInjury: caseInfo.dateOfInjury,
            baseEarnings: earningsParams?.baseEarnings,
            residualEarnings: earningsParams?.residualEarnings,
            wle: earningsParams?.wle,
            medicalSummary: caseInfo.medicalSummary,
            employmentHistory: caseInfo.employmentHistory,
          },
        },
      });

      if (error) throw error;

      if (data.content) {
        setCaseInfo(prev => ({ ...prev, [field]: data.content }));
        toast({
          title: 'Narrative generated',
          description: 'AI has generated a draft narrative. Please review and edit as needed.',
        });
      }
    } catch (error) {
      console.error('Generate narrative error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate narrative',
        variant: 'destructive',
      });
    } finally {
      setGeneratingField(null);
    }
  };

  const NarrativeTextArea = ({ 
    label, 
    field, 
    placeholder, 
    rows = 5 
  }: { 
    label: string; 
    field: NarrativeField; 
    placeholder: string; 
    rows?: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generateNarrative(field)}
          disabled={generatingField !== null}
          className="h-9 min-w-[44px] text-[10px] gap-1 text-primary hover:text-primary px-3 touch-manipulation"
        >
          {generatingField === field ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Generate</span>
            </>
          )}
        </Button>
      </div>
      <textarea
        rows={rows}
        value={caseInfo[field]}
        onChange={(e) => setCaseInfo({...caseInfo, [field]: e.target.value})}
        placeholder={placeholder}
        className="block w-full rounded-lg border-border py-2 focus:ring-primary focus:border-primary text-sm border px-3 transition-all resize-none bg-background text-foreground"
      />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Narrative Sections</h2>
        <p className="text-muted-foreground mt-1 text-sm">Enter detailed narratives for the report body</p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Use AI to generate draft narratives from case data
        </p>
      </div>

      <Card className="p-4 sm:p-6 border-l-4 border-l-accent">
        <SectionHeader icon={BookOpen} title="Background & Analysis" subtitle="Supporting documentation for report" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <NarrativeTextArea 
              label="Medical Summary"
              field="medicalSummary"
              placeholder="Briefly describe injuries and medical treatment. Include diagnosis, surgical procedures, ongoing care needs, and prognosis..." 
            />
            
            <NarrativeTextArea 
              label="Employment History"
              field="employmentHistory"
              placeholder="List job history with dates, employers, positions, and responsibilities. Include promotions and career trajectory..." 
            />
            
            <NarrativeTextArea 
              label="Earnings History"
              field="earningsHistory"
              placeholder="Document W-2s, 1040s, pay stubs, and other earnings evidence. Include years and amounts..." 
            />
          </div>
          
          <div className="space-y-4">
            <NarrativeTextArea 
              label="Pre-Injury Capacity"
              field="preInjuryCapacity"
              placeholder="Describe the basis for pre-injury earning capacity. Include occupation, skills, experience, and expected career path..." 
            />
            
            <NarrativeTextArea 
              label="Post-Injury Capacity"
              field="postInjuryCapacity"
              placeholder="Describe post-injury residual earning capacity. Include remaining work abilities, vocational testing results, and labor market analysis..." 
            />
            
            <NarrativeTextArea 
              label="Functional Limitations & Future Employability"
              field="functionalLimitations"
              placeholder="Describe functional limitations and their impact on future employability. Include restrictions, accommodations needed, and vocational prognosis..." 
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
