import React from 'react';
import { User, Scale, Calendar as CalendarIcon } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { CaseInfo, DateCalc } from '../types';

interface CaseInfoStepProps {
  caseInfo: CaseInfo;
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>;
  dateCalc: DateCalc;
}

export const CaseInfoStep: React.FC<CaseInfoStepProps> = ({ caseInfo, setCaseInfo, dateCalc }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Case Information</h2>
        <p className="text-muted-foreground mt-1">Enter the basic case details and plaintiff demographics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics */}
        <Card className="p-5 border-l-4 border-l-indigo">
          <SectionHeader icon={User} title="Plaintiff Demographics" subtitle="Personal Information" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Plaintiff Name" type="text" value={caseInfo.plaintiff} onChange={v => setCaseInfo({...caseInfo, plaintiff: v})} placeholder="First Last" />
              <InputGroup label="File Number" type="text" value={caseInfo.fileNumber} onChange={v => setCaseInfo({...caseInfo, fileNumber: v})} placeholder="KW-2025-XXX" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Gender" type="text" value={caseInfo.gender} onChange={v => setCaseInfo({...caseInfo, gender: v})} placeholder="Male/Female" />
              <InputGroup label="Date of Birth" type="date" value={caseInfo.dob} onChange={v => setCaseInfo({...caseInfo, dob: v})} />
            </div>
            <InputGroup label="Education" type="text" value={caseInfo.education} onChange={v => setCaseInfo({...caseInfo, education: v})} placeholder="Highest degree, school, location" />
            <InputGroup label="Marital Status" type="text" value={caseInfo.maritalStatus} onChange={v => setCaseInfo({...caseInfo, maritalStatus: v})} placeholder="Single, Married, etc." />
            <InputGroup label="Dependents" type="text" value={caseInfo.dependents} onChange={v => setCaseInfo({...caseInfo, dependents: v})} placeholder="Number and ages of minor children" />
            <div className="grid grid-cols-3 gap-2">
              <InputGroup label="City" type="text" value={caseInfo.city} onChange={v => setCaseInfo({...caseInfo, city: v})} />
              <InputGroup label="County" type="text" value={caseInfo.county} onChange={v => setCaseInfo({...caseInfo, county: v})} />
              <InputGroup label="State" type="text" value={caseInfo.state} onChange={v => setCaseInfo({...caseInfo, state: v})} />
            </div>
          </div>
        </Card>

        {/* Legal Framework */}
        <Card className="p-5 border-l-4 border-l-sky">
          <SectionHeader icon={Scale} title="Legal Framework" subtitle="Jurisdiction & Retaining Party" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Jurisdiction" type="text" value={caseInfo.jurisdiction} onChange={v => setCaseInfo({...caseInfo, jurisdiction: v})} placeholder="State/Federal" />
              <InputGroup label="Case Type" type="text" value={caseInfo.caseType} onChange={v => setCaseInfo({...caseInfo, caseType: v})} placeholder="Personal Injury, WC, etc." />
            </div>
            <InputGroup label="Retaining Attorney" type="text" value={caseInfo.attorney} onChange={v => setCaseInfo({...caseInfo, attorney: v})} placeholder="Attorney Name" />
            <InputGroup label="Law Firm" type="text" value={caseInfo.lawFirm} onChange={v => setCaseInfo({...caseInfo, lawFirm: v})} placeholder="Firm Name" />
            <InputGroup label="Report Date" type="date" value={caseInfo.reportDate} onChange={v => setCaseInfo({...caseInfo, reportDate: v})} />
          </div>
        </Card>

        {/* Key Dates */}
        <Card className="p-5 border-l-4 border-l-amber">
          <SectionHeader icon={CalendarIcon} title="Key Dates" subtitle="Injury & Valuation Timeline" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Date of Injury" type="date" value={caseInfo.dateOfInjury} onChange={v => setCaseInfo({...caseInfo, dateOfInjury: v})} />
              <InputGroup label="Date of Trial/Valuation" type="date" value={caseInfo.dateOfTrial} onChange={v => setCaseInfo({...caseInfo, dateOfTrial: v})} />
            </div>
            <InputGroup label="Retirement Age" value={caseInfo.retirementAge} onChange={v => setCaseInfo({...caseInfo, retirementAge: parseInt(v) || 67})} suffix="years" />
            
            {/* Calculated Ages */}
            <div className="bg-muted rounded-lg p-3 mt-3">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Calculated Values</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <span className="block text-muted-foreground text-[10px]">Current Age</span>
                  <span className="font-bold text-foreground">{dateCalc.currentAge}</span>
                </div>
                <div className="text-center">
                  <span className="block text-muted-foreground text-[10px]">Age at Injury</span>
                  <span className="font-bold text-foreground">{dateCalc.ageInjury}</span>
                </div>
                <div className="text-center">
                  <span className="block text-muted-foreground text-[10px]">Age at Trial</span>
                  <span className="font-bold text-foreground">{dateCalc.ageTrial}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actuarial Sources */}
        <Card className="p-5 border-l-4 border-l-emerald">
          <SectionHeader icon={User} title="Actuarial Data" subtitle="Life & Work Expectancy Sources" />
          <div className="space-y-2">
            <InputGroup label="Life Expectancy" value={caseInfo.lifeExpectancy} onChange={v => setCaseInfo({...caseInfo, lifeExpectancy: parseFloat(v) || 0})} suffix="years" />
            <InputGroup label="Life Table Source" type="text" value={caseInfo.lifeTableSource} onChange={v => setCaseInfo({...caseInfo, lifeTableSource: v})} placeholder="CDC, SSA, etc." />
            <InputGroup label="WLE Source" type="text" value={caseInfo.wleSource} onChange={v => setCaseInfo({...caseInfo, wleSource: v})} placeholder="Skoog-Ciecka, etc." />
          </div>
        </Card>
      </div>
    </div>
  );
};
