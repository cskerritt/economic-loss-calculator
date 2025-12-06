import React, { useRef, useState } from 'react';
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { SavedCase } from './forensic/CaseManager';
import { DEFAULT_CASE_INFO, DEFAULT_EARNINGS_PARAMS, DEFAULT_HH_SERVICES, CaseInfo, EarningsParams, HhServices, LcpItem } from './forensic/types';

interface DataImportProps {
  onImport: (savedCase: SavedCase) => void;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  caseName?: string;
}

export const DataImport: React.FC<DataImportProps> = ({ onImport, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseJsonFile = (content: string): SavedCase | null => {
    try {
      const data = JSON.parse(content);
      
      // Check if it's already a SavedCase format
      if (data.caseInfo && data.earningsParams) {
        return {
          id: Date.now().toString(),
          name: data.name || data.caseInfo?.plaintiff || 'Imported Case',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          caseInfo: { ...DEFAULT_CASE_INFO, ...data.caseInfo },
          earningsParams: { ...DEFAULT_EARNINGS_PARAMS, ...data.earningsParams },
          hhServices: { ...DEFAULT_HH_SERVICES, ...data.hhServices },
          lcpItems: data.lcpItems || [],
          pastActuals: data.pastActuals || {},
          isUnionMode: data.isUnionMode || false
        };
      }
      
      // Try to parse as a flat structure
      return {
        id: Date.now().toString(),
        name: data.plaintiff || data.name || 'Imported Case',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        caseInfo: {
          ...DEFAULT_CASE_INFO,
          plaintiff: data.plaintiff || '',
          attorney: data.attorney || '',
          lawFirm: data.lawFirm || '',
          dob: data.dob || data.dateOfBirth || '',
          dateOfInjury: data.dateOfInjury || '',
          dateOfTrial: data.dateOfTrial || '',
          lifeExpectancy: parseFloat(data.lifeExpectancy) || 0,
        },
        earningsParams: {
          ...DEFAULT_EARNINGS_PARAMS,
          baseEarnings: parseFloat(data.baseEarnings || data.preInjuryEarnings) || 0,
          residualEarnings: parseFloat(data.residualEarnings || data.postInjuryEarnings) || 0,
          wle: parseFloat(data.wle || data.workLifeExpectancy) || 0,
          wageGrowth: parseFloat(data.wageGrowth) || 3.0,
          discountRate: parseFloat(data.discountRate) || 4.25,
        },
        hhServices: DEFAULT_HH_SERVICES,
        lcpItems: [],
        pastActuals: {},
        isUnionMode: false
      };
    } catch (e) {
      console.error('JSON parse error:', e);
      return null;
    }
  };

  const parseCsvFile = (content: string): SavedCase | null => {
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const values = lines[1].split(',').map(v => v.trim().replace(/['"]/g, ''));

      const data: Record<string, string> = {};
      headers.forEach((header, i) => {
        data[header] = values[i] || '';
      });

      return {
        id: Date.now().toString(),
        name: data.plaintiff || data.name || 'Imported Case',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        caseInfo: {
          ...DEFAULT_CASE_INFO,
          plaintiff: data.plaintiff || data.name || '',
          attorney: data.attorney || '',
          lawFirm: data.lawfirm || data.law_firm || '',
          dob: data.dob || data.dateofbirth || data.date_of_birth || '',
          dateOfInjury: data.dateofinjury || data.date_of_injury || '',
          dateOfTrial: data.dateoftrial || data.date_of_trial || '',
          lifeExpectancy: parseFloat(data.lifeexpectancy || data.life_expectancy) || 0,
          gender: data.gender || '',
          education: data.education || '',
        },
        earningsParams: {
          ...DEFAULT_EARNINGS_PARAMS,
          baseEarnings: parseFloat(data.baseearnings || data.base_earnings || data.preinjuryearnings) || 0,
          residualEarnings: parseFloat(data.residualearnings || data.residual_earnings || data.postinjuryearnings) || 0,
          wle: parseFloat(data.wle || data.worklifeexpectancy || data.work_life_expectancy) || 0,
          wageGrowth: parseFloat(data.wagegrowth || data.wage_growth) || 3.0,
          discountRate: parseFloat(data.discountrate || data.discount_rate) || 4.25,
        },
        hhServices: DEFAULT_HH_SERVICES,
        lcpItems: [],
        pastActuals: {},
        isUnionMode: false
      };
    } catch (e) {
      console.error('CSV parse error:', e);
      return null;
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setResult(null);

    try {
      const content = await file.text();
      let parsedCase: SavedCase | null = null;

      if (file.name.endsWith('.json')) {
        parsedCase = parseJsonFile(content);
      } else if (file.name.endsWith('.csv')) {
        parsedCase = parseCsvFile(content);
      } else {
        // Try JSON first, then CSV
        parsedCase = parseJsonFile(content) || parseCsvFile(content);
      }

      if (parsedCase) {
        // Save to localStorage
        const existingCases = JSON.parse(localStorage.getItem('fs_saved_cases') || '[]');
        localStorage.setItem('fs_saved_cases', JSON.stringify([...existingCases, parsedCase]));
        
        setResult({
          success: true,
          message: `Successfully imported "${parsedCase.name}"`,
          caseName: parsedCase.name
        });

        // Auto-load the imported case after a brief delay
        setTimeout(() => {
          onImport(parsedCase!);
        }, 1500);
      } else {
        setResult({
          success: false,
          message: 'Could not parse file. Please check the format.'
        });
      }
    } catch (e) {
      setResult({
        success: false,
        message: 'Error reading file. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Case Data
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex justify-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileJson className="w-8 h-8 text-primary" />
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
              </div>
            </div>

            <p className="text-foreground font-medium mb-1">
              {isProcessing ? 'Processing...' : 'Drop file here or click to browse'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JSON and CSV formats
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${
              result.success 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${result.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}`}>
                  {result.message}
                </p>
                {result.success && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Loading case...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Format Help */}
          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Supported formats:</p>
            <p><strong>JSON:</strong> Full case export or simple fields (plaintiff, baseEarnings, wle, etc.)</p>
            <p><strong>CSV:</strong> First row as headers, second row as values</p>
            <p className="mt-2 text-[10px]">
              Required fields: plaintiff, baseEarnings, wle. All other fields are optional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
