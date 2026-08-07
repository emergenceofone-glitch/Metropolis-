import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Users, Coins, Smile, BarChart3, Activity, Bot, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { D3PopulationChart } from './D3PopulationChart';

interface HistoryDataPoint {
  day: number;
  population: number;
  income: number;
  happiness: number;
}

interface CityEfficiencyReportProps {
  history: HistoryDataPoint[];
  initialTab?: 'all' | 'population' | 'income' | 'happiness';
  onClose: () => void;
  onOpenCensus?: () => void;
  onOpenAdvisorAI?: () => void;
  onOpenMarket?: () => void;
}

export const CityEfficiencyReport: React.FC<CityEfficiencyReportProps> = ({ 
  history, 
  initialTab = 'all',
  onClose,
  onOpenCensus,
  onOpenAdvisorAI,
  onOpenMarket
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'population' | 'income' | 'happiness'>(initialTab);

  const recentHistory = history.slice(-30);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">City Efficiency Report</h2>
              <p className="text-xs text-slate-400">Performance analytics & trends over the last 30 game days</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('population')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'population'
                ? 'bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Population</span>
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'income'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Income</span>
          </button>
          <button
            onClick={() => setActiveTab('happiness')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'happiness'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Happiness</span>
          </button>
        </div>

        {/* Chart Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {recentHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
              <BarChart3 className="w-10 h-10 opacity-30 animate-pulse" />
              <p className="text-sm font-medium">Accumulating simulation telemetry...</p>
              <p className="text-xs text-slate-500">Efficiency metrics will populate as simulation days progress.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* D3 Real-Time 10-Day Population Trend Chart */}
              {(activeTab === 'all' || activeTab === 'population') && (
                <D3PopulationChart
                  history={history}
                  currentPopulation={recentHistory[recentHistory.length - 1]?.population || 0}
                  height={240}
                />
              )}

              {/* 30-Day Multi-Metric Area Chart */}
              {activeTab !== 'population' && (
                <div className="h-72 w-full bg-slate-950/40 border border-white/10 rounded-2xl p-4">
                  <div className="text-xs font-mono font-bold text-slate-400 mb-2 uppercase">30-Day Macro Trends</div>
                  <ResponsiveContainer width="100%" height="88%">
                    <AreaChart data={recentHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="popGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="hapGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `Day ${val}`} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                        formatter={(value: any, name: string) => {
                          if (name === 'population') return [value.toLocaleString(), 'Population'];
                          if (name === 'income') return [`$${value.toLocaleString()}`, 'Daily Income'];
                          if (name === 'happiness') return [`${Math.round(value)}%`, 'Happiness'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      {activeTab === 'all' && (
                        <Area type="monotone" dataKey="population" name="Population" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#popGrad)" />
                      )}
                      {(activeTab === 'all' || activeTab === 'income') && (
                        <Area type="monotone" dataKey="income" name="Daily Income ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incGrad)" />
                      )}
                      {(activeTab === 'all' || activeTab === 'happiness') && (
                        <Area type="monotone" dataKey="happiness" name="Happiness (%)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#hapGrad)" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono">Current Population</span>
                    <h4 className="text-lg font-bold font-mono text-white">
                      {recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].population.toLocaleString() : 0}
                    </h4>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono">Avg Daily Income</span>
                    <h4 className="text-lg font-bold font-mono text-white">
                      ${recentHistory.length > 0 ? Math.round(recentHistory.reduce((acc, cur) => acc + cur.income, 0) / recentHistory.length).toLocaleString() : 0}
                    </h4>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-mono">Avg Happiness</span>
                    <h4 className="text-lg font-bold font-mono text-white">
                      {recentHistory.length > 0 ? Math.round(recentHistory.reduce((acc, cur) => acc + cur.happiness, 0) / recentHistory.length) : 0}%
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Tracking window: Last {recentHistory.length} game days</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCensus && (
              <button
                onClick={() => { onClose(); onOpenCensus(); }}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Census</span>
              </button>
            )}

            {onOpenAdvisorAI && (
              <button
                onClick={() => { onClose(); onOpenAdvisorAI(); }}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Advisor AI</span>
              </button>
            )}

            {onOpenMarket && (
              <button
                onClick={() => { onClose(); onOpenMarket(); }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Market</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
