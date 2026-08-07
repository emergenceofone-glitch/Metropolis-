import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  X, 
  Award, 
  ShieldCheck, 
  Coins, 
  Users, 
  Smile, 
  Zap, 
  Building, 
  Landmark, 
  CheckCircle2, 
  Edit3, 
  Sparkles,
  Trophy,
  Globe
} from 'lucide-react';
import { CityStats, TileData, BuildingType } from '../types';

interface ProfilesLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CityStats;
  grid?: TileData[][];
  userEmail?: string;
}

export const ProfilesLayerModal: React.FC<ProfilesLayerModalProps> = ({
  isOpen,
  onClose,
  stats,
  grid,
  userEmail = 'emergenceofone@gmail.com'
}) => {
  const [mayorTitle, setMayorTitle] = useState('Grand Architect & Sky Founder');
  const [cityMotto, setCityMotto] = useState('Elevating Humanity Above the Clouds');
  const [isEditingMotto, setIsEditingMotto] = useState(false);

  if (!isOpen) return null;

  // Calculate grid achievements
  let totalBuilt = 0;
  let hasShield = false;
  let hasMonument = false;

  if (grid) {
    grid.flat().forEach(tile => {
      if (tile.buildingType !== BuildingType.None) totalBuilt++;
      if (tile.buildingType === BuildingType.AtmosphericShield) hasShield = true;
      if (tile.buildingType === BuildingType.Monument) hasMonument = true;
    });
  }

  // Calculate Mayor Level based on population and money
  const mayorLevel = Math.max(1, Math.floor(stats.population / 50) + Math.floor(stats.money / 2000) + (hasShield ? 2 : 0) + (hasMonument ? 3 : 0));

  const badges = [
    {
      id: 'shield',
      title: 'Shielded Sky Metropolis',
      desc: 'Deployed Atmospheric Shield Forcefield Dome.',
      unlocked: hasShield,
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40'
    },
    {
      id: 'mogul',
      title: 'Aetherium Mogul',
      desc: 'Accumulated over $10,000 in treasury capital.',
      unlocked: stats.money >= 10000,
      icon: Coins,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/40'
    },
    {
      id: 'populus',
      title: 'Sky Megacity Founder',
      desc: 'Reached a population of 250+ citizens.',
      unlocked: stats.population >= 250,
      icon: Users,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40'
    },
    {
      id: 'happiness',
      title: 'Civil Utopian Ruler',
      desc: 'Maintained citizen happiness above 85%.',
      unlocked: stats.happiness >= 85,
      icon: Smile,
      color: 'text-rose-400 bg-rose-500/20 border-rose-500/40'
    },
    {
      id: 'monument',
      title: 'Monumental Visionary',
      desc: 'Erected the High Skyward City Landmark Monument.',
      unlocked: hasMonument,
      icon: Landmark,
      color: 'text-purple-400 bg-purple-500/20 border-purple-500/40'
    },
    {
      id: 'builder',
      title: 'Master Urban Planner',
      desc: 'Constructed over 30 city grid tiles.',
      unlocked: totalBuilt >= 30,
      icon: Building,
      color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40'
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
          <div className="relative px-6 py-5 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-400 shadow-lg shadow-purple-500/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">PROFILES LAYER</h2>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-[10px] font-bold uppercase">
                    Mayor Credentials & Badges
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Architect Level {mayorLevel} • {userEmail}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400"
              aria-label="Close Profiles Layer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Mayor Profile Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-purple-950/30 to-slate-950 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-400/50 text-purple-300 shrink-0">
                  <Trophy className="w-8 h-8 text-purple-300" />
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold font-mono text-[10px] shadow-md">
                    LVL {mayorLevel}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-mono text-white">{mayorTitle}</h3>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>

                  {isEditingMotto ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={cityMotto}
                        onChange={(e) => setCityMotto(e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-purple-400 text-xs font-mono text-white focus:outline-none"
                      />
                      <button
                        onClick={() => setIsEditingMotto(false)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-mono text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-purple-200 italic">"{cityMotto}"</p>
                      <button
                        onClick={() => setIsEditingMotto(true)}
                        className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                        title="Edit Motto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-right font-mono">
                  <div className="text-[10px] text-slate-400">Prestige Rank</div>
                  <div className="text-xs font-bold text-amber-400">#1 Sky Metropolis</div>
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div>
              <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Civic Achievements & Badges</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {badges.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        badge.unlocked 
                          ? 'bg-slate-950/70 border-purple-500/40 shadow-lg shadow-purple-500/5' 
                          : 'bg-slate-950/30 border-slate-800/80 opacity-50 grayscale'
                      }`}
                    >
                      <div className={`p-3 rounded-2xl border ${badge.color} shrink-0`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold font-mono text-sm text-white flex items-center gap-1.5">
                            <span>{badge.title}</span>
                            {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </h4>
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                            badge.unlocked 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-snug">
                          {badge.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lifetime Metropolis Career Metrics */}
            <div>
              <h3 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-wider mb-3">
                Architect Career Lifetime Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Tiles Constructed</div>
                  <div className="text-lg font-bold text-white mt-1">{totalBuilt} Tiles</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Citizens Governed</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{stats.population}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Treasury Reserves</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">${stats.money}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Shield Protection</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">{hasShield ? 'ACTIVE' : 'NONE'}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
