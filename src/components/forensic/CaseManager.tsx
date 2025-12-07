import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Plus, X, FileText, Upload, BarChart3, Download, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { CaseInfo, EarningsParams, HhServices, LcpItem, DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  isCloud?: boolean;
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
  onOpenImport?: () => void;
  onOpenDashboard?: () => void;
  onCaseSaved?: (caseId: string) => void;
}

export const CaseManager: React.FC<CaseManagerProps> = ({ currentCase, onLoadCase, onNewCase, onOpenImport, onOpenDashboard, onCaseSaved }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [cloudCases, setCloudCases] = useState<SavedCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load cloud cases when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadCloudCases();
    }
  }, [isOpen, user]);

  const loadCloudCases = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const cases: SavedCase[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        caseInfo: row.case_info as unknown as CaseInfo,
        earningsParams: row.earnings_params as unknown as EarningsParams,
        hhServices: row.hh_services as unknown as HhServices,
        lcpItems: row.lcp_items as unknown as LcpItem[],
        pastActuals: row.past_actuals as unknown as Record<number, string>,
        isUnionMode: row.is_union_mode,
        isCloud: true,
      }));

      setCloudCases(cases);
    } catch (error) {
      console.error('Error loading cloud cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cloud cases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToCloud = async () => {
    if (!saveName.trim() || !user) return;
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from('cases')
        .insert([{
          user_id: user.id,
          name: saveName.trim(),
          case_info: JSON.parse(JSON.stringify(currentCase.caseInfo)),
          earnings_params: JSON.parse(JSON.stringify(currentCase.earningsParams)),
          hh_services: JSON.parse(JSON.stringify(currentCase.hhServices)),
          lcp_items: JSON.parse(JSON.stringify(currentCase.lcpItems)),
          past_actuals: JSON.parse(JSON.stringify(currentCase.pastActuals)),
          is_union_mode: currentCase.isUnionMode,
        }])
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: 'Case saved',
        description: 'Your case has been saved to the cloud. Auto-sync is now enabled.',
      });

      // Notify parent about the new case ID for auto-save
      if (data?.id && onCaseSaved) {
        onCaseSaved(data.id);
      }

      setSaveName('');
      setShowSaveDialog(false);
      loadCloudCases();
    } catch (error) {
      console.error('Error saving to cloud:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save case to cloud',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCloudCase = async (caseId: string) => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('cases')
        .update({
          case_info: JSON.parse(JSON.stringify(currentCase.caseInfo)),
          earnings_params: JSON.parse(JSON.stringify(currentCase.earningsParams)),
          hh_services: JSON.parse(JSON.stringify(currentCase.hhServices)),
          lcp_items: JSON.parse(JSON.stringify(currentCase.lcpItems)),
          past_actuals: JSON.parse(JSON.stringify(currentCase.pastActuals)),
          is_union_mode: currentCase.isUnionMode,
        })
        .eq('id', caseId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Case updated',
        description: 'Your case has been updated in the cloud.',
      });

      loadCloudCases();
    } catch (error) {
      console.error('Error updating cloud case:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update case',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCloudCase = async (caseId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Case deleted',
        description: 'Case has been removed from the cloud.',
      });

      loadCloudCases();
    } catch (error) {
      console.error('Error deleting cloud case:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete case',
        variant: 'destructive',
      });
    }
  };

  const loadCase = (caseToLoad: SavedCase) => {
    onLoadCase(caseToLoad);
    setIsOpen(false);
  };

  const exportCase = (caseToExport: SavedCase) => {
    const blob = new Blob([JSON.stringify(caseToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caseToExport.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Case Manager</h2>
                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3" />
                  Cloud Sync
                </span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(85vh-80px)]">
              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  <Cloud className="w-4 h-4" /> Save to Cloud
                </button>
                <button
                  onClick={() => { onNewCase(); setIsOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  <Plus className="w-4 h-4" /> New Case
                </button>
                {onOpenImport && (
                  <button
                    onClick={() => { setIsOpen(false); onOpenImport(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
                  >
                    <Upload className="w-4 h-4" /> Import
                  </button>
                )}
                {onOpenDashboard && (
                  <button
                    onClick={() => { setIsOpen(false); onOpenDashboard(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600"
                  >
                    <BarChart3 className="w-4 h-4" /> Dashboard
                  </button>
                )}
                <button
                  onClick={loadCloudCases}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                      onClick={saveToCloud}
                      disabled={!saveName.trim() || saving}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                      Save to Cloud
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

              {/* Cloud Cases List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    Cloud Cases ({cloudCases.length})
                  </h3>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : cloudCases.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <CloudOff className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No cloud cases yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Save your first case to access it anywhere</p>
                  </div>
                ) : (
                  cloudCases.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                          <Cloud className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {c.caseInfo.plaintiff || 'No plaintiff'} • {new Date(c.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => loadCase(c)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => updateCloudCase(c.id)}
                          disabled={saving}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                          title="Update with current data"
                        >
                          <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => exportCase(c)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded"
                          title="Export as JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCloudCase(c.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                          title="Delete"
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
