import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  X, 
  Users, 
  Coins, 
  Smile, 
  Zap, 
  CloudRain, 
  Bot, 
  ShieldCheck, 
  Activity, 
  Compass, 
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Maximize2
} from 'lucide-react';
import { CityStats, AIGoal, WeatherState } from '../types';

interface HomeLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CityStats;
  weather: WeatherState;
  currentGoal: AIGoal | null;
  taxRate: number;
  isAutoPlayActive?: boolean;
  onToggleAutoPlay?: () => void;
  onOpenWeatherForecast?: () => void;
  onOpenAdvisorChat?: () => void;
  onOpenCensus?: () => void;
  onOpenMenuLayer: () => void;
  onOpenSettingsLayer: () => void;
  onOpenProfilesLayer: () => void;
}

export const HomeLayerModal: React.FC<HomeLayerModalProps> = ({
  isOpen,
  onClose,
  stats,
  weather,
  currentGoal,
  taxRate,
  isAutoPlayActive = false,
  onToggleAutoPlay,
  onOpenWeatherForecast,
  onOpenAdvisorChat,
  onOpenCensus,
  onOpenMenuLayer,
  onOpenSettingsLayer,
  onOpenProfilesLayer
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-sky-900/80 via-slate-900 to-indigo-900/80 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 shadow-lg shadow-sky-500/20">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">HOME LAYER</h2>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-mono text-[10px] font-bold uppercase">
                    Metropolis Overview
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Central Command & Real-time City Health Telemetry
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="Return to Canvas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-xs font-mono font-bold uppercase">Population</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {stats.population.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Citizens residing in city
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-xs font-mono font-bold uppercase">Treasury</span>
                  <Coins className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  ${stats.money.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Tax Rate: {taxRate}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <span className="text-xs font-mono font-bold uppercase">Happiness</span>
                  <Smile className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {stats.happiness}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Civil satisfaction index
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between text-purple-400 mb-2">
                  <span className="text-xs font-mono font-bold uppercase">Power Output</span>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {stats.powerEfficiency || 98}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Aetherium Grid Stability
                </div>
              </div>
            </div>

            {/* AI Advisor Directive Status */}
            {currentGoal && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono text-sky-400 uppercase tracking-wider">
                      Active Municipal Directive
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{currentGoal.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{currentGoal.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    onClick={onOpenAdvisorChat}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-600/30"
                  >
                    <span>Consult AI Advisor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Layer Quick Jump */}
            <div>
              <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-3">
                Layer Navigation Quick Switch
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => { onClose(); onOpenMenuLayer(); }}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-400 mb-1">
                    <span className="font-mono font-bold text-sm text-white group-hover:text-amber-300">
                      📋 MENU LAYER
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Market, Leaderboard, Chronicle, Directives & City Systems
                  </p>
                </button>

                <button
                  onClick={() => { onClose(); onOpenSettingsLayer(); }}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-cyan-400 mb-1">
                    <span className="font-mono font-bold text-sm text-white group-hover:text-cyan-300">
                      ⚙️ SETTINGS LAYER
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Audio, High-Contrast UI, Game Speed & Save Management
                  </p>
                </button>

                <button
                  onClick={() => { onClose(); onOpenProfilesLayer(); }}
                  className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-purple-400 mb-1">
                    <span className="font-mono font-bold text-sm text-white group-hover:text-purple-300">
                      👤 PROFILES LAYER
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Mayor Badges, Architect Rank, Legacy Archives & Bio
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-slate-400">QUICK ACTIONS:</span>
                {onToggleAutoPlay && (
                  <button
                    onClick={onToggleAutoPlay}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isAutoPlayActive 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Auto-Play AI: {isAutoPlayActive ? 'ON' : 'OFF'}</span>
                  </button>
                )}
                {onOpenWeatherForecast && (
                  <button
                    onClick={onOpenWeatherForecast}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>3-Day Forecast</span>
                  </button>
                )}
                {onOpenCensus && (
                  <button
                    onClick={() => { onClose(); onOpenCensus(); }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Civilization Census</span>
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Return to Canvas</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
