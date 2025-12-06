import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, Users, DollarSign, Briefcase, TrendingUp, Calendar, 
  X, ChevronRight, FileText, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { SavedCase } from './forensic/CaseManager';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  onClose: () => void;
  onLoadCase: (savedCase: SavedCase) => void;
  fmtUSD: (n: number) => string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ onClose, onLoadCase, fmtUSD }) => {
  const [cases, setCases] = useState<SavedCase[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fs_saved_cases');
    if (saved) {
      setCases(JSON.parse(saved));
    }
  }, []);

  const stats = useMemo(() => {
    if (cases.length === 0) {
      return {
        totalCases: 0,
        avgBaseEarnings: 0,
        avgResidualEarnings: 0,
        avgWLE: 0,
        avgLossRate: 0,
        casesWithHousehold: 0,
        casesWithLCP: 0,
        unionCases: 0
      };
    }

    const totalBaseEarnings = cases.reduce((sum, c) => sum + (c.earningsParams?.baseEarnings || 0), 0);
    const totalResidualEarnings = cases.reduce((sum, c) => sum + (c.earningsParams?.residualEarnings || 0), 0);
    const totalWLE = cases.reduce((sum, c) => sum + (c.earningsParams?.wle || 0), 0);
    
    const avgLossRate = totalBaseEarnings > 0 
      ? ((totalBaseEarnings - totalResidualEarnings) / totalBaseEarnings) * 100 
      : 0;

    return {
      totalCases: cases.length,
      avgBaseEarnings: totalBaseEarnings / cases.length,
      avgResidualEarnings: totalResidualEarnings / cases.length,
      avgWLE: totalWLE / cases.length,
      avgLossRate,
      casesWithHousehold: cases.filter(c => c.hhServices?.active).length,
      casesWithLCP: cases.filter(c => (c.lcpItems?.length || 0) > 0).length,
      unionCases: cases.filter(c => c.isUnionMode).length
    };
  }, [cases]);

  const earningsChartData = useMemo(() => {
    return cases.slice(0, 8).map(c => ({
      name: c.caseInfo?.plaintiff?.split(' ')[0] || 'Case',
      preInjury: c.earningsParams?.baseEarnings || 0,
      postInjury: c.earningsParams?.residualEarnings || 0
    }));
  }, [cases]);

  const caseTypeData = useMemo(() => {
    const standard = cases.filter(c => !c.isUnionMode).length;
    const union = cases.filter(c => c.isUnionMode).length;
    return [
      { name: 'Standard', value: standard, color: COLORS[0] },
      { name: 'Union', value: union, color: COLORS[1] }
    ].filter(d => d.value > 0);
  }, [cases]);

  const recentCases = useMemo(() => {
    return [...cases]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [cases]);

  const StatCard = ({ icon: Icon, label, value, subValue, trend }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && <p className="text-[10px] text-muted-foreground mt-1">{subValue}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Case Dashboard
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {cases.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Cases Yet</h3>
              <p className="text-muted-foreground text-sm">
                Save some cases to see summary statistics and analytics here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  icon={Users} 
                  label="Total Cases" 
                  value={stats.totalCases}
                />
                <StatCard 
                  icon={DollarSign} 
                  label="Avg. Pre-Injury Earnings" 
                  value={fmtUSD(stats.avgBaseEarnings)}
                />
                <StatCard 
                  icon={TrendingUp} 
                  label="Avg. Loss Rate" 
                  value={`${stats.avgLossRate.toFixed(1)}%`}
                  trend={stats.avgLossRate > 50 ? 'up' : 'neutral'}
                />
                <StatCard 
                  icon={Calendar} 
                  label="Avg. Work Life Expectancy" 
                  value={`${stats.avgWLE.toFixed(1)} yrs`}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Earnings Comparison Chart */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-foreground mb-4">Earnings Comparison</h3>
                  {earningsChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={earningsChartData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => fmtUSD(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="preInjury" fill="#3b82f6" name="Pre-Injury" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="postInjury" fill="#10b981" name="Post-Injury" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                      No data available
                    </div>
                  )}
                </div>

                {/* Case Type Distribution */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="text-sm font-bold text-foreground mb-4">Case Distribution</h3>
                  <div className="flex items-center gap-6">
                    {caseTypeData.length > 0 ? (
                      <>
                        <ResponsiveContainer width={120} height={120}>
                          <PieChart>
                            <Pie
                              data={caseTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {caseTypeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">
                          {caseTypeData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-foreground">{item.name}</span>
                              <span className="text-sm font-bold text-foreground">{item.value}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
                            <p>Household Services: {stats.casesWithHousehold}</p>
                            <p>Life Care Plans: {stats.casesWithLCP}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                        No data available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Cases */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-4">Recent Cases</h3>
                <div className="space-y-2">
                  {recentCases.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onLoadCase(c); onClose(); }}
                      className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.caseInfo?.plaintiff || 'No plaintiff'} • {fmtUSD(c.earningsParams?.baseEarnings || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.updatedAt).toLocaleDateString()}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
