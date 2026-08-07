/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  X, 
  Sparkles, 
  TrendingUp, 
  Home, 
  Briefcase, 
  ShieldCheck, 
  GraduationCap, 
  Compass, 
  Building2, 
  Award, 
  Zap, 
  Activity, 
  BarChart3, 
  Bot, 
  HeartHandshake,
  CheckCircle2,
  ArrowUpRight,
  CloudRain,
  Coins
} from 'lucide-react';
import { CityStats, Grid, BuildingType, WeatherState } from '../types';
import { D3PopulationChart, HistoryDataPoint } from './D3PopulationChart';

interface CivilizationCensusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CityStats;
  grid: Grid;
  history?: HistoryDataPoint[];
  taxRate?: number;
  weather?: WeatherState;
  onOpenAdvisorChat?: () => void;
  onOpenWeatherForecast?: () => void;
  onOpenMarket?: () => void;
  onOpenEfficiencyReport?: () => void;
}

export interface CivilizationTier {
  name: string;
  minPop: number;
  maxPop: number;
  multiplier: number;
  description: string;
  badgeColor: string;
  unlockedPerks: string[];
}

export const CIVILIZATION_TIERS: CivilizationTier[] = [
  {
    name: 'Floating Outpost',
    minPop: 0,
    maxPop: 99,
    multiplier: 1.0,
    description: 'A modest cloud platform embarking on high-altitude colonization.',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    unlockedPerks: ['Basic Tax Collection', 'Starter Zoning']
  },
  {
    name: 'Sky Settlement',
    minPop: 100,
    maxPop: 499,
    multiplier: 1.15,
    description: 'Growing cluster of floating domiciles with foundational commerce.',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    unlockedPerks: ['+15% Global Revenue Scale', 'Automated Migration Docks']
  },
  {
    name: 'Floating Town',
    minPop: 500,
    maxPop: 1499,
    multiplier: 1.30,
    description: 'A thriving aerial community with high trade density & parks.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    unlockedPerks: ['+30% Tax Yield Multiplier', '+10% Experience Gain', 'Commercial District Synergies']
  },
  {
    name: 'Sky Metropolis',
    minPop: 1500,
    maxPop: 4999,
    multiplier: 1.50,
    description: 'A dominant cloud hub featuring skyline monuments and weather shields.',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    unlockedPerks: ['+50% Income Scale', 'Enhanced Weather Shielding', 'Scholarly Research Boost']
  },
  {
    name: 'Aetherium Megacity',
    minPop: 5000,
    maxPop: 14999,
    multiplier: 1.80,
    description: 'A towering citadel powering the entire high-altitude ecosystem.',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    unlockedPerks: ['+80% Global Multiplier', '+25% Production Speed', 'Tri-Node Aetherium Master Tier']
  },
  {
    name: 'Grand Orbital Empire',
    minPop: 15000,
    maxPop: Infinity,
    multiplier: 2.25,
    description: 'Pinnacle of celestial engineering with infinite scaling mastery.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    unlockedPerks: ['+125% All Yields Multiplier', 'Perpetual Civil Satisfaction', 'Atmospheric Dominance']
  }
];

