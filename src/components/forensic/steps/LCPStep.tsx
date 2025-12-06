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
  baseYear: number;
}

export const LCPStep: React.FC<LCPStepProps> = ({ 
  lcpItems, 
  setLcpItems, 
  lcpData, 
  lifeExpectancy,
  fmtUSD,
  baseYear
}) => {
  const safeBaseYear = Number.isFinite(baseYear) ? baseYear : new Date().getFullYear();
  const addItem = () => {
    const defaultDuration = Math.max(1, Math.ceil(lifeExpectancy || 25));
    const startYear = 1;
    setLcpItems([...lcpItems, {
      id: Date.now(),
      categoryId: 'evals',
      name: 'New Item',
      baseCost: 0,
      freqType: 'annual',
      duration: defaultDuration,
      startYear,
      endYear: startYear + defaultDuration - 1,
      cpi: 2.88,
      recurrenceInterval: 1,
      useCustomYears: false,
      customYears: []
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
                const startYear = Math.max(1, item.startYear || 1);
                const endYear = Math.max(startYear, item.endYear || startYear + item.duration - 1);
                const duration = Math.max(1, endYear - startYear + 1);
                const yearRange = Array.from({ length: Math.min(200, duration) }, (_, idx) => startYear + idx);
                const calendarRange = yearRange.map((yr) => safeBaseYear + (yr - 1));
                const updateItem = (changes: Partial<LcpItem>) => setLcpItems(lcpItems.map(i => i.id === item.id ? { ...i, ...changes } : i));
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
                            updateItem({ categoryId: e.target.value, cpi: cat ? cat.rate : item.cpi });
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
                          onChange={e => updateItem({ name: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Cost ($)</label>
                        <input 
                          type="number" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.baseCost} 
                          onChange={e => updateItem({ baseCost: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Frequency</label>
                        <select 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.freqType} 
                          onChange={e => updateItem({ freqType: e.target.value })}
                        >
                          <option value="annual">Annual</option>
                          <option value="onetime">One Time</option>
                          <option value="recurring">Recurring (Every X Yrs)</option>
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Every X Yrs</label>
                        <input
                          type="number"
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground"
                          value={item.recurrenceInterval}
                          onChange={e => updateItem({ recurrenceInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Start Year</label>
                        <input
                          type="number"
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground"
                          value={startYear}
                          onChange={e => {
                            const nextStart = Math.max(1, parseInt(e.target.value) || 1);
                            const nextEnd = Math.max(nextStart, endYear);
                            updateItem({ startYear: nextStart, endYear: nextEnd, duration: Math.max(1, nextEnd - nextStart + 1) });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">End Year</label>
                        <input
                          type="number"
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground"
                          value={endYear}
                          onChange={e => {
                            const nextEnd = Math.max(startYear, parseInt(e.target.value) || startYear);
                            updateItem({ endYear: nextEnd, duration: Math.max(1, nextEnd - startYear + 1) });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Duration</label>
                        <input 
                          type="number" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.duration} 
                          onChange={e => {
                            const nextDuration = Math.max(1, parseInt(e.target.value) || 1);
                            updateItem({ duration: nextDuration, endYear: startYear + nextDuration - 1 });
                          }}
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">CPI %</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none py-2 px-2 text-foreground" 
                          value={item.cpi} 
                          onChange={e => updateItem({ cpi: parseFloat(e.target.value) || 0 })}
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
                      <div className="md:col-span-12 bg-muted rounded-lg p-3 border border-border">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.useCustomYears}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateItem({ useCustomYears: checked, customYears: checked ? yearRange : item.customYears });
                              }}
                            />
                            <span className="text-sm font-medium">Use manual year selection</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Range: Years {startYear}–{endYear} ({duration} total) • Calendar: {calendarRange[0]}–{calendarRange[calendarRange.length - 1]}
                          </div>
                        </div>

                        {item.useCustomYears && (
                          <div className="mt-3 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => updateItem({ customYears: yearRange })}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-background"
                              >
                                Select all in range
                              </button>
                              <button
                                onClick={() => updateItem({ customYears: [] })}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-background"
                              >
                                Clear selection
                              </button>
                              <button
                                onClick={() => {
                                  const every = Math.max(1, item.recurrenceInterval || 1);
                                  const pattern = yearRange.filter((_, idx) => idx % every === 0);
                                  updateItem({ customYears: pattern });
                                }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-background"
                              >
                                Fill every {Math.max(1, item.recurrenceInterval || 1)} year(s)
                              </button>
                            </div>
                            <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                              {yearRange.map((year, idx) => {
                                const checked = item.customYears.includes(year);
                                const calendarYear = calendarRange[idx];
                                return (
                                  <label key={year} className="flex items-center gap-2 bg-background border border-border rounded-md px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        const next = checked
                                          ? item.customYears.filter((y) => y !== year)
                                          : [...item.customYears, year].sort((a, b) => a - b);
                                        updateItem({ customYears: next });
                                      }}
                                    />
                                    <span>{calendarYear}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
