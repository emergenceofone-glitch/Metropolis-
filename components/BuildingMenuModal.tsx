/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { 
  BuildingType, 
  CityStats, 
  TileData, 
  WeatherState 
} from '../types';
import { BUILDINGS } from '../constants';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  ArrowUpCircle, 
  Trash2, 
  Home, 
  Store, 
  Factory, 
  TreePine, 
  Landmark, 
  Road as RoadIcon,
  Zap,
  CloudRain,
  Snowflake,
  Wind,
  Bot,
  Users,
  Coins,
  Sparkles
} from 'lucide-react';

interface BuildingMenuModalProps {
  tile: TileData | null;
  stats: CityStats;
  weather: WeatherState;
  isCoveredByShield: boolean;
  onClose: () => void;
  onUpgradeLevel: (x: number, y: number) => void;
  onUpgradeResilience: (x: number, y: number) => void;
  onDemolish: (x: number, y: number) => void;
  onOpenAdvisorAI?: () => void;
  onOpenCensus?: () => void;
  onOpenWeatherForecast?: () => void;
  onOpenMarket?: () => void;
  onOpenRefinement?: () => void;
}

const RESILIENCE_TIERS = [
  { level: 0, name: 'Standard Construction', cost: 0, protection: 0, desc: 'Vulnerable to weather penalties (up to 35% loss).' },
  { level: 1, name: 'Weather-Sealed', cost: 200, protection: 50, desc: '50% reduction in weather incident penalty.' },
  { level: 2, name: 'Storm-Fortified', cost: 450, protection: 80, desc: '80% reduction in weather incident penalty.' },
  { level: 3, name: 'Atmospheric-Mastered', cost: 850, protection: 100, desc: '100% Weather Immune! Structure withstands all incidents with zero loss.' },
];

