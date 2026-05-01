/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem, TileData } from '../types';
import { BUILDINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Users, 
  Calendar, 
  X, 
  Hammer, 
  Store, 
  Factory, 
  TreePine, 
  Map as RoadIcon, 
  Home, 
  Trophy,
  Info,
  ChevronUp,
  ChevronDown,
  ArrowUpCircle,
  CloudRain,
  CloudFog,
  Snowflake,
  Maximize,
  Minimize
} from 'lucide-react';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  hoveredTile: TileData | null;
  weather: { isRaining: boolean, isFoggy: boolean, isSnowing: boolean };
  onToggleWeather: (weather: { isRaining?: boolean, isFoggy?: boolean, isSnowing?: boolean }) => void;
}

const tools = [
  { type: BuildingType.None, icon: X, color: 'text-red-400' },
  { type: BuildingType.Road, icon: RoadIcon, color: 'text-slate-400' },
  { type: BuildingType.Residential, icon: Home, color: 'text-red-300' },
  { type: BuildingType.Commercial, icon: Store, color: 'text-blue-300' },
  { type: BuildingType.Industrial, icon: Factory, color: 'text-yellow-400' },
  { type: BuildingType.Park, icon: TreePine, color: 'text-emerald-400' },
];

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  hoveredTile,
  weather,
  onToggleWeather
}) => {
  const [isGoalExpanded, setIsGoalExpanded] = useState(true);
  const latestNews = newsFeed.length > 0 ? newsFeed[newsFeed.length - 1] : null;

  const [isBuildingPanelExpanded, setIsBuildingPanelExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const showHoverInfo = hoveredTile && hoveredTile.buildingType !== BuildingType.None;
  const hoveredConfig = hoveredTile ? BUILDINGS[hoveredTile.buildingType] : null;
  const currentLevel = hoveredTile?.level || 1;
  const upgradeCost = hoveredConfig ? Math.floor(hoveredConfig.cost * (currentLevel + 0.5)) : 0;
  const canAffordUpgrade = stats.money >= upgradeCost;
  const isMaxLevel = currentLevel >= 5;

  return (
    <div className="absolute inset-0 pointer-events-none p-3 md:p-6 font-sans z-20 flex flex-col items-center">
      
      {/* Tile Info - Top Left Float */}
      <div className="absolute top-4 left-4 pointer-events-auto max-w-[calc(50vw-80px)]">
        <AnimatePresence>
          {showHoverInfo && hoveredConfig && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-slate-950/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
            >
              {/* Panel Header */}
              <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
                onClick={() => setIsBuildingPanelExpanded(!isBuildingPanelExpanded)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/5 rounded-lg">
                    <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{hoveredConfig.name}</h3>
                </div>
                {isBuildingPanelExpanded ? (
                  <ChevronUp className="w-3 h-3 text-slate-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                )}
              </div>

              <AnimatePresence>
                {isBuildingPanelExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 pt-2"
                  >
                    <div className="flex items-center gap-1.5 mb-3">
                       <AnimatePresence mode="wait">
                         <motion.span 
                           key={currentLevel}
                           initial={{ scale: 1.2, color: '#22d3ee' }}
                           animate={{ scale: 1, color: '#94a3b8' }}
                           className="text-[10px] font-medium"
                         >
                           Level {currentLevel}
                         </motion.span>
                       </AnimatePresence>
                       {[...Array(5)].map((_, i) => (
                         <motion.div 
                           key={i} 
                           animate={{ 
                             scale: i === currentLevel - 1 ? [1, 1.5, 1] : 1,
                             backgroundColor: i < currentLevel ? '#22d3ee' : '#334155'
                           }}
                           className="w-1 h-1 rounded-full" 
                         />
                       ))}
                    </div>

                    <div className="space-y-1.5 border-t border-white/5 pt-2">
                      {hoveredConfig.popGen > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Population</span>
                          <span className="text-blue-300 font-mono">+{hoveredConfig.popGen * currentLevel}/day</span>
                        </div>
                      )}
                      {hoveredConfig.incomeGen > 0 && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Income</span>
                          <span className="text-emerald-400 font-mono">+${hoveredConfig.incomeGen * currentLevel}/day</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 space-y-2">
                      {isMaxLevel ? (
                        <div className="flex items-center justify-center gap-1 bg-yellow-500/10 border border-yellow-500/20 py-1 rounded">
                          <Trophy className="w-3 h-3 text-yellow-400" />
                          <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Maximum Level</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Next Upgrade</span>
                             <span className={`text-[10px] font-mono ${canAffordUpgrade ? 'text-white' : 'text-rose-400'}`}>${upgradeCost}</span>
                          </div>
                          {selectedTool === hoveredTile?.buildingType && (
                            <div className="text-[9px] text-cyan-400 font-medium italic leading-tight text-center animate-pulse">
                              Click to Upgrade
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Top Section: Stats Pill */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto flex items-center gap-6 px-6 py-2.5 bg-slate-950/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="font-mono font-bold text-white tracking-tight">${stats.money.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="font-mono font-bold text-white tracking-tight">{stats.population.toLocaleString()}</span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-mono font-bold text-white tracking-tight">Day {stats.day}</span>
        </div>
      </motion.div>

      {/* Advisor & Fullscreen - Top Right Float */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-3 w-64 md:w-80 pointer-events-auto">
        {/* Fullscreen Toggle */}
        <button 
          onClick={toggleFullscreen}
          className="p-2.5 bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all shadow-xl"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        <AnimatePresence mode="wait">
          {aiEnabled && (
            <motion.div 
              layout
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              className={`w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
                currentGoal?.completed 
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                : 'bg-slate-950/40 border-white/10 backdrop-blur-md'
              }`}
            >
              <div 
                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setIsGoalExpanded(!isGoalExpanded)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isGeneratingGoal ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Advisor</span>
                </div>
                {isGoalExpanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
              </div>

              {isGoalExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-3 pb-3"
                >
                  {currentGoal ? (
                    <div className="space-y-2">
                      <p className="text-xs text-white/90 leading-relaxed italic">"{currentGoal.description}"</p>
                      <div className="flex items-center justify-between text-[10px] bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-slate-400 font-medium">Reward: <span className="text-emerald-400 font-mono">${currentGoal.reward}</span></span>
                        {currentGoal.completed && (
                          <motion.button
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaimReward();
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                          >
                            Claim
                          </motion.button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 italic py-1">
                      <div className="w-3 h-3 rounded-full border-2 border-slate-700 border-t-slate-400 animate-spin" />
                      Analyzing metropolis...
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ticker - Bottom Left Float */}
      <div className="absolute bottom-24 lg:bottom-28 left-4 lg:left-6 max-w-[280px] md:max-w-sm pointer-events-auto flex flex-col gap-3">
        {/* Weather Toggles */}
        <div className="flex gap-2">
            <button 
              onClick={() => onToggleWeather({ isRaining: !weather.isRaining })}
              className={`p-2 rounded-lg border backdrop-blur-md transition-all ${weather.isRaining ? 'bg-blue-500/40 border-blue-400 text-white shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-slate-950/40 border-white/10 text-slate-400'}`}
            >
              <CloudRain className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onToggleWeather({ isFoggy: !weather.isFoggy })}
              className={`p-2 rounded-lg border backdrop-blur-md transition-all ${weather.isFoggy ? 'bg-slate-500/40 border-slate-400 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)]' : 'bg-slate-950/40 border-white/10 text-slate-400'}`}
            >
              <CloudFog className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onToggleWeather({ isSnowing: !weather.isSnowing })}
              className={`p-2 rounded-lg border backdrop-blur-md transition-all ${weather.isSnowing ? 'bg-indigo-300/40 border-indigo-200 text-white shadow-[0_0_15px_rgba(165,180,252,0.5)]' : 'bg-slate-950/40 border-white/10 text-slate-400'}`}
            >
              <Snowflake className="w-4 h-4" />
            </button>
        </div>

        <AnimatePresence mode="popLayout">
          {latestNews && (
            <motion.div
              key={latestNews.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`flex items-start gap-2 p-3 rounded-xl border backdrop-blur-md shadow-xl ${
                latestNews.type === 'positive' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200' :
                latestNews.type === 'negative' ? 'bg-rose-950/60 border-rose-500/30 text-rose-200' :
                'bg-slate-950/60 border-white/10 text-slate-200'
              }`}
            >
              <Info className="w-3 h-3 mt-0.5 opacity-50 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">{latestNews.text}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* The Dock - Bottom Center */}
      <div className="mt-auto pointer-events-auto flex flex-col items-center gap-3 pb-4 lg:pb-8">
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 bg-slate-950/40 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {tools.map(({ type, icon: Icon, color }) => {
            const isSelected = selectedTool === type;
            const config = BUILDINGS[type];
            const canAfford = stats.money >= config.cost;

            return (
              <button
                key={type}
                onClick={() => onSelectTool(type)}
                disabled={type !== BuildingType.None && !canAfford}
                className={`
                  relative group flex flex-col items-center p-2.5 md:p-4 rounded-xl md:rounded-2xl transition-all duration-200
                  ${isSelected ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}
                  ${(type !== BuildingType.None && !canAfford) ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-5 h-5 md:w-7 md:h-7 ${isSelected ? 'text-white' : color} transition-colors`} />
                
                {/* Tooltip & Cost */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center">
                  <div className="bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] whitespace-nowrap text-white font-bold shadow-xl">
                    {config.name} {config.cost > 0 && <span className="ml-1 text-slate-400">${config.cost}</span>}
                  </div>
                  <div className="w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45 -mt-1" />
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="dock-indicator"
                    className="absolute -bottom-1 left-2 right-2 h-0.5 bg-white rounded-full shadow-[0_0_8px_white]"
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Tiny Credits */}
      <div className="absolute bottom-1 right-2 text-[8px] text-white/20 font-mono tracking-tighter">
        @SKY_METROPOLIS_V2
      </div>
    </div>
  );
};

export default UIOverlay;