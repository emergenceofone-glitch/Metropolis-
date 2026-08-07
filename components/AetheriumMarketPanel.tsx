import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe,
  Coins,
  Building2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Flame,
  Info,
  DollarSign,
  BarChart2,
  Bot,
  Users,
  LineChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AetheriumMarketState, GlobalMarketEvent } from '../types';
import { MarketTrendsPanel } from './MarketTrendsPanel';

interface AetheriumMarketPanelProps {
  marketState: AetheriumMarketState;
  onClose: () => void;
  onInjectCapital?: (amount: number) => void;
  onSpeculateMarket?: (amount: number) => void;
  playerMoney: number;
  onOpenCensus?: () => void;
  onOpenAdvisorAI?: () => void;
  onOpenEfficiencyReport?: () => void;
  onOpenMarketTrends?: () => void;
}

export const AetheriumMarketPanel: React.FC<AetheriumMarketPanelProps> = ({
  marketState,
  onClose,
  onInjectCapital,
  onSpeculateMarket,
  playerMoney,
  onOpenCensus,
  onOpenAdvisorAI,
  onOpenEfficiencyReport,
  onOpenMarketTrends
}) => {
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showD3Trends, setShowD3Trends] = useState<boolean>(false);

  const priceDiff = marketState.currentPrice - marketState.previousPrice;
  const percentChange = marketState.previousPrice > 0
    ? ((priceDiff / marketState.previousPrice) * 100).toFixed(1)
    : '0.0';
  const isPositive = priceDiff >= 0;

  const handleInject = () => {
    if (playerMoney < 2500) {
      setActionFeedback('Insufficient Treasury funds ($2,500 required).');
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    if (onInjectCapital) {
      onInjectCapital(2500);
      setActionFeedback('⚡ Injected $2,500 into Aetherium Stabilizers! +10% Market Boost.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const handleSpeculate = () => {
    if (playerMoney < 1000) {
      setActionFeedback('Insufficient Treasury funds ($1,000 required).');
      setTimeout(() => setActionFeedback(null), 3000);
      return;
    }
    if (onSpeculateMarket) {
      onSpeculateMarket(1000);
      setActionFeedback('📈 Executed Aetherium Hedge contract ($1,000). Market yield leveraged!');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-300 shadow-lg shadow-purple-500/20 animate-pulse">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide uppercase font-mono">
                  Aetherium Commodity Market
                </h2>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Live Exchange
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Global energy index linking building outputs to worldwide economic fluctuations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Market Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticker Banner */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Index Rate</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white">${marketState.currentPrice.toFixed(2)}</span>
                <span className={`text-xs font-bold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{percentChange}% (${Math.abs(priceDiff).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Output Yield Multiplier</span>
              <span className="text-lg font-bold font-mono text-purple-300">
                {marketState.overallMultiplier.toFixed(2)}x Yield
              </span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="hidden md:block">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Market Volatility</span>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                {marketState.volatility} Risk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
              marketState.trend === 'up'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : marketState.trend === 'down'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-white/10'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              <span>{marketState.trend === 'up' ? 'BULLISH' : marketState.trend === 'down' ? 'BEARISH' : 'STABLE'}</span>
            </span>
          </div>
        </div>

        {/* Action Feedback Alert */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2 bg-purple-500/20 border-b border-purple-500/30 text-purple-200 text-xs font-mono font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>{actionFeedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Active Global Event Banner */}
          {marketState.activeEvent ? (
            <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <Globe className="w-32 h-32 text-purple-400" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300">
                    <Flame className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                        GLOBAL MARKET EVENT ACTIVE
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold">
                        {marketState.activeEvent.daysRemaining} days left
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-mono">{marketState.activeEvent.name}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{marketState.activeEvent.description}</p>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl px-3 py-2 font-mono text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Sector Impact</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {marketState.activeEvent.affectedSector}: +{Math.round((marketState.activeEvent.multiplier - 1) * 100)}% Yield
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 border border-white/10 rounded-2xl flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Global markets are currently operating under equilibrium conditions.
              </span>
              <span className="text-[10px] text-slate-500">Events trigger periodically</span>
            </div>
          )}

          {/* Recharts Price History Visualization */}
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-mono text-xs">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-white uppercase tracking-wider">30-Day Index Trajectory</span>
              </div>
              
              <button
                onClick={() => {
                  if (onOpenMarketTrends) {
                    onOpenMarketTrends();
                  } else {
                    setShowD3Trends(true);
                  }
                }}
                className="px-3 py-1 bg-purple-500/20 border border-purple-400/40 hover:bg-purple-500/30 text-purple-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
              >
                <LineChart className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Open D3 Technical Volatility Panel</span>
              </button>
            </div>

            <div className="h-64 w-full">
              {marketState.priceHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Accumulating market telemetry...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={marketState.priceHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aetherGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `Day ${val}`} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#a855f7', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Aetherium Price']}
                      labelFormatter={(label) => `Simulation Day ${label}`}
                    />
                    <ReferenceLine y={100} stroke="#64748b" strokeDasharray="3 3" label={{ value: 'Baseline ($100)', fill: '#64748b', fontSize: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#c084fc"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#aetherGrad)"
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.eventTitle) {
                          return (
                            <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
                          );
                        }
                        return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={1.5} fill="#c084fc" />;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Impact by Sector & Building Outputs */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              Building Output Modifiers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold block">Commercial</span>
                    <span className="text-[10px] text-slate-500">Tax & Trade Yield</span>
                  </div>
                </div>
                <span className="font-bold text-emerald-400 text-sm">
                  {(marketState.overallMultiplier * (marketState.activeEvent?.affectedSector === 'Commercial' ? marketState.activeEvent.multiplier : 1)).toFixed(2)}x
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold block">Industrial</span>
                    <span className="text-[10px] text-slate-500">Production Output</span>
                  </div>
                </div>
                <span className="font-bold text-purple-300 text-sm">
                  {(marketState.overallMultiplier * (marketState.activeEvent?.affectedSector === 'Industrial' ? marketState.activeEvent.multiplier : 1)).toFixed(2)}x
                </span>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-300 font-bold block">Global Income</span>
                    <span className="text-[10px] text-slate-500">Net City Revenue</span>
                  </div>
                </div>
                <span className="font-bold text-cyan-300 text-sm">
                  {marketState.overallMultiplier.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Strategic Market Interventions */}
          <div className="p-4 bg-slate-950/80 border border-purple-500/20 rounded-2xl space-y-3">
            <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Strategic Market Operations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleInject}
                className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1 font-mono">
                  <span className="font-bold text-purple-200 text-xs group-hover:text-white">Inject Stabilizing Capital</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">$2,500</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Deploy treasury reserves into municipal Aetherium nodes to boost market price by +10%.
                </p>
              </button>

              <button
                onClick={handleSpeculate}
                className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1 font-mono">
                  <span className="font-bold text-amber-200 text-xs group-hover:text-white">Hedge Speculation Option</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">$1,000</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Leverage market futures contract to shield city income against bearish market downturns.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Aetherium Exchange Stream: Online</span>
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

            {onOpenEfficiencyReport && (
              <button
                onClick={() => { onClose(); onOpenEfficiencyReport(); }}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Efficiency</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-purple-500/20"
            >
              Close Exchange
            </button>
          </div>
        </div>
      </motion.div>

      {/* D3 Market Trends Dedicated Panel Overlay */}
      <AnimatePresence>
        {showD3Trends && (
          <MarketTrendsPanel
            marketState={marketState}
            onClose={() => setShowD3Trends(false)}
            onInjectCapital={onInjectCapital}
            onSpeculateMarket={onSpeculateMarket}
            playerMoney={playerMoney}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
