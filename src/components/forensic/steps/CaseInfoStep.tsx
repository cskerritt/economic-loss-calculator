import React, { useState, useCallback } from 'react';
import { User, Scale, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { CaseInfo, DateCalc } from '../types';
import { parseDate } from '../calculations';

interface CaseInfoStepProps {
  caseInfo: CaseInfo;
  setCaseInfo: React.Dispatch<React.SetStateAction<CaseInfo>>;
  dateCalc: DateCalc;
}

interface ValidationErrors {
  plaintiff?: string;
  dob?: string;
  dateOfInjury?: string;
  dateOfTrial?: string;
  lifeExpectancy?: string;
}

export const CaseInfoStep: React.FC<CaseInfoStepProps> = ({ caseInfo, setCaseInfo, dateCalc }) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!caseInfo.plaintiff?.trim()) {
      errors.plaintiff = 'Plaintiff name is required';
    } else if (caseInfo.plaintiff.length > 100) {
      errors.plaintiff = 'Name must be less than 100 characters';
    }
    
    if (!caseInfo.dob) {
      errors.dob = 'Date of birth is required';
    } else {
      const dobDate = parseDate(caseInfo.dob);
      if (isNaN(dobDate.getTime())) {
        errors.dob = 'Invalid date format (use MM/DD/YYYY)';
      } else if (dobDate > new Date()) {
        errors.dob = 'Date of birth cannot be in the future';
      }
    }
    
    if (!caseInfo.dateOfInjury) {
      errors.dateOfInjury = 'Date of injury is required';
    } else {
      const injuryDate = parseDate(caseInfo.dateOfInjury);
      if (isNaN(injuryDate.getTime())) {
        errors.dateOfInjury = 'Invalid date format (use MM/DD/YYYY)';
      }
    }
    
    if (!caseInfo.dateOfTrial) {
      errors.dateOfTrial = 'Trial/valuation date is required';
    } else {
      const trialDate = parseDate(caseInfo.dateOfTrial);
      if (isNaN(trialDate.getTime())) {
        errors.dateOfTrial = 'Invalid date format (use MM/DD/YYYY)';
      } else if (caseInfo.dateOfInjury) {
        const injuryDate = parseDate(caseInfo.dateOfInjury);
        if (trialDate < injuryDate) {
          errors.dateOfTrial = 'Trial date must be after injury date';
        }
      }
    }
    
    if (caseInfo.lifeExpectancy <= 0) {
      errors.lifeExpectancy = 'Life expectancy must be greater than 0';
    }
    
    return errors;
  }, [caseInfo]);

  const errors = validate();
  const hasErrors = Object.keys(errors).length > 0;
  const requiredFieldsComplete = !errors.plaintiff && !errors.dob && !errors.dateOfInjury && !errors.dateOfTrial;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Case Information</h2>
        <p className="text-muted-foreground mt-1">Enter the basic case details and plaintiff demographics</p>
        {hasErrors && Object.keys(touched).length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>Please complete all required fields</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demographics */}
        <Card className="p-5 border-l-4 border-l-indigo">
          <SectionHeader icon={User} title="Plaintiff Demographics" subtitle="Personal Information" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <InputGroup 
                label="Plaintiff Name" 
                type="text" 
                value={caseInfo.plaintiff} 
                onChange={v => setCaseInfo({...caseInfo, plaintiff: v})} 
                onBlur={() => markTouched('plaintiff')}
                placeholder="First Last" 
                required
                error={touched.plaintiff ? errors.plaintiff : undefined}
              />
              <InputGroup label="File Number" type="text" value={caseInfo.fileNumber} onChange={v => setCaseInfo({...caseInfo, fileNumber: v})} placeholder="KW-2025-XXX" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Gender" type="text" value={caseInfo.gender} onChange={v => setCaseInfo({...caseInfo, gender: v})} placeholder="Male/Female" />
              <InputGroup 
                label="Date of Birth" 
                type="date" 
                value={caseInfo.dob} 
                onChange={v => setCaseInfo({...caseInfo, dob: v})}
                onBlur={() => markTouched('dob')}
                required
                error={touched.dob ? errors.dob : undefined}
              />
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
        <Card className="p-5 border-l-4 border-l-amber-500">
          <SectionHeader icon={CalendarIcon} title="Key Dates" subtitle="Injury & Valuation Timeline" />
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <InputGroup 
                label="Date of Injury" 
                type="date" 
                value={caseInfo.dateOfInjury} 
                onChange={v => setCaseInfo({...caseInfo, dateOfInjury: v})}
                onBlur={() => markTouched('dateOfInjury')}
                required
                error={touched.dateOfInjury ? errors.dateOfInjury : undefined}
              />
              <InputGroup 
                label="Date of Trial/Valuation" 
                type="date" 
                value={caseInfo.dateOfTrial} 
                onChange={v => setCaseInfo({...caseInfo, dateOfTrial: v})}
                onBlur={() => markTouched('dateOfTrial')}
                required
                error={touched.dateOfTrial ? errors.dateOfTrial : undefined}
              />
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
            <InputGroup 
              label="Life Expectancy" 
              value={caseInfo.lifeExpectancy} 
              onChange={v => setCaseInfo({...caseInfo, lifeExpectancy: parseFloat(v) || 0})} 
              onBlur={() => markTouched('lifeExpectancy')}
              suffix="years" 
              required
              error={touched.lifeExpectancy ? errors.lifeExpectancy : undefined}
            />
            <InputGroup label="Life Table Source" type="text" value={caseInfo.lifeTableSource} onChange={v => setCaseInfo({...caseInfo, lifeTableSource: v})} placeholder="CDC, SSA, etc." />
            <InputGroup label="WLE Source" type="text" value={caseInfo.wleSource} onChange={v => setCaseInfo({...caseInfo, wleSource: v})} placeholder="Skoog-Ciecka, etc." />
          </div>
        </Card>
      </div>

      {/* Validation Summary */}
      {!requiredFieldsComplete && Object.keys(touched).length > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            Required Fields Missing
          </h4>
          <ul className="text-xs text-destructive/80 space-y-1 list-disc list-inside">
            {errors.plaintiff && <li>{errors.plaintiff}</li>}
            {errors.dob && <li>Date of Birth: {errors.dob}</li>}
            {errors.dateOfInjury && <li>Date of Injury: {errors.dateOfInjury}</li>}
            {errors.dateOfTrial && <li>Trial Date: {errors.dateOfTrial}</li>}
            {errors.lifeExpectancy && <li>Life Expectancy: {errors.lifeExpectancy}</li>}
          </ul>
        </div>
      )}
    </div>
  );
};
