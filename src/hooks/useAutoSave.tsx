import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CaseInfo, EarningsParams, HhServices, LcpItem } from '@/components/forensic/types';

interface CaseData {
  caseInfo: CaseInfo;
  earningsParams: EarningsParams;
  hhServices: HhServices;
  lcpItems: LcpItem[];
  pastActuals: Record<number, string>;
  isUnionMode: boolean;
}

interface UseAutoSaveOptions {
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutoSave(
  caseData: CaseData,
  options: UseAutoSaveOptions = {}
) {
  const { intervalMs = 2 * 60 * 1000, enabled = true } = options; // Default 2 minutes
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeCaseId, setActiveCaseId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fs_active_case_id');
    } catch {
      return null;
    }
  });
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedDataRef = useRef<string>('');
  const dataRef = useRef(caseData);
  
  // Update ref when data changes
  useEffect(() => {
    dataRef.current = caseData;
  }, [caseData]);

  // Persist active case ID
  useEffect(() => {
    if (activeCaseId) {
      localStorage.setItem('fs_active_case_id', activeCaseId);
    } else {
      localStorage.removeItem('fs_active_case_id');
    }
  }, [activeCaseId]);

  const hasChanges = useCallback(() => {
    const currentData = JSON.stringify(dataRef.current);
    return currentData !== lastSavedDataRef.current;
  }, []);

  const autoSave = useCallback(async () => {
    if (!user || !activeCaseId || !enabled || isSaving) return;
    
    if (!hasChanges()) {
      return; // No changes to save
    }

    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          case_info: JSON.parse(JSON.stringify(dataRef.current.caseInfo)),
          earnings_params: JSON.parse(JSON.stringify(dataRef.current.earningsParams)),
          hh_services: JSON.parse(JSON.stringify(dataRef.current.hhServices)),
          lcp_items: JSON.parse(JSON.stringify(dataRef.current.lcpItems)),
          past_actuals: JSON.parse(JSON.stringify(dataRef.current.pastActuals)),
          is_union_mode: dataRef.current.isUnionMode,
        })
        .eq('id', activeCaseId)
        .eq('user_id', user.id);

      if (error) throw error;

      lastSavedDataRef.current = JSON.stringify(dataRef.current);
      setLastAutoSave(new Date());
      
      toast({
        title: 'Auto-saved',
        description: 'Your changes have been synced to the cloud.',
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Silent failure - don't spam the user with error toasts
    } finally {
      setIsSaving(false);
    }
  }, [user, activeCaseId, enabled, isSaving, hasChanges, toast]);

  // Set up auto-save interval
  useEffect(() => {
    if (!user || !activeCaseId || !enabled) return;

    const interval = setInterval(autoSave, intervalMs);
    
    return () => clearInterval(interval);
  }, [user, activeCaseId, enabled, intervalMs, autoSave]);

  // Update last saved ref when case is loaded
  const setActiveCase = useCallback((caseId: string | null, initialData?: CaseData) => {
    setActiveCaseId(caseId);
    if (initialData) {
      lastSavedDataRef.current = JSON.stringify(initialData);
    }
  }, []);

  const clearActiveCase = useCallback(() => {
    setActiveCaseId(null);
    lastSavedDataRef.current = '';
    setLastAutoSave(null);
  }, []);

  return {
    activeCaseId,
    setActiveCase,
    clearActiveCase,
    lastAutoSave,
    isSaving,
    triggerSave: autoSave,
  };
}
