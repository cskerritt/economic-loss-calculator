import React, { useState, useEffect } from 'react';
import { History, FileText, FileDown, Download, Trash2, X, ChevronDown } from 'lucide-react';

export interface ExportRecord {
  id: string;
  timestamp: Date;
  type: 'pdf' | 'word' | 'print';
  plaintiffName: string;
  grandTotal: number;
}

interface ExportHistoryProps {
  fmtUSD: (n: number) => string;
}

const STORAGE_KEY = 'fs_export_history';

export function getExportHistory(): ExportRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map((r: any) => ({
      ...r,
      timestamp: new Date(r.timestamp)
    }));
  } catch {
    return [];
  }
}

export function addExportRecord(record: Omit<ExportRecord, 'id' | 'timestamp'>): void {
  const history = getExportHistory();
  const newRecord: ExportRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: new Date()
  };
  // Keep last 20 records
  const updated = [newRecord, ...history].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearExportHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const ExportHistory: React.FC<ExportHistoryProps> = ({ fmtUSD }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ExportRecord[]>([]);

  useEffect(() => {
    setHistory(getExportHistory());
  }, [isOpen]);

  const handleClear = () => {
    clearExportHistory();
    setHistory([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: ExportRecord['type']) => {
    switch (type) {
      case 'pdf': return <FileDown className="w-3.5 h-3.5 text-rose-500" />;
      case 'word': return <Download className="w-3.5 h-3.5 text-blue-500" />;
      case 'print': return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: ExportRecord['type']) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'word': return 'Word';
      case 'print': return 'Print';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        <History className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">History</span>
        {history.length > 0 && (
          <span className="bg-primary/20 text-primary text-[10px] px-1.5 rounded-full font-medium">
            {history.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <h3 className="font-bold text-sm text-foreground">Export History</h3>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No exports yet</p>
                  <p className="text-xs mt-1">Your export history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((record) => (
                    <div key={record.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {getTypeIcon(record.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {record.plaintiffName || 'Unnamed Case'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getTypeLabel(record.type)} • {fmtUSD(record.grandTotal)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatTime(record.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {history.length > 0 && (
              <div className="px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground text-center">
                Showing last {history.length} export{history.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