export const CivilizationCensusModal: React.FC<CivilizationCensusModalProps> = ({
  isOpen,
  onClose,
  stats,
  grid,
  history = [],
  taxRate = 10,
  weather,
  onOpenAdvisorChat,
  onOpenWeatherForecast,
  onOpenMarket,
  onOpenEfficiencyReport
}) => {
  const [activeTab, setActiveTab] = useState<'census' | 'scaling' | 'tiers' | 'policies'>('census');
  const [activePolicy, setActivePolicy] = useState<string | null>(null);

  // Analyze Grid Buildings
  const buildingCounts = useMemo(() => {
    let res = 0, com = 0, ind = 0, park = 0, monument = 0, shield = 0, road = 0, total = 0;
    grid.forEach(row => {
      row.forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          total++;
          switch (tile.buildingType) {
            case BuildingType.Residential: res++; break;
            case BuildingType.Commercial: com++; break;
            case BuildingType.Industrial: ind++; break;
            case BuildingType.Park: park++; break;
            case BuildingType.Monument: monument++; break;
            case BuildingType.AtmosphericShield: shield++; break;
            case BuildingType.Road: road++; break;
          }
        }
      });
    });
    return { res, com, ind, park, monument, shield, road, total };
  }, [grid]);

  // Current Civilization Tier
  const currentTier = useMemo(() => {
    const pop = stats.population;
    return CIVILIZATION_TIERS.find(t => pop >= t.minPop && pop <= t.maxPop) || CIVILIZATION_TIERS[0];
  }, [stats.population]);

  // Next Civilization Tier & Progress
  const nextTier = useMemo(() => {
    const currentIndex = CIVILIZATION_TIERS.findIndex(t => t.name === currentTier.name);
    if (currentIndex < CIVILIZATION_TIERS.length - 1) {
      return CIVILIZATION_TIERS[currentIndex + 1];
    }
    return null;
  }, [currentTier]);

  const progressToNextTier = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.minPop - currentTier.minPop;
    const currentProgress = stats.population - currentTier.minPop;
    return Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
  }, [stats.population, currentTier, nextTier]);

  // Housing Capacity & Density
  const housingCapacity = useMemo(() => {
    const baseHousingPerRes = 40;
    return Math.max(100, buildingCounts.res * baseHousingPerRes + (buildingCounts.monument * 100));
  }, [buildingCounts]);

  const occupancyRate = useMemo(() => {
    return Math.min(100, Math.round((stats.population / Math.max(1, housingCapacity)) * 100));
  }, [stats.population, housingCapacity]);

  // Migration Rate Calculation
  const migrationRate = useMemo(() => {
    const happinessBonus = (stats.happiness - 50) * 0.4;
    const taxPenalty = (taxRate - 10) * -0.3;
    const parkBonus = buildingCounts.park * 1.5;
    const rawRate = Math.round(happinessBonus + taxPenalty + parkBonus);
    return rawRate >= 0 ? `+${rawRate} / day` : `${rawRate} / day`;
  }, [stats.happiness, taxRate, buildingCounts.park]);

  // Demographic Classes Breakdown
  const demographics = useMemo(() => {
    const pop = stats.population;
    if (pop === 0) {
      return {
        merchants: 0,
        engineers: 0,
        scholars: 0,
        pilots: 0,
        settlers: 0
      };
    }

    const totalBuilds = Math.max(1, buildingCounts.total);
    const merchantPct = 0.15 + (buildingCounts.com / totalBuilds) * 0.5;
    const engineerPct = 0.15 + ((buildingCounts.ind + buildingCounts.shield * 2) / totalBuilds) * 0.5;
    const scholarPct = 0.10 + ((buildingCounts.park + buildingCounts.monument * 2) / totalBuilds) * 0.4;
    const pilotPct = 0.10 + (buildingCounts.road / totalBuilds) * 0.3;

    const merchants = Math.round(pop * merchantPct);
    const engineers = Math.round(pop * engineerPct);
    const scholars = Math.round(pop * scholarPct);
    const pilots = Math.round(pop * pilotPct);
    const settlers = Math.max(0, pop - (merchants + engineers + scholars + pilots));

    return { merchants, engineers, scholars, pilots, settlers };
  }, [stats.population, buildingCounts]);

  // Scale Multipliers Calculation
  const scalingMetrics = useMemo(() => {
    const tierMult = currentTier.multiplier;
    const happinessScale = 1 + (stats.happiness - 50) / 200; // 0.75x to 1.25x
    const taxScale = Math.max(0.5, 1 - (taxRate - 10) * 0.02);

    const netTaxMultiplier = (tierMult * happinessScale * taxScale).toFixed(2);
    const commerceYieldMultiplier = (tierMult * (1 + buildingCounts.com * 0.04)).toFixed(2);
    const industrialResilienceMultiplier = (1 + buildingCounts.shield * 0.15 + buildingCounts.ind * 0.03).toFixed(2);
    const xpGainMultiplier = (tierMult * (1 + buildingCounts.monument * 0.10 + buildingCounts.park * 0.02)).toFixed(2);

    return {
      netTaxMultiplier,
      commerceYieldMultiplier,
      industrialResilienceMultiplier,
      xpGainMultiplier
    };
  }, [currentTier, stats.happiness, taxRate, buildingCounts]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Top Banner */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">CIVILIZATION CENSUS</h2>
                  <span className={`px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase ${currentTier.badgeColor}`}>
                    {currentTier.name} ({currentTier.multiplier}x Scale)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Demographic Breakdown, Metropolis Tiers & Dynamic Scale Multipliers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenWeatherForecast && (
                <button
                  onClick={() => { onClose(); onOpenWeatherForecast(); }}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Open 3-Day Forecast"
                >
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  <span>Weather</span>
                </button>
              )}

              {onOpenMarket && (
                <button
                  onClick={() => { onClose(); onOpenMarket(); }}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Open Aetherium Market Exchange"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Market</span>
                </button>
              )}

              {onOpenEfficiencyReport && (
                <button
                  onClick={() => { onClose(); onOpenEfficiencyReport(); }}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Open City Efficiency Report"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Report</span>
                </button>
              )}

              {onOpenAdvisorChat && (
                <button
                  onClick={() => { onClose(); onOpenAdvisorChat(); }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-300 text-xs font-mono font-bold transition-all cursor-pointer"
                  title="Consult AI Advisor"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ask Advisor</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                aria-label="Close Census Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-3 pb-0 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('census')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'census'
                  ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Demographics & Census</span>
            </button>

            <button
              onClick={() => setActiveTab('scaling')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'scaling'
                  ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Dynamic Scaling Multipliers</span>
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'tiers'
                  ? 'bg-slate-900 text-purple-300 border-purple-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Civilization Tiers ({currentTier.name})</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition-all cursor-pointer border-b-2 ${
                activeTab === 'policies'
                  ? 'bg-slate-900 text-emerald-300 border-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Census Policies & Directives</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {activeTab === 'census' && (
              <div className="space-y-6">
                {/* Population Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-cyan-400 mb-2">
                      <span className="text-xs font-mono font-bold uppercase">Total Population</span>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">
                      {stats.population.toLocaleString()}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300/80 mt-1 flex items-center justify-between">
                      <span>Civilian Capacity</span>
                      <span className="font-bold">{housingCapacity}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-sky-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-sky-400 mb-2">
                      <span className="text-xs font-mono font-bold uppercase">Housing Occupancy</span>
                      <Home className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-white tracking-tight">
                      {occupancyRate}%
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          occupancyRate > 90 ? 'bg-amber-400' : 'bg-sky-400'
                        }`} 
                        style={{ width: `${occupancyRate}%` }} 
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-emerald-400 mb-2">
                      <span className="text-xs font-mono font-bold uppercase">Migration Rate</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
                      {migrationRate}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      Driven by {stats.happiness}% Happiness & {taxRate}% Tax
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-amber-400 mb-2">
                      <span className="text-xs font-mono font-bold uppercase">Metropolis Tier</span>
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-300 truncate">
                      {currentTier.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">
                      {currentTier.multiplier}x Global Scale Multiplier
                    </div>
                  </div>
                </div>

                {/* Demographic Class Distribution */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold font-mono text-white tracking-wide flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        <span>Citizen Demographics & Specialized Classes</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Occupational workforce proportion derived from active city zoning and structures.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                      100% Accounted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Sky Merchants */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">Sky Merchants</div>
                          <div className="text-[10px] text-slate-400">Boosts Commercial Revenue</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-amber-300">
                          {demographics.merchants.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stats.population > 0 ? Math.round((demographics.merchants / stats.population) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Aetherium Engineers */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">Aetherium Engineers</div>
                          <div className="text-[10px] text-slate-400">Weather Defense & Repairs</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-cyan-300">
                          {demographics.engineers.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stats.population > 0 ? Math.round((demographics.engineers / stats.population) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Scholars */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">Scholars & Arcane</div>
                          <div className="text-[10px] text-slate-400">Accelerates Experience Gain</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-purple-300">
                          {demographics.scholars.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stats.population > 0 ? Math.round((demographics.scholars / stats.population) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Navigators */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">Sky Navigators</div>
                          <div className="text-[10px] text-slate-400">Trade Mobility & Docks</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-sky-300">
                          {demographics.pilots.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stats.population > 0 ? Math.round((demographics.pilots / stats.population) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    {/* Civilian Settlers */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-mono font-bold text-slate-200">Civilian Settlers</div>
                          <div className="text-[10px] text-slate-400">Base Tax & Population</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-emerald-300">
                          {demographics.settlers.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {stats.population > 0 ? Math.round((demographics.settlers / stats.population) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* D3 Population Growth Chart Embed */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-mono text-white tracking-wide flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span>Historical Population Trajectory (D3 Real-Time Chart)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      10-Day Telemetry History
                    </span>
                  </div>

                  <D3PopulationChart 
                    history={history} 
                    currentPopulation={stats.population} 
                    height={220} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'scaling' && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-mono text-white">Dynamic Scale Multipliers</h3>
                      <p className="text-xs text-slate-300">
                        Real-time yield amplifiers calculated from city population tier, citizen happiness, tax rates, and specialized infrastructure.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Tax Revenue Multiplier */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-amber-300">Net Tax Yield Scale</span>
                        <span className="text-lg font-bold text-white font-mono">{scalingMetrics.netTaxMultiplier}x</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Compounded by {currentTier.name} ({currentTier.multiplier}x) and current happiness index ({stats.happiness}%).
                      </p>
                    </div>

                    {/* Commerce Multiplier */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-cyan-300">Commerce & Trade Output</span>
                        <span className="text-lg font-bold text-white font-mono">{scalingMetrics.commerceYieldMultiplier}x</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Amplified by active Commercial districts ({buildingCounts.com} built) and Sky Merchant workforce.
                      </p>
                    </div>

                    {/* Industrial & Weather Resilience */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-emerald-300">Weather Defense Resilience</span>
                        <span className="text-lg font-bold text-white font-mono">{scalingMetrics.industrialResilienceMultiplier}x</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Strengthened by Atmospheric Shielding generators ({buildingCounts.shield} online) and Aetherium Engineers.
                      </p>
                    </div>

                    {/* Experience & Progression Scale */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-purple-300">Level Experience Rate</span>
                        <span className="text-lg font-bold text-white font-mono">{scalingMetrics.xpGainMultiplier}x</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Boosted by Monument landmarks ({buildingCounts.monument} active) and Scholar research grants.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress to Next Tier */}
                {nextTier && (
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-sky-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-sky-400" />
                        <div>
                          <div className="text-sm font-bold font-mono text-white">Next Civilization Tier: {nextTier.name}</div>
                          <div className="text-xs text-slate-400">Requires {nextTier.minPop.toLocaleString()} Population (Current: {stats.population.toLocaleString()})</div>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-sky-300">{progressToNextTier}%</span>
                    </div>

                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all duration-500"
                        style={{ width: `${progressToNextTier}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                      <span>Unlocks: {nextTier.unlockedPerks.join(' • ')}</span>
                      <span className="font-bold text-sky-400">{nextTier.multiplier}x Global Scale</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tiers' && (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-400 mb-2">
                  Complete Hierarchy of Sky Civilization Tiers and Scaling Benefits:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CIVILIZATION_TIERS.map((tier) => {
                    const isCurrent = tier.name === currentTier.name;
                    const isUnlocked = stats.population >= tier.minPop;

                    return (
                      <div
                        key={tier.name}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-sky-950/60 border-sky-400 shadow-lg shadow-sky-500/10'
                            : isUnlocked
                            ? 'bg-slate-950/60 border-slate-800 opacity-90'
                            : 'bg-slate-950/30 border-slate-800/60 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-bold uppercase ${tier.badgeColor}`}>
                              {tier.name}
                            </span>
                            {isCurrent && (
                              <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/40">
                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold font-mono text-white">{tier.multiplier}x Scale</span>
                        </div>

                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                          {tier.description}
                        </p>

                        <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span>Req. Population: <strong className="text-white">{tier.minPop.toLocaleString()} - {tier.maxPop === Infinity ? '∞' : tier.maxPop.toLocaleString()}</strong></span>
                        </div>

                        <div className="mt-2 space-y-1">
                          {tier.unlockedPerks.map((perk, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-sky-300">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>{perk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                  <h3 className="text-sm font-bold font-mono text-emerald-300 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4" />
                    <span>Mayoral Census Policies & Migration Directives</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Enact specialized municipal policies to immediately modify city demographic growth and civil satisfaction.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Policy 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs mb-1">
                        <Users className="w-4 h-4" />
                        <span>Subsidize Sky Migration</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Fund high-altitude transport shuttles to immediately attract +25 new civilian settlers to the metropolis.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-300 font-bold">Cost: $500</span>
                      <button
                        onClick={() => setActivePolicy('migration')}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          activePolicy === 'migration'
                            ? 'bg-emerald-500 text-slate-950 border border-emerald-300'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        }`}
                      >
                        {activePolicy === 'migration' ? 'Enacted ✓' : 'Enact Directive'}
                      </button>
                    </div>
                  </div>

                  {/* Policy 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs mb-1">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Aetherium Engineer Grants</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Provide technical scholarships to increase the proportion of engineers for weather defense.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-300 font-bold">Cost: $750</span>
                      <button
                        onClick={() => setActivePolicy('engineer')}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          activePolicy === 'engineer'
                            ? 'bg-cyan-500 text-slate-950 border border-cyan-300'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                        }`}
                      >
                        {activePolicy === 'engineer' ? 'Enacted ✓' : 'Enact Directive'}
                      </button>
                    </div>
                  </div>

                  {/* Policy 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Organize Cloud Festival</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Host an atmospheric festival across floating plazas to boost resident happiness by +15%.
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-amber-300 font-bold">Cost: $1,000</span>
                      <button
                        onClick={() => setActivePolicy('festival')}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                          activePolicy === 'festival'
                            ? 'bg-purple-500 text-slate-950 border border-purple-300'
                            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40'
                        }`}
                      >
                        {activePolicy === 'festival' ? 'Enacted ✓' : 'Enact Directive'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
