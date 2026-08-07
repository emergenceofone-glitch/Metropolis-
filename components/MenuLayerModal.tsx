import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  TrendingUp, 
  Trophy, 
  BookOpen, 
  Activity, 
  Globe, 
  CloudRain, 
  Save, 
  RotateCcw, 
  FileText,
  ChevronRight,
  ShieldCheck,
  Building,
  Radio,
  Coins,
  Users
} from 'lucide-react';

interface MenuLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMarket: () => void;
  onOpenLeaderboard: () => void;
  onOpenChronicle: () => void;
  onOpenEfficiencyReport: () => void;
  onOpenAtlas: () => void;
  onOpenWeatherForecast: () => void;
  onOpenBuildingDirectory: () => void;
  onOpenTriNode: () => void;
  onOpenCensus?: () => void;
  onSaveSnapshot?: () => void;
  onRestartGame?: () => void;
}

export const MenuLayerModal: React.FC<MenuLayerModalProps> = ({
  isOpen,
  onClose,
  onOpenMarket,
  onOpenLeaderboard,
  onOpenChronicle,
  onOpenEfficiencyReport,
  onOpenAtlas,
  onOpenWeatherForecast,
  onOpenBuildingDirectory,
  onOpenTriNode,
  onOpenCensus,
  onSaveSnapshot,
  onRestartGame
}) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'census',
      title: 'Civilization Census & Scaling',
      description: 'Demographics, citizen classes, housing density & dynamic scale multipliers.',
      icon: Users,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
      action: () => { onClose(); if (onOpenCensus) onOpenCensus(); }
    },
    {
      id: 'market',
      title: 'Aetherium Market Exchange',
      description: 'Speculate, trade shares, and inject capital into city infrastructure.',
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
      action: () => { onClose(); onOpenMarket(); }
    },
    {
      id: 'leaderboard',
      title: 'Global City Leaderboard',
      description: 'Compare city population, prestige rating, and mayor architectural rank.',
      icon: Trophy,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
      action: () => { onClose(); onOpenLeaderboard(); }
    },
    {
      id: 'chronicle',
      title: 'Metropolis Chronicle',
      description: 'Review historical city milestones, disasters, and mayor log notes.',
      icon: BookOpen,
      color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40',
      action: () => { onClose(); onOpenChronicle(); }
    },
    {
      id: 'efficiency',
      title: 'City Efficiency Audit',
      description: 'Deep energy, commercial synergy, and zone performance analytics.',
      icon: Activity,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
      action: () => { onClose(); onOpenEfficiencyReport(); }
    },
    {
      id: 'atlas',
      title: 'Regional Atlas View',
      description: 'Strategic macro view of the floating archipelago and neighboring districts.',
      icon: Globe,
      color: 'text-blue-400 bg-blue-500/20 border-blue-500/40',
      action: () => { onClose(); onOpenAtlas(); }
    },
    {
      id: 'weather',
      title: 'Weather Defense Station',
      description: 'Monitor 3-day meteorological forecasts and forcefield dome resilience.',
      icon: CloudRain,
      color: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
      action: () => { onClose(); onOpenWeatherForecast(); }
    },
    {
      id: 'trinode',
      title: 'Tri-Node Ecosystem Matrix',
      description: 'Physical pulse generators & ecosystem multiplier telemetry.',
      icon: Radio,
      color: 'text-teal-400 bg-teal-500/20 border-teal-500/40',
      action: () => { onClose(); onOpenTriNode(); }
    },
    {
      id: 'directory',
      title: 'Building Catalog & Upgrades',
      description: 'Inspect structure resilience tiers, maintenance costs, and weatherproofing.',
      icon: Building,
      color: 'text-purple-400 bg-purple-500/20 border-purple-500/40',
      action: () => { onClose(); onOpenBuildingDirectory(); }
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 shadow-lg shadow-amber-500/20">
                <Menu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">MENU LAYER</h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold uppercase">
                    Central Systems Directory
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Access Metropolis Management Hubs, Finance & Analytics
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label="Close Menu Layer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body List Grid */}
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-600 transition-all text-left group flex items-start gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <div className={`p-3 rounded-2xl border ${item.color} shrink-0 group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold font-mono text-sm text-white group-hover:text-amber-300 transition-colors">
                          {item.title}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Municipal Commands */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-slate-400">DATA & SAVES:</span>
                {onSaveSnapshot && (
                  <button
                    onClick={() => { onSaveSnapshot(); }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Save City Snapshot</span>
                  </button>
                )}
              </div>

              {onRestartGame && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset the metropolis and start a fresh city?')) {
                      onRestartGame();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Metropolis</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
