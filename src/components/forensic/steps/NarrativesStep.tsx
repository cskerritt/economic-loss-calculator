import React from 'react';
import { BookOpen } from 'lucide-react';
import { Card, SectionHeader, TextArea } from '../ui';
import { CaseInfo } from '../types';

interface NarrativesStepProps {
  caseInfo: CaseInfo;
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>;
}

export const NarrativesStep: React.FC<NarrativesStepProps> = ({ caseInfo, setCaseInfo }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Narrative Sections</h2>
        <p className="text-muted-foreground mt-1">Enter detailed narratives for the report body</p>
      </div>

      <Card className="p-6 border-l-4 border-l-accent">
        <SectionHeader icon={BookOpen} title="Background & Analysis" subtitle="Supporting documentation for report" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TextArea 
              label="Medical Summary" 
              value={caseInfo.medicalSummary} 
              onChange={v => setCaseInfo({...caseInfo, medicalSummary: v})} 
              placeholder="Briefly describe injuries and medical treatment. Include diagnosis, surgical procedures, ongoing care needs, and prognosis..." 
              rows={5} 
            />
            
            <TextArea 
              label="Employment History" 
              value={caseInfo.employmentHistory} 
              onChange={v => setCaseInfo({...caseInfo, employmentHistory: v})} 
              placeholder="List job history with dates, employers, positions, and responsibilities. Include promotions and career trajectory..." 
              rows={5} 
            />
            
            <TextArea 
              label="Earnings History" 
              value={caseInfo.earningsHistory} 
              onChange={v => setCaseInfo({...caseInfo, earningsHistory: v})} 
              placeholder="Document W-2s, 1040s, pay stubs, and other earnings evidence. Include years and amounts..." 
              rows={5} 
            />
          </div>
          
          <div className="space-y-4">
            <TextArea 
              label="Pre-Injury Capacity" 
              value={caseInfo.preInjuryCapacity} 
              onChange={v => setCaseInfo({...caseInfo, preInjuryCapacity: v})} 
              placeholder="Describe the basis for pre-injury earning capacity. Include occupation, skills, experience, and expected career path..." 
              rows={5} 
            />
            
            <TextArea 
              label="Post-Injury Capacity" 
              value={caseInfo.postInjuryCapacity} 
              onChange={v => setCaseInfo({...caseInfo, postInjuryCapacity: v})} 
              placeholder="Describe post-injury residual earning capacity. Include remaining work abilities, vocational testing results, and labor market analysis..." 
              rows={5} 
            />
            
            <TextArea 
              label="Functional Limitations & Future Employability" 
              value={caseInfo.functionalLimitations} 
              onChange={v => setCaseInfo({...caseInfo, functionalLimitations: v})} 
              placeholder="Describe functional limitations and their impact on future employability. Include restrictions, accommodations needed, and vocational prognosis..." 
              rows={5} 
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
