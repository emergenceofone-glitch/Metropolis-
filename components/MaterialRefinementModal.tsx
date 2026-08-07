import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Factory, 
  Building2, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Bot, 
  Coins, 
  Users, 
  CloudRain, 
  Flame, 
  Sliders,
  Layers,
  ArrowRight,
  LineChart as LineChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { MaterialRefinementState, Grid, BuildingType, RefinementHistoryPoint } from '../types';

interface MaterialRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  refinementState: MaterialRefinementState;
  grid: Grid;
  playerMoney: number;
  onTriggerSurge?: () => void;
  onOpenAdvisorAI?: () => void;
  onOpenMarket?: () => void;
  onOpenCensus?: () => void;
  onOpenEfficiencyReport?: () => void;
  onOpenWeatherForecast?: () => void;
}

export const MaterialRefinementModal: React.FC<MaterialRefinementModalProps> = ({
  isOpen,
  onClose,
  refinementState,
  grid,
  playerMoney,
  onTriggerSurge,
  onOpenAdvisorAI,
  onOpenMarket,
  onOpenCensus,
  onOpenEfficiencyReport,
  onOpenWeatherForecast
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'pipeline' | 'buildings' | 'benefits'>('analytics');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Ensure chart data exists even on game start
  const rawHistory = refinementState.history || [];
  const chartData: RefinementHistoryPoint[] = rawHistory.length >= 2 ? rawHistory : [
    { day: 1, production: Math.max(0, refinementState.refinedAetheriumProduction - 10), demand: Math.max(0, refinementState.refinedAetheriumDemand - 5), netBalance: refinementState.refinedAetheriumProduction - refinementState.refinedAetheriumDemand, qolBonusPercent: Math.round((refinementState.qualityOfLifeMultiplier - 1) * 100) },
    { day: 2, production: refinementState.refinedAetheriumProduction, demand: refinementState.refinedAetheriumDemand, netBalance: refinementState.refinedAetheriumProduction - refinementState.refinedAetheriumDemand, qolBonusPercent: Math.round((refinementState.qualityOfLifeMultiplier - 1) * 100) }
  ];

  // Extract specific industrial and commercial tiles for breakdown
  const industrialTiles: { x: number; y: number; level: number; output: number }[] = [];
  const commercialTiles: { x: number; y: number; level: number; demand: number }[] = [];

  grid.flat().forEach(tile => {
    if (tile.buildingType === BuildingType.Industrial) {
      const lvl = tile.level || 1;
      industrialTiles.push({
        x: tile.x,
        y: tile.y,
        level: lvl,
        output: lvl * 10
      });
    } else if (tile.buildingType === BuildingType.Commercial) {
      const lvl = tile.level || 1;
      if (lvl >= 2) {
        commercialTiles.push({
          x: tile.x,
          y: tile.y,
          level: lvl,
          demand: (lvl - 1) * 15
        });
      }
    }
  });

  const qolPercent = Math.round((refinementState.qualityOfLifeMultiplier - 1.0) * 100);
  const surgeCost = 500;
  const canAffordSurge = playerMoney >= surgeCost;

  const handleSurge = () => {
    if (!canAffordSurge) {
      setActionFeedback('Insufficient funds! Needs $500 treasury reserve.');
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    if (onTriggerSurge) {
      onTriggerSurge();
      setActionFeedback('⚡ Refinement Surge Initiated! Output & QoL multiplier boosted by +20% for 5 days!');
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-400/40 rounded-xl text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-mono font-bold text-white tracking-wide">
                  Material Refinement Pipeline
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase">
                  {refinementState.purityTier} Grade
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Industrial Output ➔ High-Level Commercial Synergy ➔ Quality of Life Multiplier
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Toast */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cyan-500/20 border-b border-cyan-500/40 px-6 py-2 text-cyan-200 text-xs font-mono font-bold flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{actionFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Summary Dashboard Metrics */}
        <div className="p-6 bg-slate-950/60 border-b border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Factory className="w-3.5 h-3.5 text-amber-400" />
              <span>Industrial Output</span>
            </div>
            <div className="text-lg font-mono font-bold text-amber-300 flex items-baseline gap-1">
              <span>{refinementState.refinedAetheriumProduction}</span>
              <span className="text-[10px] text-slate-400">Units/Tick</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {refinementState.industrialBuildingCount} Active Factories
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Commercial Demand</span>
            </div>
            <div className="text-lg font-mono font-bold text-cyan-300 flex items-baseline gap-1">
              <span>{refinementState.refinedAetheriumDemand}</span>
              <span className="text-[10px] text-slate-400">Units/Tick</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {refinementState.commercialHubCount} L2+ Commercial Hubs
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supply Satisfaction</span>
            </div>
            <div className="text-lg font-mono font-bold text-emerald-300">
              {Math.round(refinementState.satisfactionRatio * 100)}%
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {refinementState.satisfactionRatio >= 1 ? 'Fully Satisfied' : 'Deficit Active'}
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-cyan-950/60 to-purple-950/60 border border-cyan-400/40 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>QoL Multiplier</span>
            </div>
            <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
              <span className="text-cyan-300">+{qolPercent}%</span>
              <span className="text-[10px] text-slate-300">({refinementState.qualityOfLifeMultiplier.toFixed(2)}x)</span>
            </div>
            <div className="text-[10px] font-mono text-purple-300">
              Citywide Income & Stats Boost
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 bg-slate-900 border-b border-white/10 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-cyan-300 border-t border-x border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Resource Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'bg-slate-800 text-cyan-300 border-t border-x border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Refinement Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('buildings')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'buildings'
                ? 'bg-slate-800 text-cyan-300 border-t border-x border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Factory & Hub Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-4 py-2 text-xs font-mono font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'benefits'
                ? 'bg-slate-800 text-cyan-300 border-t border-x border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>QoL Citywide Impact</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                    <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                      Refined Aetherium Input / Output Telemetry
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time monitoring of industrial supply output vs. commercial synthesis demand trends.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400">Net Flow Rate:</span>
                  <span className={`font-bold ${refinementState.refinedAetheriumProduction >= refinementState.refinedAetheriumDemand ? 'text-emerald-400' : 'text-red-400'}`}>
                    {refinementState.refinedAetheriumProduction - refinementState.refinedAetheriumDemand >= 0 ? '+' : ''}
                    {refinementState.refinedAetheriumProduction - refinementState.refinedAetheriumDemand} Units/Tick
                  </span>
                </div>
              </div>

              {/* Main Chart Area */}
              <div className="p-5 bg-slate-950/90 border border-cyan-500/30 rounded-2xl space-y-4 relative shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
                    <LineChartIcon className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Supply & Demand Trends</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                      <span className="text-slate-300">Industrial Output (Supply)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                      <span className="text-slate-300">Commercial Demand (Input)</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#94a3b8" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                        tickFormatter={(val) => `Day ${val}`}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#334155', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                        labelFormatter={(label) => `Cycle Day ${label}`}
                        formatter={(value: any, name: any) => {
                          if (name === 'production') return [`+${value} Units`, 'Industrial Supply'];
                          if (name === 'demand') return [`-${value} Units`, 'Commercial Input'];
                          if (name === 'netBalance') return [`${value >= 0 ? '+' : ''}${value} Units`, 'Net Balance'];
                          if (name === 'qolBonusPercent') return [`+${value}%`, 'QoL Multiplier'];
                          return [value, name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="production" 
                        stroke="#fbbf24" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorProduction)" 
                        name="production"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="demand" 
                        stroke="#06b6d4" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorDemand)" 
                        name="demand"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="netBalance" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#10b981' }}
                        name="netBalance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Industrial Scaling Recommendation Engine */}
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 uppercase">
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>Industrial Scaling Directive & Recommendations</span>
                </div>

                {refinementState.refinedAetheriumProduction < refinementState.refinedAetheriumDemand ? (
                  <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Deficit Detected: Expand Industrial Refinement</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Commercial synthesis demand ({refinementState.refinedAetheriumDemand} units) currently exceeds industrial supply ({refinementState.refinedAetheriumProduction} units). 
                      Your Quality of Life multiplier is limited to <span className="text-red-300 font-bold">+{qolPercent}%</span>.
                    </p>
                    <div className="text-[11px] font-mono text-red-200 bg-red-900/40 p-2 rounded-lg border border-red-500/30">
                      <strong>Action Item:</strong> Construct at least {Math.ceil((refinementState.refinedAetheriumDemand - refinementState.refinedAetheriumProduction) / 10)} additional Industrial Factory tile(s) or upgrade existing ones to close the deficit.
                    </div>
                  </div>
                ) : refinementState.refinedAetheriumDemand === 0 && refinementState.refinedAetheriumProduction > 0 ? (
                  <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Surplus Output: Upgrade Commercial Hubs to Level 2+</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      You are producing <span className="text-amber-300 font-bold">{refinementState.refinedAetheriumProduction} Refined Aetherium</span> per tick, but no Commercial Hubs are level 2+ to synthesize it into citywide QoL bonuses.
                    </p>
                    <div className="text-[11px] font-mono text-cyan-200 bg-cyan-900/40 p-2 rounded-lg border border-cyan-500/30">
                      <strong>Action Item:</strong> Click on Commercial tiles and upgrade them to Level 2 or Level 3 to activate high-value QoL synthesis.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Optimal Refinement Balance Achieved</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Supply ({refinementState.refinedAetheriumProduction}) safely meets synthesis demand ({refinementState.refinedAetheriumDemand}). 
                      Citywide Quality of Life bonus is optimized at <span className="text-emerald-300 font-bold">+{qolPercent}%</span> (+{(refinementState.qualityOfLifeMultiplier - 1.0).toFixed(2)}x boost).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              {/* Visual Pipeline Flowchart */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl relative overflow-hidden">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Refinement Supply Chain Flowchart</span>
                  <span className="text-cyan-400 text-[11px] font-normal">Real-Time Synthesis</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Step 1: Industrial Production */}
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2 relative">
                    <div className="flex items-center justify-between text-amber-300 text-xs font-mono font-bold">
                      <span className="flex items-center gap-1.5">
                        <Factory className="w-4 h-4 text-amber-400" /> Step 1: Refinement
                      </span>
                      <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200">
                        {refinementState.industrialBuildingCount} Factories
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Industrial buildings refine atmospheric Aetherium ore into <strong>Refined Aetherium</strong> units. Higher level factories produce greater volumes.
                    </p>
                    <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Current Output:</span>
                      <span className="text-amber-300 font-bold">+{refinementState.refinedAetheriumProduction} / tick</span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden md:flex flex-col items-center justify-center text-cyan-400 space-y-1">
                    <ArrowRight className="w-6 h-6 animate-pulse" />
                    <span className="text-[10px] font-mono text-cyan-300">Refined Feed</span>
                  </div>

                  {/* Step 2: Commercial Synergy */}
                  <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-cyan-300 text-xs font-mono font-bold">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-cyan-400" /> Step 2: Combination
                      </span>
                      <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-200">
                        Level 2+ Commercial
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      High-level Commercial Hubs combine Refined Aetherium to produce high-value consumer goods, medical tech, and automated luxury amenities.
                    </p>
                    <div className="pt-2 border-t border-cyan-500/20 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Demand Satisfied:</span>
                      <span className="text-cyan-300 font-bold">{Math.round(refinementState.satisfactionRatio * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Final Output Banner */}
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-950/40 via-purple-950/40 to-cyan-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-white">
                        Result: Quality of Life (QoL) Multiplier Active
                      </div>
                      <div className="text-[11px] text-slate-300 font-sans">
                        Boosts total tax revenue, citizens' happiness rating, and metropolitan population growth.
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-lg font-bold text-emerald-300">+{qolPercent}% Stat Boost</div>
                    <div className="text-[10px] text-slate-400">{refinementState.qualityOfLifeMultiplier.toFixed(2)}x Scale</div>
                  </div>
                </div>
              </div>

              {/* Refinement Surge & Directive Booster Card */}
              <div className="p-5 bg-gradient-to-r from-purple-950/50 via-slate-900 to-cyan-950/50 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
                    <h3 className="text-sm font-mono font-bold text-white">
                      Mayoral Refinement Surge Directive
                    </h3>
                    {refinementState.surgeActive && (
                      <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono rounded font-bold">
                        Surge Active ({refinementState.surgeDaysRemaining} days remaining)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl font-sans">
                    Inject emergency capital into industrial synthesis facilities to supercharge Refined Aetherium output and grant an immediate <strong>+20% Quality of Life multiplier boost</strong> for 5 days.
                  </p>
                </div>

                <button
                  onClick={handleSurge}
                  disabled={refinementState.surgeActive}
                  className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    refinementState.surgeActive
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : canAffordSurge
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{refinementState.surgeActive ? 'Surge Active' : 'Trigger Surge ($500)'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'buildings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industrial Output List */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-amber-400" /> Active Industrial Refineries ({industrialTiles.length})
                    </span>
                    <span>Total: +{refinementState.refinedAetheriumProduction} Units</span>
                  </div>

                  {industrialTiles.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono space-y-1">
                      <p>No Industrial buildings built yet.</p>
                      <p className="text-[11px] text-amber-400/80">Construct Industrial factories to produce Refined Aetherium!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {industrialTiles.map((tile, i) => (
                        <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-white font-bold">Industrial Factory</span>
                            <span className="text-slate-400 ml-2">({tile.x + 1}, {tile.y + 1})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                              Lvl {tile.level}
                            </span>
                            <span className="text-amber-400 font-bold">+{tile.output} Refined</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Commercial Synergy Hub List */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-cyan-400" /> Commercial Synthesis Hubs ({commercialTiles.length})
                    </span>
                    <span>Demand: {refinementState.refinedAetheriumDemand} Units</span>
                  </div>

                  {commercialTiles.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500 font-mono space-y-1">
                      <p>No Level 2+ Commercial buildings available.</p>
                      <p className="text-[11px] text-cyan-400/80">Upgrade Commercial buildings to Level 2 or higher to synthesize QoL goods!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                      {commercialTiles.map((tile, i) => (
                        <div key={i} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                          <div>
                            <span className="text-white font-bold">Commercial Hub</span>
                            <span className="text-slate-400 ml-2">({tile.x + 1}, {tile.y + 1})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/30">
                              Lvl {tile.level}
                            </span>
                            <span className="text-cyan-300 font-bold">{tile.demand} Demand</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benefits' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  Quality of Life (QoL) Multiplier Impact Breakdown
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                      <Coins className="w-4 h-4" /> Treasury Revenue
                    </div>
                    <div className="text-sm font-mono text-white font-bold">
                      +{qolPercent}% Effective Tax Yield
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Refined consumer goods drive commercial transaction volume and citizen spending.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Population Growth
                    </div>
                    <div className="text-sm font-mono text-white font-bold">
                      +{qolPercent}% Growth Velocity
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Superior quality of life attracts migrant citizens from neighboring districts.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-mono text-purple-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Citizen Happiness
                    </div>
                    <div className="text-sm font-mono text-white font-bold">
                      +{Math.round(qolPercent * 0.4)} Base Satisfaction
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Automated luxury amenities elevate civic morale and overall approval rating.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Quick Action Navigation */}
        <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cyan-300">Material Refinement Active</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenMarket && (
              <button
                onClick={() => { onClose(); onOpenMarket(); }}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Market</span>
              </button>
            )}

            {onOpenCensus && (
              <button
                onClick={() => { onClose(); onOpenCensus(); }}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Census</span>
              </button>
            )}

            {onOpenEfficiencyReport && (
              <button
                onClick={() => { onClose(); onOpenEfficiencyReport(); }}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Report</span>
              </button>
            )}

            {onOpenWeatherForecast && (
              <button
                onClick={() => { onClose(); onOpenWeatherForecast(); }}
                className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Weather</span>
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

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Close Refinement
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