export const BuildingMenuModal: React.FC<BuildingMenuModalProps> = ({
  tile,
  stats,
  weather,
  isCoveredByShield,
  onClose,
  onUpgradeLevel,
  onUpgradeResilience,
  onDemolish,
  onOpenAdvisorAI,
  onOpenCensus,
  onOpenWeatherForecast,
  onOpenMarket,
  onOpenRefinement
}) => {
  if (!tile || tile.buildingType === BuildingType.None) return null;

  const config = BUILDINGS[tile.buildingType];
  const level = tile.level || 1;
  const resilienceLevel = tile.resilienceLevel || (tile.isResilient ? 3 : 0);
  const currentTier = RESILIENCE_TIERS.find(t => t.level === Math.min(resilienceLevel, 3)) || RESILIENCE_TIERS[0];
  const nextTier = RESILIENCE_TIERS.find(t => t.level === resilienceLevel + 1);

  const levelUpgradeCost = Math.floor(config.cost * (level + 0.5));
  const isMaxLevel = level >= 5;

  const baseIncome = config.incomeGen * level;
  const basePop = config.popGen * level;

  const isSevereWeather = weather.isRaining || weather.isSnowing || weather.isFoggy;

  const getBuildingIcon = (type: BuildingType) => {
    switch (type) {
      case BuildingType.Residential: return <Home className="w-6 h-6 text-red-400" />;
      case BuildingType.Commercial: return <Store className="w-6 h-6 text-blue-400" />;
      case BuildingType.Industrial: return <Factory className="w-6 h-6 text-yellow-400" />;
      case BuildingType.Park: return <TreePine className="w-6 h-6 text-emerald-400" />;
      case BuildingType.Monument: return <Landmark className="w-6 h-6 text-purple-400" />;
      case BuildingType.AtmosphericShield: return <ShieldCheck className="w-6 h-6 text-cyan-400" />;
      default: return <RoadIcon className="w-6 h-6 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-inner">
              {getBuildingIcon(tile.buildingType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">{config.name}</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Lvl {level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Grid Position: Sector ({tile.x + 1}, {tile.y + 1})
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close building menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Income Yield</span>
            <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1">
              +${baseIncome} <span className="text-xs text-slate-400 font-normal">/ tick</span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">Population Support</span>
            <div className="text-lg font-bold font-mono text-blue-400 flex items-center gap-1">
              +{basePop} <span className="text-xs text-slate-400 font-normal">citizens</span>
            </div>
          </div>
        </div>

        {/* Weather Incident Status Banner */}
        <div className="mb-5 p-3.5 rounded-xl border bg-slate-800/60 border-slate-700/80">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {resilienceLevel >= 3 || isCoveredByShield ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : resilienceLevel > 0 ? (
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-sm font-semibold text-slate-200">
                Weather Status: {currentTier.name}
              </span>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
              currentTier.protection === 100 || isCoveredByShield 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : currentTier.protection > 0 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isCoveredByShield ? '100% Shield Dome' : `${currentTier.protection}% Protection`}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {isCoveredByShield 
              ? 'Protected by local Atmospheric Shield Forcefield Dome. Zero weather incident penalty.'
              : currentTier.desc}
          </p>

          {isSevereWeather && (
            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                {weather.isSnowing && <Snowflake className="w-3.5 h-3.5 text-cyan-400" />}
                {weather.isRaining && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                {weather.isFoggy && <Wind className="w-3.5 h-3.5 text-slate-400" />}
                Active Weather Incident
              </span>
              <span className={currentTier.protection === 100 || isCoveredByShield ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {currentTier.protection === 100 || isCoveredByShield ? "100% Yield Preserved" : `${100 - (30 * (1 - currentTier.protection/100))}% Yield Output`}
              </span>
            </div>
          )}
        </div>

        {/* Resilience Upgrade Path */}
        <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Resilience Upgrade Path</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400">Tier {resilienceLevel} / 3</span>
          </div>

          <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
            Upgrade structural weatherproofing, thermal seals, and storm dampers to withstand severe weather incidents without losing population or income.
          </p>

          {/* Tier Step Progress Bar */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[1, 2, 3].map((tierNum) => (
              <div 
                key={tierNum} 
                className={`p-2 rounded-lg text-center border transition-all ${
                  resilienceLevel >= tierNum
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="text-[10px] font-mono font-bold uppercase">Tier {tierNum}</div>
                <div className="text-[11px] font-semibold mt-0.5">
                  {tierNum === 1 ? '50% Proof' : tierNum === 2 ? '80% Proof' : '100% Proof'}
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade Resilience Button */}
          {nextTier ? (
            <button
              onClick={() => onUpgradeResilience(tile.x, tile.y)}
              disabled={stats.money < nextTier.cost}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-between transition-all ${
                stats.money >= nextTier.cost
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Upgrade Resilience to Tier {nextTier.level} ({nextTier.name})</span>
              </div>
              <span className="font-mono font-bold text-xs bg-black/30 px-2 py-1 rounded-md">
                ${nextTier.cost}
              </span>
            </button>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Maximum Resilience Reached (100% Weather Immune)
            </div>
          )}
        </div>

        {/* Mayoral Quick Action Shortcuts */}
        <div className="mb-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Mayoral Actions
            </span>
            <span>Shortcut Suite</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {onOpenAdvisorAI && (
              <button
                onClick={() => { onClose(); onOpenAdvisorAI(); }}
                className="py-1.5 px-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 rounded-lg text-purple-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Ask AI Advisor about this building"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span>Advisor AI</span>
              </button>
            )}

            {onOpenCensus && (
              <button
                onClick={() => { onClose(); onOpenCensus(); }}
                className="py-1.5 px-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-lg text-cyan-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="View Population & Scaling"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Census</span>
              </button>
            )}

            {onOpenWeatherForecast && (
              <button
                onClick={() => { onClose(); onOpenWeatherForecast(); }}
                className="py-1.5 px-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 rounded-lg text-sky-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="View 3-Day Forecast"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Weather</span>
              </button>
            )}

            {onOpenMarket && (
              <button
                onClick={() => { onClose(); onOpenMarket(); }}
                className="py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-lg text-amber-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Aetherium Market Exchange"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Market</span>
              </button>
            )}

            {onOpenRefinement && (
              <button
                onClick={() => { onClose(); onOpenRefinement(); }}
                className="py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 rounded-lg text-emerald-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="Material Refinement Pipeline"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Refining</span>
              </button>
            )}
          </div>
        </div>

        {/* General Actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* General Level Up */}
          <button
            onClick={() => onUpgradeLevel(tile.x, tile.y)}
            disabled={isMaxLevel || stats.money < levelUpgradeCost}
            className={`py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
              !isMaxLevel && stats.money >= levelUpgradeCost
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <ArrowUpCircle className="w-4 h-4 text-amber-400" />
              <span>{isMaxLevel ? 'Max Level' : `Upgrade Level ${level + 1}`}</span>
            </div>
            {!isMaxLevel && (
              <span className="font-mono font-bold text-[11px]">${levelUpgradeCost}</span>
            )}
          </button>

          {/* Demolish */}
          <button
            onClick={() => onDemolish(tile.x, tile.y)}
            disabled={stats.money < 5}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-red-500/20 hover:border-red-500/50 text-red-400 border border-slate-700/80 flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Demolish ($5)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
