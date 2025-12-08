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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Life Care Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">Future cost of healthcare services and needs</p>
      </div>

      <Card>
        <div className="p-3 sm:p-4 border-b border-border bg-muted flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <HeartPulse className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-bold text-foreground text-sm sm:text-base">LCP Items</h3>
              <p className="text-xs text-muted-foreground">{lcpItems.length} items configured</p>
            </div>
          </div>
          <button 
            onClick={addItem}
            className="bg-primary text-primary-foreground px-4 py-3 sm:py-2 rounded-full text-sm hover:bg-primary/90 flex gap-2 items-center justify-center shadow-lg transform active:scale-95 transition-all min-h-[44px] touch-manipulation"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        
        <div className="p-3 sm:p-4">
          {lcpItems.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground">
              <HeartPulse className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-30" />
              <p className="text-base sm:text-lg">No life care plan items yet</p>
              <p className="text-sm mt-1">Click "Add Item" to begin building the life care plan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lcpItems.map(item => {
                const itemData = lcpData.items.find(i => i.id === item.id);
                const startYear = Math.max(1, item.startYear || 1);
                const endYear = Math.max(startYear, item.endYear || startYear + item.duration - 1);
                const duration = Math.max(1, endYear - startYear + 1);
                const yearRange = Array.from({ length: Math.min(200, duration) }, (_, idx) => startYear + idx);
                const calendarRange = yearRange.map((yr) => safeBaseYear + (yr - 1));
                const updateItem = (changes: Partial<LcpItem>) => setLcpItems(lcpItems.map(i => i.id === item.id ? { ...i, ...changes } : i));
                return (
                  <div key={item.id} className="relative bg-card border border-border p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    {/* Mobile: Stack vertically, Desktop: Grid */}
                    <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-end">
                      {/* Row 1: Category & Description - Full width on mobile */}
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Category</label>
                        <select 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-3 focus:ring-1 focus:ring-primary text-foreground touch-manipulation" 
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
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Description</label>
                        <input 
                          className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-3 text-foreground touch-manipulation" 
                          value={item.name} 
                          onChange={e => updateItem({ name: e.target.value })}
                        />
                      </div>
                      
                      {/* Row 2: Cost & Frequency - 2 columns on mobile */}
                      <div className="grid grid-cols-2 gap-2 md:contents">
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Cost ($)</label>
                          <input 
                            type="number" 
                            inputMode="decimal"
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-3 text-foreground touch-manipulation" 
                            value={item.baseCost} 
                            onChange={e => updateItem({ baseCost: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Frequency</label>
                          <select 
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-3 text-foreground touch-manipulation" 
                            value={item.freqType} 
                            onChange={e => updateItem({ freqType: e.target.value })}
                          >
                            <option value="annual">Annual</option>
                            <option value="onetime">One Time</option>
                            <option value="recurring">Recurring (Every X Yrs)</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Row 3: Year controls - 4 columns on mobile, grid on desktop */}
                      <div className="grid grid-cols-4 gap-2 md:contents">
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Every X</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-2 text-foreground touch-manipulation"
                            value={item.recurrenceInterval}
                            onChange={e => updateItem({ recurrenceInterval: Math.max(1, parseInt(e.target.value) || 1) })}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Start</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-2 text-foreground touch-manipulation"
                            value={startYear}
                            onChange={e => {
                              const nextStart = Math.max(1, parseInt(e.target.value) || 1);
                              const nextEnd = Math.max(nextStart, endYear);
                              updateItem({ startYear: nextStart, endYear: nextEnd, duration: Math.max(1, nextEnd - nextStart + 1) });
                            }}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">End</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-2 text-foreground touch-manipulation"
                            value={endYear}
                            onChange={e => {
                              const nextEnd = Math.max(startYear, parseInt(e.target.value) || startYear);
                              updateItem({ endYear: nextEnd, duration: Math.max(1, nextEnd - startYear + 1) });
                            }}
                          />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">Yrs</label>
                          <input 
                            type="number"
                            inputMode="numeric" 
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-2 text-foreground touch-manipulation" 
                            value={item.duration} 
                            onChange={e => {
                              const nextDuration = Math.max(1, parseInt(e.target.value) || 1);
                              updateItem({ duration: nextDuration, endYear: startYear + nextDuration - 1 });
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Row 4: CPI & PV/Delete - flex on mobile */}
                      <div className="flex items-end gap-2 md:contents">
                        <div className="flex-1 md:col-span-1">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">CPI %</label>
                          <input 
                            type="number"
                            inputMode="decimal" 
                            step="0.01" 
                            className="w-full text-sm font-medium bg-muted rounded-lg border-none min-h-[44px] py-2.5 px-3 text-foreground touch-manipulation" 
                            value={item.cpi} 
                            onChange={e => updateItem({ cpi: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-2 md:col-span-1 md:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-muted-foreground block">PV</span>
                            <span className="text-sm font-bold text-primary">{fmtUSD(itemData?.totalPV || 0)}</span>
                          </div>
                          <button 
                            onClick={() => setLcpItems(lcpItems.filter(i => i.id !== item.id))} 
                            className="text-muted-foreground hover:text-destructive p-3 min-h-[44px] min-w-[44px] rounded-lg hover:bg-destructive/10 transition-colors flex items-center justify-center touch-manipulation active:scale-95"
                            aria-label="Delete item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      {/* Custom Years Section - Full width */}
                      <div className="md:col-span-12 bg-muted rounded-lg p-3 border border-border mt-2 md:mt-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={item.useCustomYears}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateItem({ useCustomYears: checked, customYears: checked ? yearRange : item.customYears });
                              }}
                              className="w-5 h-5 rounded touch-manipulation"
                            />
                            <span className="text-sm font-medium">Use manual year selection</span>
                          </label>
                          <div className="text-xs text-muted-foreground">
                            Years {startYear}–{endYear} ({duration} yrs) • {calendarRange[0]}–{calendarRange[calendarRange.length - 1]}
                          </div>
                        </div>

                        {item.useCustomYears && (
                          <div className="mt-3 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => updateItem({ customYears: yearRange })}
                                className="px-4 py-2.5 min-h-[40px] text-xs rounded-lg border border-border hover:bg-background touch-manipulation active:scale-95"
                              >
                                Select all
                              </button>
                              <button
                                onClick={() => updateItem({ customYears: [] })}
                                className="px-4 py-2.5 min-h-[40px] text-xs rounded-lg border border-border hover:bg-background touch-manipulation active:scale-95"
                              >
                                Clear
                              </button>
                              <button
                                onClick={() => {
                                  const every = Math.max(1, item.recurrenceInterval || 1);
                                  const pattern = yearRange.filter((_, idx) => idx % every === 0);
                                  updateItem({ customYears: pattern });
                                }}
                                className="px-4 py-2.5 min-h-[40px] text-xs rounded-lg border border-border hover:bg-background touch-manipulation active:scale-95"
                              >
                                Every {Math.max(1, item.recurrenceInterval || 1)} yr
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
                              {yearRange.map((year, idx) => {
                                const checked = item.customYears.includes(year);
                                const calendarYear = calendarRange[idx];
                                return (
                                  <label key={year} className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2.5 min-h-[40px] cursor-pointer touch-manipulation">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      className="w-4 h-4"
                                      onChange={() => {
                                        const next = checked
                                          ? item.customYears.filter((y) => y !== year)
                                          : [...item.customYears, year].sort((a, b) => a - b);
                                        updateItem({ customYears: next });
                                      }}
                                    />
                                    <span className="font-medium">{calendarYear}</span>
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
