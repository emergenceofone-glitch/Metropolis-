import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Medal,
  Users,
  Coins,
  Smile,
  Globe,
  X,
  TrendingUp,
  Sparkles,
  Search,
  Award,
  Building2,
  RefreshCw,
  Crown
} from 'lucide-react';
import { CityStats } from '../types';

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  cityName: string;
  mayorName: string;
  population: number;
  treasury: number;
  happiness: number;
  cityLevel: number;
  isPlayer?: boolean;
  tier: string;
  badge?: string;
  trend: 'up' | 'stable' | 'down';
}

interface CityLeaderboardProps {
  stats: CityStats;
  onClose: () => void;
}

const RIVAL_CITIES: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    id: 'rival-1',
    cityName: 'Aetheria Arcology',
    mayorName: 'Mayor Vance Sterling',
    population: 48500,
    treasury: 1250000,
    happiness: 94,
    cityLevel: 24,
    tier: 'S Tier Metropolis',
    badge: 'Solar Titan',
    trend: 'up'
  },
  {
    id: 'rival-2',
    cityName: 'Neo Neo-Tokyo',
    mayorName: 'Director Sato',
    population: 32100,
    treasury: 890000,
    happiness: 88,
    cityLevel: 19,
    tier: 'A Tier Metropolis',
    badge: 'Cyber Nexus',
    trend: 'stable'
  },
  {
    id: 'rival-3',
    cityName: 'Solaria Sky Spire',
    mayorName: 'Governor Clara Thorne',
    population: 24800,
    treasury: 640000,
    happiness: 91,
    cityLevel: 16,
    tier: 'A Tier Metropolis',
    badge: 'Clean Energy Pioneer',
    trend: 'up'
  },
  {
    id: 'rival-4',
    cityName: 'Zenith Orbital Grid',
    mayorName: 'Cmdr. Rayner',
    population: 18200,
    treasury: 420000,
    happiness: 85,
    cityLevel: 13,
    tier: 'B Tier City',
    badge: 'Transit Hub',
    trend: 'up'
  },
  {
    id: 'rival-5',
    cityName: 'Apex Citadel',
    mayorName: 'Councilor Drake',
    population: 12400,
    treasury: 310000,
    happiness: 79,
    cityLevel: 10,
    tier: 'B Tier City',
    badge: 'Industrial Power',
    trend: 'down'
  },
  {
    id: 'rival-6',
    cityName: 'Verdant Canopy',
    mayorName: 'Eco-Mayor Lin',
    population: 8900,
    treasury: 195000,
    happiness: 96,
    cityLevel: 8,
    tier: 'C Tier Settlement',
    badge: 'Zero Carbon',
    trend: 'up'
  },
  {
    id: 'rival-7',
    cityName: 'Cloudburst Haven',
    mayorName: 'Overseer Kaelen',
    population: 4200,
    treasury: 85000,
    happiness: 82,
    cityLevel: 5,
    tier: 'C Tier Settlement',
    badge: 'Monsoon Shield',
    trend: 'stable'
  }
];

