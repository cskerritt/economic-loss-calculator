import React from 'react';
import { Home } from 'lucide-react';
import { Card, SectionHeader, InputGroup } from '../ui';
import { HhServices, HhsData } from '../types';

interface HouseholdStepProps {
  hhServices: HhServices;
  setHhServices: React.Dispatch<React.SetStateAction<HhServices>>;
  hhsData: HhsData;
  fmtUSD: (n: number) => string;
}

export const HouseholdStep: React.FC<HouseholdStepProps> = ({ 
  hhServices, 
  setHhServices, 
  hhsData, 
  fmtUSD 
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Household Services</h2>
        <p className="text-muted-foreground mt-1">Calculate loss of domestic capacity</p>
      </div>

      <Card className="p-6 border-l-4 border-l-rose">
        <div className="flex justify-between items-center mb-5">
          <SectionHeader icon={Home} title="Household Services Valuation" subtitle="Loss of domestic capacity" />
          <label className="flex items-center gap-2 text-sm font-bold text-foreground bg-muted px-4 py-2 rounded-lg cursor-pointer">
            <input 
              type="checkbox" 
              checked={hhServices.active} 
              onChange={e => setHhServices({...hhServices, active: e.target.checked})} 
              className="w-5 h-5 rounded" 
            />
            Include in Analysis
          </label>
        </div>
        
        {hhServices.active ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup 
                label="Lost Hours Per Week" 
                value={hhServices.hoursPerWeek} 
                onChange={v => setHhServices({...hhServices, hoursPerWeek: parseFloat(v) || 0})} 
                suffix="hrs"
              />
              <InputGroup 
                label="Hourly Replacement Rate" 
                prefix="$" 
                value={hhServices.hourlyRate} 
                onChange={v => setHhServices({...hhServices, hourlyRate: parseFloat(v) || 0})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputGroup 
                label="Growth Rate" 
                suffix="%" 
                value={hhServices.growthRate} 
                onChange={v => setHhServices({...hhServices, growthRate: parseFloat(v) || 0})} 
              />
              <InputGroup 
                label="Discount Rate" 
                suffix="%" 
                value={hhServices.discountRate} 
                onChange={v => setHhServices({...hhServices, discountRate: parseFloat(v) || 0})} 
              />
            </div>
            
            <div className="bg-rose/10 rounded-xl p-6 text-center mt-6">
              <span className="block text-[10px] uppercase font-bold text-rose mb-2">Total Household Services (Present Value)</span>
              <span className="font-bold text-rose text-3xl">{fmtUSD(hhsData.totalPV)}</span>
              <span className="block text-sm text-muted-foreground mt-2">
                Nominal Total: {fmtUSD(hhsData.totalNom)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Home className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Household services are not included</p>
            <p className="text-sm mt-1">Toggle the checkbox above to include this damage category</p>
          </div>
        )}
      </Card>
    </div>
  );
};
