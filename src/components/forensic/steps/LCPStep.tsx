import React from 'react';
import { Plus, Trash2, HeartPulse } from 'lucide-react';
import { Card } from '../ui';
import { LcpItem, LcpData, CPI_CATEGORIES } from '../types';

interface LCPStepProps {
  lcpItems: LcpItem[];
  setLcpItems: React.Dispatch<React.SetStateAction<LcpItem[]>>;
  lcpData: LcpData;
  lifeExpectancy: number;
  fmtUSD: (n: number) => string;
}

export const LCPStep: React.FC<LCPStepProps> = ({ 
  lcpItems, 
  setLcpItems, 
  lcpData, 
  lifeExpectancy,
  fmtUSD 
}) => {
  const addItem = () => {
    setLcpItems([...lcpItems, {
      id: Date.now(),
      categoryId: 'evals',
      name: 'New Item',
      baseCost: 0,
      freqType: 'annual',
      duration: Math.ceil(lifeExpectancy || 25),
      startYear: 1,
      cpi: 2.88,
      recurrenceInterval: 1
    }]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Life Care Plan</h2>
        <p className="text-muted-foreground mt-1">Future cost of healthcare services and needs</p>
      </div>

      <Card>
        <div className="p-4 border-b border-border bg-muted flex justify-between items-center">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-foreground">LCP Items</h3>
              <p className="text-xs text-muted-foreground">{lcpItems.length} items configured</p>
            </div>
          </div>
          <button 
            onClick={addItem}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm hover:bg-primary/90 flex gap-2 items-center shadow-lg transform active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        
        <div className="p-4">
          {lcpItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <HeartPulse className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No life care plan items yet</p>
              <p className="text-sm mt-1">Click "Add Item" to begin building the life care plan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lcpItems.map(item => {
                const itemData = lcpData.items.find(i => i.id === item.id);
                return (
                  <div key={item.id} className="relative bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Category</label>
                        <select 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 focus:ring-1 focus:ring-primary text-foreground" 
                          value={item.categoryId} 
                          onChange={(e) => {
                            const cat = CPI_CATEGORIES.find(c => c.id === e.target.value);
                            setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, categoryId: e.target.value, cpi: cat ? cat.rate : 0} : i));
                          }}
                        >
                          {CPI_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Description</label>
                        <input 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.name} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, name: e.target.value} : i))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Cost ($)</label>
                        <input 
                          type="number" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.baseCost} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, baseCost: parseFloat(e.target.value) || 0} : i))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Frequency</label>
                        <select 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.freqType} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, freqType: e.target.value} : i))}
                        >
                          <option value="annual">Annual</option>
                          <option value="onetime">One Time</option>
                          <option value="recurring">Recurring (Every X Yrs)</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Duration</label>
                        <input 
                          type="number" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.duration} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, duration: parseInt(e.target.value) || 1} : i))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Start Yr</label>
                        <input 
                          type="number" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.startYear} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, startYear: parseInt(e.target.value) || 1} : i))}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">CPI %</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.cpi} 
                          onChange={e => setLcpItems(lcpItems.map(i => i.id === item.id ? {...i, cpi: parseFloat(e.target.value) || 0} : i))}
                        />
                      </div>
                      <div className="md:col-span-1 flex items-center justify-end gap-2">
                        <div className="text-right mr-2">
                          <span className="text-[9px] text-muted-foreground block">PV</span>
                          <span className="text-sm font-bold text-primary">{fmtUSD(itemData?.totalPV || 0)}</span>
                        </div>
                        <button 
                          onClick={() => setLcpItems(lcpItems.filter(i => i.id !== item.id))} 
                          className="text-muted-foreground hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {lcpItems.length > 0 && (
          <div className="p-4 bg-muted border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Life Care Plan Total</span>
              <div className="text-right">
                <span className="block text-2xl font-bold text-primary">{fmtUSD(lcpData.totalPV)}</span>
                <span className="text-xs text-muted-foreground">Nominal: {fmtUSD(lcpData.totalNom)}</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
