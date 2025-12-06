import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Plus, X, FileText } from 'lucide-react';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES } from './types';

export interface SavedCase {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  hhServices: HhServices;
  lcpItems: LcpItem[];
  pastActuals: Record<number, string>;
  isUnionMode: boolean;
}

interface CaseManagerProps {
  currentCase: {
    caseInfo: CaseInfo;
    earningsParams: EarningsParams;
    hhServices: HhServices;
    lcpItems: LcpItem[];
    pastActuals: Record<number, string>;
    isUnionMode: boolean;
  };
  onLoadCase: (savedCase: SavedCase) => void;
  onNewCase: () => void;
}

export const CaseManager: React.FC<CaseManagerProps> = ({ currentCase, onLoadCase, onNewCase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const getSavedCases = (): SavedCase[] => {
    const saved = localStorage.getItem('fs_saved_cases');
    return saved ? JSON.parse(saved) : [];
  };

  const [savedCases, setSavedCases] = useState<SavedCase[]>(getSavedCases);

  const saveCurrentCase = () => {
    if (!saveName.trim()) return;

    const newCase: SavedCase = {
      id: Date.now().toString(),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...currentCase
    };

    const updated = [...savedCases, newCase];
    localStorage.setItem('fs_saved_cases', JSON.stringify(updated));
    setSavedCases(updated);
    setSaveName('');
    setShowSaveDialog(false);
  };

  const deleteCase = (id: string) => {
    const updated = savedCases.filter(c => c.id !== id);
    localStorage.setItem('fs_saved_cases', JSON.stringify(updated));
    setSavedCases(updated);
  };

  const loadCase = (savedCase: SavedCase) => {
    onLoadCase(savedCase);
    setIsOpen(false);
  };

  const loadSampleCases = () => {
    const sampleCases: SavedCase[] = [
      {
        id: 'sample_1',
        name: 'Johnson v. ABC Corp - Construction Worker',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        caseInfo: {
          ...DEFAULT_CASE_INFO,
          plaintiff: 'Michael Johnson',
          attorney: 'Sarah Mitchell',
          lawFirm: 'Mitchell & Associates',
          gender: 'Male',
          dob: '1978-06-15',
          education: 'High School Diploma',
          dateOfInjury: '2023-03-10',
          dateOfTrial: '2025-06-15',
          lifeExpectancy: 38.5,
          medicalSummary: 'Plaintiff sustained a severe lumbar spine injury requiring surgical fusion. Permanent restrictions include no lifting over 10 lbs, limited standing and walking.',
          employmentHistory: 'Plaintiff worked as a journeyman carpenter for 18 years with consistent employment history.',
        },
        earningsParams: {
          ...DEFAULT_EARNINGS_PARAMS,
          baseEarnings: 85000,
          residualEarnings: 25000,
          wle: 18.5,
          wageGrowth: 3.2,
          discountRate: 4.0,
        },
        hhServices: { ...DEFAULT_HH_SERVICES, active: true, hoursPerWeek: 8, hourlyRate: 28 },
        lcpItems: [
          { id: 1, categoryId: 'therapy', name: 'Physical Therapy (ongoing)', baseCost: 4800, freqType: 'annual', duration: 20, startYear: 0, cpi: 1.62, recurrenceInterval: 1 },
          { id: 2, categoryId: 'rx', name: 'Pain Management Medications', baseCost: 2400, freqType: 'annual', duration: 38, startYear: 0, cpi: 1.65, recurrenceInterval: 1 },
        ],
        pastActuals: {},
        isUnionMode: false
      },
      {
        id: 'sample_2',
        name: 'Smith v. Metro Transit - Bus Driver',
        createdAt: '2024-02-01T09:00:00Z',
        updatedAt: '2024-02-10T16:45:00Z',
        caseInfo: {
          ...DEFAULT_CASE_INFO,
          plaintiff: 'Robert Smith',
          attorney: 'David Chen',
          lawFirm: 'Chen Legal Group',
          gender: 'Male',
          dob: '1970-11-22',
          education: 'Some College',
          dateOfInjury: '2022-08-05',
          dateOfTrial: '2025-03-20',
          lifeExpectancy: 28.3,
          medicalSummary: 'Traumatic brain injury and cervical spine damage from motor vehicle collision. Cognitive impairment affecting memory and concentration.',
          employmentHistory: 'Plaintiff was employed as a transit bus driver for 22 years with an excellent safety record.',
        },
        earningsParams: {
          ...DEFAULT_EARNINGS_PARAMS,
          baseEarnings: 72000,
          residualEarnings: 0,
          wle: 12.8,
          wageGrowth: 3.5,
          discountRate: 4.25,
        },
        hhServices: { ...DEFAULT_HH_SERVICES, active: true, hoursPerWeek: 15, hourlyRate: 30 },
        lcpItems: [
          { id: 1, categoryId: 'evals', name: 'Neurological Follow-up', baseCost: 3500, freqType: 'annual', duration: 28, startYear: 0, cpi: 2.88, recurrenceInterval: 1 },
          { id: 2, categoryId: 'therapy', name: 'Cognitive Rehabilitation', baseCost: 12000, freqType: 'annual', duration: 5, startYear: 0, cpi: 1.62, recurrenceInterval: 1 },
        ],
        pastActuals: {},
        isUnionMode: true
      },
      {
        id: 'sample_3',
        name: 'Garcia v. Industrial Corp - Union Electrician',
        createdAt: '2024-03-05T11:30:00Z',
        updatedAt: '2024-03-12T10:15:00Z',
        caseInfo: {
          ...DEFAULT_CASE_INFO,
          plaintiff: 'Maria Garcia',
          attorney: 'Jennifer Walsh',
          lawFirm: 'Walsh & Partners',
          gender: 'Female',
          dob: '1982-04-08',
          education: 'Vocational/Technical Certificate',
          dateOfInjury: '2023-01-18',
          dateOfTrial: '2025-09-10',
          lifeExpectancy: 45.2,
          medicalSummary: 'Electrical burn injuries to hands and arms requiring multiple surgeries. Permanent dexterity limitations.',
          employmentHistory: 'Licensed union electrician with IBEW Local 3 for 14 years. Master electrician certification.',
        },
        earningsParams: {
          ...DEFAULT_EARNINGS_PARAMS,
          baseEarnings: 115000,
          residualEarnings: 35000,
          wle: 22.5,
          pension: 8500,
          healthWelfare: 15000,
          annuity: 5000,
        },
        hhServices: DEFAULT_HH_SERVICES,
        lcpItems: [
          { id: 1, categoryId: 'surgery', name: 'Future Reconstructive Surgery', baseCost: 45000, freqType: 'onetime', duration: 1, startYear: 3, cpi: 4.07, recurrenceInterval: 0 },
          { id: 2, categoryId: 'therapy', name: 'Occupational Therapy', baseCost: 6000, freqType: 'annual', duration: 10, startYear: 0, cpi: 1.62, recurrenceInterval: 1 },
        ],
        pastActuals: {},
        isUnionMode: true
      }
    ];

    const existing = getSavedCases();
    const existingIds = new Set(existing.map(c => c.id));
    const newCases = sampleCases.filter(c => !existingIds.has(c.id));
    
    if (newCases.length > 0) {
      const updated = [...existing, ...newCases];
      localStorage.setItem('fs_saved_cases', JSON.stringify(updated));
      setSavedCases(updated);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium shadow-sm"
      >
        <FolderOpen className="w-4 h-4" />
        <span className="hidden sm:inline">Cases</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Case Manager</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  <Save className="w-4 h-4" /> Save Current Case
                </button>
                <button
                  onClick={() => { onNewCase(); setIsOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  <Plus className="w-4 h-4" /> New Case
                </button>
                <button
                  onClick={loadSampleCases}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"
                >
                  <FileText className="w-4 h-4" /> Load Samples
                </button>
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="Enter case name..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveCurrentCase}
                      disabled={!saveName.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setShowSaveDialog(false); setSaveName(''); }}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Cases List */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase text-muted-foreground">Saved Cases ({savedCases.length})</h3>
                {savedCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No saved cases yet</p>
                ) : (
                  savedCases.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.caseInfo.plaintiff || 'No plaintiff'} • {new Date(c.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadCase(c)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteCase(c.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const getDefaultCaseData = () => ({
  caseInfo: DEFAULT_CASE_INFO,
  earningsParams: DEFAULT_EARNINGS_PARAMS,
  hhServices: DEFAULT_HH_SERVICES,
  lcpItems: [] as LcpItem[],
  pastActuals: {} as Record<number, string>,
  isUnionMode: false
});