export const CityLeaderboard: React.FC<CityLeaderboardProps> = ({ stats, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overall' | 'population' | 'wealth'>('overall');
  const [scope, setScope] = useState<'global' | 'personal_bests'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [personalBests, setPersonalBests] = useState<LeaderboardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  // Load / Update local high scores
  useEffect(() => {
    const playerCivicScore = Math.floor(
      (stats.population * 2) + (stats.money * 0.5) + (stats.happiness * 100) + (stats.cityLevel * 500)
    );

    const playerEntry: LeaderboardEntry = {
      id: 'player-city',
      cityName: 'SkyMetropolis (Your City)',
      mayorName: 'Mayor (You)',
      population: Math.round(stats.population),
      treasury: Math.round(stats.money),
      happiness: Math.round(stats.happiness),
      cityLevel: stats.cityLevel,
      isPlayer: true,
      tier:
        stats.cityLevel >= 15 ? 'S Tier Metropolis' :
        stats.cityLevel >= 10 ? 'A Tier Metropolis' :
        stats.cityLevel >= 5 ? 'B Tier City' : 'C Tier Settlement',
      badge: 'Civic Commander',
      trend: 'up'
    };

    // Personal Bests persistence
    try {
      const stored = localStorage.getItem('skymetropolis_personal_bests');
      let records: LeaderboardEntry[] = stored ? JSON.parse(stored) : [];

      // Check if current stats warrant a new high score entry
      const existingToday = records.find(r => r.cityLevel === stats.cityLevel && Math.abs(r.population - stats.population) < 5);
      if (!existingToday && (stats.population > 10 || stats.money > 1000)) {
        const newRecord: LeaderboardEntry = {
          ...playerEntry,
          id: `pb-${Date.now()}`,
          cityName: `SkyMetropolis (Day ${stats.day})`,
        };
        records = [newRecord, ...records.slice(0, 9)];
        localStorage.setItem('skymetropolis_personal_bests', JSON.stringify(records));
      }
      setPersonalBests(records);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [stats]);

  // Combine player city with rival cities
  const playerEntry: LeaderboardEntry = {
    id: 'player-city',
    cityName: 'SkyMetropolis (Your City)',
    mayorName: 'Mayor (You)',
    population: Math.round(stats.population),
    treasury: Math.round(stats.money),
    happiness: Math.round(stats.happiness),
    cityLevel: stats.cityLevel,
    isPlayer: true,
    tier:
      stats.cityLevel >= 15 ? 'S Tier Metropolis' :
      stats.cityLevel >= 10 ? 'A Tier Metropolis' :
      stats.cityLevel >= 5 ? 'B Tier City' : 'C Tier Settlement',
    badge: 'Civic Commander',
    trend: 'up'
  };

  const getScore = (entry: LeaderboardEntry) => {
    if (activeTab === 'population') return entry.population;
    if (activeTab === 'wealth') return entry.treasury;
    // overall score formula
    return Math.floor((entry.population * 2) + (entry.treasury * 0.5) + (entry.happiness * 100) + (entry.cityLevel * 500));
  };

  const globalList = [playerEntry, ...RIVAL_CITIES];
  const listToDisplay = scope === 'global' ? globalList : (personalBests.length > 0 ? personalBests : [playerEntry]);

  // Sort by active metric
  const sortedEntries = [...listToDisplay]
    .sort((a, b) => getScore(b) - getScore(a))
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  const filteredEntries = sortedEntries.filter(
    e =>
      e.cityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.mayorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playerRank = sortedEntries.find(e => e.isPlayer)?.rank || '-';

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
        className="w-full max-w-4xl bg-slate-900 border border-yellow-500/30 rounded-3xl shadow-2xl shadow-yellow-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide uppercase">Metropolitan Leaderboard</h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold uppercase">
                  Global Ranking
                </span>
              </div>
              <p className="text-xs text-slate-400">SkyMetropolis Civic Standings & World Wealth Rankings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Quick Banner */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black font-mono flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
              #{playerRank}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">SkyMetropolis (Your City)</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  Level {stats.cityLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Pop: {Math.round(stats.population).toLocaleString()} | Treasury: ${Math.round(stats.money).toLocaleString()} | Happiness: {Math.round(stats.happiness)}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScope('global')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === 'global'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global Rivals</span>
            </button>
            <button
              onClick={() => setScope('personal_bests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === 'personal_bests'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Personal Bests</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'overall'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Civic Score</span>
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
              onClick={() => setActiveTab('wealth')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'wealth'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Treasury Wealth</span>
            </button>
          </div>

          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city or mayor..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="p-6 flex-1 overflow-y-auto space-y-2">
          {filteredEntries.map((entry) => {
            const isTop3 = entry.rank && entry.rank <= 3;
            const badgeColor =
              entry.rank === 1 ? 'bg-amber-400 text-slate-950 border-amber-300' :
              entry.rank === 2 ? 'bg-slate-300 text-slate-950 border-slate-200' :
              entry.rank === 3 ? 'bg-amber-700 text-white border-amber-600' :
              'bg-slate-800 text-slate-400 border-white/10';

            return (
              <motion.div
                key={entry.id}
                layout
                onClick={() => setSelectedEntry(entry)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-4 ${
                  entry.isPlayer
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30 hover:bg-amber-500/15'
                    : 'bg-slate-950/40 border-white/10 hover:bg-white/5 hover:border-white/20'
                }`}
              >
                {/* Left: Rank & City Name */}
                <div className="flex items-center gap-3.5 min-w-[220px]">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono font-extrabold text-sm shadow-sm ${badgeColor}`}>
                    {entry.rank === 1 ? <Trophy className="w-4 h-4 text-slate-950" /> : `#${entry.rank}`}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm tracking-tight ${entry.isPlayer ? 'text-amber-300' : 'text-white'}`}>
                        {entry.cityName}
                      </h3>
                      {entry.isPlayer && (
                        <span className="px-2 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-wider">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>{entry.mayorName}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400/90 font-mono">{entry.badge}</span>
                    </p>
                  </div>
                </div>

                {/* Center: Key Metrics */}
                <div className="flex items-center gap-6 font-mono text-xs">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" /> Population
                    </span>
                    <span className="font-bold text-white text-sm">
                      {entry.population.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3 h-3 text-emerald-400" /> Treasury
                    </span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ${entry.treasury.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Smile className="w-3 h-3 text-amber-400" /> Happiness
                    </span>
                    <span className="font-bold text-amber-300 text-sm">
                      {entry.happiness}%
                    </span>
                  </div>
                </div>

                {/* Right: Tier Badge & Civic Score */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Civic Rating</span>
                    <span className="font-mono font-bold text-xs text-cyan-300">
                      {getScore(entry).toLocaleString()} pts
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono text-slate-300">
                    {entry.tier}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Entry Detail Drawer / Modal if clicked */}
        {selectedEntry && (
          <div className="px-6 py-4 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-bold text-white text-sm">{selectedEntry.cityName}</span>
                <p className="text-slate-400">{selectedEntry.mayorName} • {selectedEntry.tier}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span className="text-slate-300">Level {selectedEntry.cityLevel}</span>
              <span className="text-emerald-400">${selectedEntry.treasury.toLocaleString()}</span>
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer"
              >
                Dismiss Details
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Live Metropolitan Telemetry Grid
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-500/20"
          >
            Close Leaderboard
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
