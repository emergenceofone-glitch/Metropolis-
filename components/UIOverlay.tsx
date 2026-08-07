/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem, TileData } from '../types';
import { BUILDINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { CityEfficiencyReport } from './CityEfficiencyReport';
import { CityLeaderboard } from './CityLeaderboard';
import { AetheriumMarketPanel } from './AetheriumMarketPanel';
import { MarketTrendsPanel } from './MarketTrendsPanel';
import { WeatherForecastModal } from './WeatherForecastModal';
import { calculateTileWeatherPenalty } from '../services/weatherForecastService';
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
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Info,
  ChevronUp,
  ChevronDown,
  ArrowUpCircle,
  CloudRain,
  CloudFog,
  Snowflake,
  Compass,
  Smile,
  Percent,
  Maximize,
  Minimize,
  Sparkles,
  Radio,
  Zap,
  Activity,
  BookOpen,
  Bot,
  Play,
  Pause,
  Cpu,
  Contrast,
  ZoomIn,
  Eye,
  Bell,
  AlertTriangle,
  BarChart3,
  LineChart,
  Globe,
  Save,
  User,
  Menu,
  Settings,
  Building,
  Drone
} from 'lucide-react';
import { TriNodeHUD } from './TriNodeHUD';
import { CityChronicle } from './CityChronicle';
import { HomeLayerModal } from './HomeLayerModal';
import { MenuLayerModal } from './MenuLayerModal';
import { SettingsLayerModal } from './SettingsLayerModal';
import { ProfilesLayerModal } from './ProfilesLayerModal';
import { CivilizationCensusModal } from './CivilizationCensusModal';
import { MaterialRefinementModal } from './MaterialRefinementModal';
import { DroneInspectionPanel } from './DroneInspectionPanel';
import { TriNodeState, PhysicalPulse, ChronicleEntry, AetheriumMarketState, MaterialRefinementState } from '../types';

interface UIOverlayProps {
  stats: CityStats;
  taxRate: number;
  onTaxChange: (rate: number) => void;
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
  optimalSpot?: { x: number; y: number; score: number; explanation: string } | null;
  onAutoplace?: () => void;
  isAutoPlayActive?: boolean;
  onToggleAutoPlay?: () => void;
  triNodeState?: TriNodeState;
  onTriggerPulse?: (type: PhysicalPulse['type']) => void;
  onGenerateDirective?: () => void;
  onCompleteDirective?: (id: string, treasuryReward: number) => void;
  isGeneratingDirective?: boolean;
  chronicleEntries?: ChronicleEntry[];
  onAddCustomChronicleNote?: (title: string, description: string) => void;
  isEconomicOverlayActive?: boolean;
  onToggleEconomicOverlay?: () => void;
  isWeatherOverlayActive?: boolean;
  onToggleWeatherOverlay?: () => void;
  onOpenWeatherForecast?: () => void;
  cityHistory?: Array<{ day: number; population: number; income: number; happiness: number }>;
  aetheriumMarket?: AetheriumMarketState;
  onInjectMarketCapital?: (amount: number) => void;
  onSpeculateMarket?: (amount: number) => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  activeWeatherAlert?: { type: string; title: string; description: string; ticksRemaining: number } | null;
  onSaveSnapshot?: () => void;
  onViewAtlas?: () => void;
  onOpenAdvisorChat?: () => void;
  onRestartGame?: () => void;
  grid?: TileData[][];
  refinementState?: MaterialRefinementState;
  onTriggerRefinementSurge?: () => void;
  isDroneActive?: boolean;
  onToggleDroneActive?: () => void;
  isAutoRepairEnabled?: boolean;
  onToggleAutoRepair?: () => void;
  onRepairBuilding?: (x: number, y: number) => void;
  onRepairAllBuildings?: () => void;
  dronePos?: { x: number; y: number } | null;
  autoRepairLog?: Array<{ id: string; buildingName: string; x: number; y: number; cost: number; timestamp: string }>;
}

const tools = [
  { type: BuildingType.None, icon: X, color: 'text-red-400' },
  { type: BuildingType.Road, icon: RoadIcon, color: 'text-slate-400' },
  { type: BuildingType.Residential, icon: Home, color: 'text-red-300' },
  { type: BuildingType.Commercial, icon: Store, color: 'text-blue-300' },
  { type: BuildingType.Industrial, icon: Factory, color: 'text-yellow-400' },
  { type: BuildingType.Park, icon: TreePine, color: 'text-emerald-400' },
  { type: BuildingType.Monument, icon: Landmark, color: 'text-purple-400' },
  { type: BuildingType.AtmosphericShield, icon: ShieldCheck, color: 'text-cyan-400' },
];

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  taxRate,
  onTaxChange,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  hoveredTile,
  weather,
  onToggleWeather,
  optimalSpot,
  onAutoplace,
  isAutoPlayActive = false,
  onToggleAutoPlay,
  triNodeState,
  onTriggerPulse,
  onGenerateDirective,
  onCompleteDirective,
  isGeneratingDirective,
  chronicleEntries = [],
  onAddCustomChronicleNote,
  isEconomicOverlayActive = false,
  onToggleEconomicOverlay,
  isWeatherOverlayActive = false,
  onToggleWeatherOverlay,
  onOpenWeatherForecast,
  cityHistory = [],
  aetheriumMarket,
  onInjectMarketCapital,
  onSpeculateMarket,
  isPaused = false,
  onTogglePause,
  activeWeatherAlert,
  onSaveSnapshot,
  onViewAtlas,
  onOpenAdvisorChat,
  onRestartGame,
  grid = [],
  refinementState = {
    refinedAetheriumProduction: 0,
    refinedAetheriumDemand: 0,
    satisfactionRatio: 1.0,
    qualityOfLifeMultiplier: 1.0,
    industrialBuildingCount: 0,
    commercialHubCount: 0,
    purityTier: 'Standard',
    surgeActive: false,
    surgeDaysRemaining: 0,
    history: []
  },
  onTriggerRefinementSurge,
  isDroneActive = true,
  onToggleDroneActive = () => {},
  isAutoRepairEnabled = true,
  onToggleAutoRepair = () => {},
  onRepairBuilding = () => {},
  onRepairAllBuildings = () => {},
  dronePos = null,
  autoRepairLog = []
}) => {
  const [isGoalExpanded, setIsGoalExpanded] = useState(true);
  const latestNews = newsFeed.length > 0 ? newsFeed[newsFeed.length - 1] : null;

  const [activeLayer, setActiveLayer] = useState<'home' | 'menu' | 'settings' | 'profiles' | null>(null);
  const [isBuildingPanelExpanded, setIsBuildingPanelExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTriNodeOpen, setIsTriNodeOpen] = useState(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);
  const [isEfficiencyReportOpen, setIsEfficiencyReportOpen] = useState(false);
  const [efficiencyReportTab, setEfficiencyReportTab] = useState<'all' | 'population' | 'income' | 'happiness'>('all');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isMarketTrendsOpen, setIsMarketTrendsOpen] = useState(false);
  const [isDroneInspectionOpen, setIsDroneInspectionOpen] = useState(false);
  const [isWeatherForecastOpen, setIsWeatherForecastOpen] = useState(false);
  const [isCensusOpen, setIsCensusOpen] = useState(false);
  const [isRefinementOpen, setIsRefinementOpen] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isEnlargedUI, setIsEnlargedUI] = useState(false);
  const [dismissedNewsId, setDismissedNewsId] = useState<string | null>(null);

  const weatherStats = React.useMemo(() => {
    if (!grid) return { severe: 0, moderate: 0, protected: 0, total: 0 };
    let severe = 0;
    let moderate = 0;
    let protectedCount = 0;
    let total = 0;

    grid.flat().forEach(tile => {
      if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
        total++;
        const penalty = calculateTileWeatherPenalty(tile, grid, weather, activeWeatherAlert || null);
        if (penalty.statusCategory === 'severe') severe++;
        else if (penalty.statusCategory === 'moderate') moderate++;
        else protectedCount++;
      }
    });

    return { severe, moderate, protected: protectedCount, total };
  }, [grid, weather, activeWeatherAlert]);

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
    <div className={`absolute inset-0 pointer-events-none p-3 md:p-5 font-sans z-20 flex flex-col justify-between transition-all duration-300 ${
      isEnlargedUI ? 'scale-[1.08] origin-top' : 'scale-100'
    } ${isHighContrast ? 'contrast-[1.25] saturate-[1.2]' : ''}`}>
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER FIELD & SIDE PANELS ROW WITH STRICT COLLISION PROTECTION   */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-col xl:flex-row items-center xl:items-start justify-between gap-3 pointer-events-none z-30">
        
        {/* TOP LEFT: Hovered Tile Info Panel */}
        <div className="pointer-events-auto min-w-[220px] max-w-xs md:max-w-sm shrink-0 self-start">
          <AnimatePresence>
            {showHoverInfo && hoveredConfig && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className={`${
                  isHighContrast 
                    ? 'bg-slate-950 border-2 border-white text-white' 
                    : 'bg-slate-950/85 backdrop-blur-md border border-white/20'
                } rounded-2xl overflow-hidden shadow-2xl`}
              >
                {/* Panel Header */}
                <div 
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors border-b border-white/10"
                  onClick={() => setIsBuildingPanelExpanded(!isBuildingPanelExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{hoveredConfig.name}</h3>
                  </div>
                  {isBuildingPanelExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                             className="text-xs font-medium"
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
                             className="w-1.5 h-1.5 rounded-full" 
                           />
                         ))}
                      </div>

                      <div className="space-y-1.5 border-t border-white/10 pt-2">
                        {hoveredConfig.popGen > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300">Population</span>
                            <span className="text-blue-300 font-mono font-bold">+{hoveredConfig.popGen * currentLevel}/day</span>
                          </div>
                        )}
                        {hoveredConfig.incomeGen > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-300">Income</span>
                            <span className="text-emerald-400 font-mono font-bold">+${hoveredConfig.incomeGen * currentLevel}/day</span>
                          </div>
                        )}
                        {hoveredTile && hoveredTile.buildingType !== BuildingType.None && (
                          <div className="flex justify-between items-center text-xs pt-0.5">
                            <span className="text-slate-300 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Resilience
                            </span>
                            <span className="text-cyan-300 font-mono font-bold text-[11px]">
                              {(hoveredTile.resilienceLevel && hoveredTile.resilienceLevel >= 3) || hoveredTile.isResilient
                                ? 'Tier 3 (100% Immune)'
                                : hoveredTile.resilienceLevel === 2
                                ? 'Tier 2 (80% Shielded)'
                                : hoveredTile.resilienceLevel === 1
                                ? 'Tier 1 (50% Sealed)'
                                : 'Tier 0 (Vulnerable)'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10 space-y-2">
                        {isMaxLevel ? (
                          <div className="flex items-center justify-center gap-1 bg-yellow-500/10 border border-yellow-500/30 py-1 rounded-lg">
                            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Maximum Level</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                               <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Next Upgrade</span>
                               <span className={`text-xs font-mono font-bold ${canAffordUpgrade ? 'text-white' : 'text-rose-400'}`}>${upgradeCost}</span>
                            </div>
                            {selectedTool === hoveredTile?.buildingType && (
                              <div className="text-[10px] text-cyan-400 font-semibold italic leading-tight text-center animate-pulse">
                                Click Tile to Upgrade
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

        {/* TOP CENTER: Navigation Layer Switcher Bar & Key Statistics Pill */}
        <div className="pointer-events-auto flex flex-col items-center gap-2 max-w-full z-40 my-1 xl:my-0">
          {/* Main Navigation Layer Switcher Tabs */}
          <motion.div 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-1.5 p-1.5 bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
            role="tablist"
            aria-label="Navigation Layers"
          >
            <button
              role="tab"
              aria-selected={activeLayer === 'home'}
              onClick={() => setActiveLayer(activeLayer === 'home' ? null : 'home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'home'
                  ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30 border border-sky-300'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Home Layer - Central Command & Metropolis Overview"
            >
              <Home className="w-3.5 h-3.5" />
              <span>HOME</span>
            </button>

            <button
              role="tab"
              aria-selected={activeLayer === 'menu'}
              onClick={() => setActiveLayer(activeLayer === 'menu' ? null : 'menu')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'menu'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Menu Layer - Central Systems Directory & Market"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>MENU</span>
            </button>

            <button
              role="tab"
              aria-selected={activeLayer === 'settings'}
              onClick={() => setActiveLayer(activeLayer === 'settings' ? null : 'settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'settings'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 border border-cyan-300'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Settings Layer - Audio, Graphics & Simulation Preferences"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SETTINGS</span>
            </button>

            <button
              role="tab"
              aria-selected={activeLayer === 'profiles'}
              onClick={() => setActiveLayer(activeLayer === 'profiles' ? null : 'profiles')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                activeLayer === 'profiles'
                  ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/30 border border-purple-300'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Profiles Layer - Mayor Profile, Career Badges & Achievements"
            >
              <User className="w-3.5 h-3.5" />
              <span>PROFILES</span>
            </button>
          </motion.div>

          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            role="region"
            aria-label="City Key Statistics"
            className={`flex flex-wrap items-center justify-center gap-3.5 md:gap-5 px-5 md:px-6 py-2.5 rounded-full border shadow-2xl transition-colors max-w-[calc(100vw-32px)] ${
              isHighContrast
                ? 'bg-slate-950 border-2 border-white text-white'
                : 'bg-slate-950/85 backdrop-blur-md border-white/20'
            }`}
          >
            <button 
              onClick={() => {
                setEfficiencyReportTab('income');
                setIsEfficiencyReportOpen(true);
              }}
              className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-xl transition-all cursor-pointer" 
              title="Treasury Balance (Click for Income Analytics)"
            >
              <Coins className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="font-mono font-bold text-white tracking-tight text-sm md:text-base">${(stats?.money ?? 0).toLocaleString()}</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <button 
              onClick={() => setIsCensusOpen(true)}
              className="flex items-center gap-2 hover:bg-cyan-500/20 px-2 py-1 rounded-xl border border-transparent hover:border-cyan-400/40 transition-all cursor-pointer group" 
              title="City Population & Civilization Census - Click to view Demographics & Dynamic Scaling"
            >
              <Users className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-mono font-bold text-white tracking-tight text-sm md:text-base font-mono">{(stats?.population ?? 0).toLocaleString()}</span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-400/30 hidden lg:inline flex items-center gap-1">
                <span>Census</span>
              </span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <button 
              onClick={() => {
                setEfficiencyReportTab('happiness');
                setIsEfficiencyReportOpen(true);
              }}
              className="flex items-center gap-2 hover:bg-white/10 px-2 py-1 rounded-xl transition-all cursor-pointer" 
              title="Resident Happiness Rating (Click for Happiness Analytics)"
            >
              <Smile className={`w-4 h-4 shrink-0 ${stats.happiness > 70 ? 'text-emerald-400' : stats.happiness > 40 ? 'text-yellow-400' : 'text-rose-400'}`} />
              <span className="font-mono font-bold text-white tracking-tight text-sm md:text-base">{Math.round(stats.happiness)}%</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="flex flex-col items-center gap-0.5" title={`City Level ${stats.cityLevel}`}>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-mono font-bold text-white text-xs tracking-tight">LVL {stats.cityLevel}</span>
              </div>
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ width: `${(stats.experience / (stats.cityLevel * 500)) * 100}%` }}
                   className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                 />
              </div>
            </div>
            <div className="w-px h-4 bg-white/20 hidden sm:block" />
            <div className="flex items-center gap-2" title="Simulation Calendar Day">
              <Calendar className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="font-mono font-bold text-white tracking-tight text-sm md:text-base">Day {stats.day}</span>
            </div>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsChronicleOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 rounded-full text-amber-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-amber-500/10 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              aria-label={`Open City Chronicle with ${chronicleEntries.length} log entries`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>CHRONICLE ({chronicleEntries.length})</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsEfficiencyReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-full text-cyan-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              aria-label="Open City Efficiency Report"
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>EFFICIENCY REPORT</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 rounded-full text-yellow-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-yellow-500/10 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:outline-none"
              aria-label="Open Metropolitan Leaderboard"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>LEADERBOARD</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsDroneInspectionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 rounded-full text-emerald-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-emerald-500/10 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              aria-label="Open Drone Inspection and Auto-Repair Sweep Panel"
              title="Open Drone Inspection LiDAR Sweep"
            >
              <Drone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DRONE INSPECT {isAutoRepairEnabled ? '(AUTO-REPAIR)' : ''}</span>
            </button>

            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsMarketOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 rounded-full text-purple-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-purple-500/10 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
              aria-label="Open Aetherium Commodity Market"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>MARKET {aetheriumMarket ? `($${aetheriumMarket.currentPrice.toFixed(0)})` : ''}</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsMarketTrendsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-400/60 rounded-full text-purple-200 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-purple-500/10 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
              aria-label="Open Market Trends D3 Volatility Chart"
              title="Open Market Trends D3 Volatility Chart"
            >
              <LineChart className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>MARKET TRENDS</span>
            </button>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <button
              onClick={() => setIsRefinementOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/50 rounded-full text-cyan-200 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
              aria-label="Open Material Refinement Pipeline"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>REFINED QoL (+{Math.round((refinementState.qualityOfLifeMultiplier - 1.0) * 100)}%)</span>
            </button>

            {onToggleAutoPlay && (
              <>
                <div className="w-px h-4 bg-white/20 hidden md:block" />
                <button
                  onClick={onToggleAutoPlay}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full transition-all font-mono text-xs font-bold cursor-pointer shadow-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                    isAutoPlayActive
                      ? 'bg-emerald-500/30 hover:bg-emerald-500/40 border-emerald-400 text-emerald-200 shadow-emerald-500/20 animate-pulse'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 border-white/20 text-slate-200 hover:text-white'
                  }`}
                  title="Toggle Autonomous Mayor AI Auto-Play Mode"
                  aria-label="Toggle Autonomous Mayor AI Auto-Play Mode"
                >
                  <Bot className={`w-3.5 h-3.5 ${isAutoPlayActive ? 'text-emerald-400 animate-bounce' : 'text-slate-300'}`} />
                  <span>AUTO PLAY: {isAutoPlayActive ? 'ON' : 'OFF'}</span>
                </button>
              </>
            )}
            {triNodeState && (
              <>
                <div className="w-px h-4 bg-white/20 hidden md:block" />
                <button
                  onClick={() => setIsTriNodeOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded-full text-cyan-300 transition-all font-mono text-xs font-bold cursor-pointer shadow-md shadow-cyan-500/10 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                  aria-label={`Open Tri-Node Ecosystem panel, current multiplier ${triNodeState.ecosystemMultiplier}x`}
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>TRI-NODE ({triNodeState.ecosystemMultiplier}x)</span>
                </button>
              </>
            )}
            {activeWeatherAlert && (
              <>
                <div className="w-px h-4 bg-white/20 hidden md:block" />
                <button 
                  onClick={() => setIsWeatherForecastOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 rounded-full text-rose-300 transition-all font-mono text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
                  title="Click to View Weather Forecast & Crisis Telemetry"
                  aria-label="Pending weather event countdown - Click to view forecast"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>{activeWeatherAlert.title.toUpperCase()} IN {activeWeatherAlert.ticksRemaining * 2}s</span>
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* TOP RIGHT: Controls, Accessibility & Advisor Panel */}
        <div className="pointer-events-auto flex flex-col items-end gap-3 min-w-[220px] max-w-xs md:max-w-sm shrink-0 self-start xl:self-auto">
          <div className="flex items-center gap-2.5 md:gap-3.5 flex-wrap justify-end">
            {/* High Contrast Mode Toggle */}
            <button 
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`p-2.5 rounded-xl border transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
                isHighContrast 
                  ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-amber-400/20' 
                  : 'bg-slate-950/70 backdrop-blur-md border-white/20 text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle High-Contrast Accessibility Mode (WCAG AAA Contrast Ratio)"
              aria-label="Toggle High-Contrast Accessibility Mode"
            >
              <Contrast className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase">{isHighContrast ? 'CONTRAST ON' : 'CONTRAST'}</span>
            </button>

            {/* UI Scale Ratio Toggle */}
            <button 
              onClick={() => setIsEnlargedUI(!isEnlargedUI)}
              className={`p-2.5 rounded-xl border transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
                isEnlargedUI 
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-cyan-500/20' 
                  : 'bg-slate-950/70 backdrop-blur-md border-white/20 text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle Large UI Scale Ratio (120% Enlarged Text & Touch Targets)"
              aria-label="Toggle Large UI Scale Ratio"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-xs font-bold font-mono uppercase">{isEnlargedUI ? '120%' : '100%'}</span>
            </button>

            {/* Tax Control */}
            <div className="group relative">
              <button 
                className="p-2.5 bg-slate-950/80 backdrop-blur-md rounded-xl border border-cyan-500/30 text-slate-200 hover:text-white hover:border-cyan-400 transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none cursor-pointer"
                aria-label={`Tax Rate ${taxRate} percent`}
              >
                <Percent className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono text-white">TAX: {taxRate}%</span>
              </button>
              
              <div className="absolute right-0 top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 p-4 bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-cyan-500/40 shadow-2xl min-w-[240px] z-50 pointer-events-none group-hover:pointer-events-auto">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">Municipal Tax Policy</span>
                   <span className="text-sm font-mono font-extrabold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                     {taxRate}%
                   </span>
                 </div>

                 {/* Interactive Tax Range Slider */}
                 <input 
                   type="range" 
                   min="1" 
                   max="25" 
                   value={taxRate} 
                   onChange={(e) => onTaxChange(parseInt(e.target.value))}
                   className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400"
                   aria-label="Adjust Municipal Tax Rate"
                 />

                 {/* Quick Preset Badges */}
                 <div className="flex items-center justify-between gap-1 my-3">
                   {[
                     { rate: 5, label: '5% Low' },
                     { rate: 10, label: '10% Norm' },
                     { rate: 15, label: '15% High' },
                     { rate: 20, label: '20% Max' },
                   ].map((preset) => (
                     <button
                       key={preset.rate}
                       onClick={() => onTaxChange(preset.rate)}
                       className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                         taxRate === preset.rate
                           ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md'
                           : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800 hover:text-white'
                       }`}
                     >
                       {preset.label}
                     </button>
                   ))}
                 </div>

                 {/* Projected Impact Readout */}
                 <div className="p-2.5 bg-slate-900/90 rounded-xl border border-white/10 text-[11px] font-mono space-y-1">
                   <div className="flex justify-between text-slate-300">
                     <span>Treasury Yield:</span>
                     <span className={taxRate >= 10 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                       {taxRate >= 10 ? `+${((taxRate - 10) * 10)}%` : `-${((10 - taxRate) * 10)}%`}
                     </span>
                   </div>
                   <div className="flex justify-between text-slate-300">
                     <span>Resident Happiness:</span>
                     <span className={taxRate <= 10 ? 'text-emerald-400 font-bold' : taxRate > 15 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                       {taxRate <= 10 ? `+${(10 - taxRate) * 2}` : `-${(taxRate - 10) * 2}`}
                     </span>
                   </div>
                 </div>
              </div>
            </div>

            {/* Atlas Interactions */}
            {onViewAtlas && (
              <button 
                onClick={onViewAtlas}
                className="p-2.5 bg-indigo-900/50 backdrop-blur-md rounded-xl border border-indigo-500/50 text-indigo-300 hover:text-white hover:bg-indigo-600/50 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                title="View Global Atlas"
                aria-label="View Global Atlas"
              >
                <Globe className="w-5 h-5" />
              </button>
            )}
            
            {onSaveSnapshot && (
              <button 
                onClick={onSaveSnapshot}
                className="p-2.5 bg-emerald-900/50 backdrop-blur-md rounded-xl border border-emerald-500/50 text-emerald-300 hover:text-white hover:bg-emerald-600/50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                title="Save Snapshot to Atlas"
                aria-label="Save Snapshot to Atlas"
              >
                <Save className="w-5 h-5" />
              </button>
            )}

            {/* AdvisorAI Chat Toggle */}
            {onOpenAdvisorChat && (
              <button
                onClick={onOpenAdvisorChat}
                className="p-2.5 bg-gradient-to-r from-cyan-600/80 to-blue-600/80 backdrop-blur-md rounded-xl border border-cyan-400/60 text-white hover:brightness-125 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none cursor-pointer flex items-center gap-1.5"
                title="Open AdvisorAI Chatbot"
                aria-label="Open AdvisorAI Chatbot"
              >
                <Bot className="w-5 h-5 text-cyan-200 animate-pulse" />
                <span className="text-xs font-bold font-mono uppercase hidden sm:inline text-cyan-100">AdvisorAI</span>
              </button>
            )}

            {/* Play/Pause Toggle */}
            {onTogglePause && (
              <button 
                onClick={onTogglePause}
                className={`p-2.5 backdrop-blur-md rounded-xl border transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
                  isPaused 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
                    : 'bg-slate-950/70 text-slate-200 border-white/20 hover:bg-white/10 hover:text-white'
                }`}
                title={isPaused ? "Resume Game" : "Pause Game"}
                aria-label={isPaused ? "Resume Game" : "Pause Game"}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="p-2.5 bg-slate-950/70 backdrop-blur-md rounded-xl border border-white/20 text-slate-200 hover:text-white hover:bg-white/10 transition-all shadow-xl focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

            {/* Weather Heatmap Overlay Toggle */}
            {onToggleWeatherOverlay && (
              <button 
                onClick={onToggleWeatherOverlay}
                className={`p-2.5 rounded-xl border transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none cursor-pointer ${
                  isWeatherOverlayActive 
                    ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' 
                    : 'bg-slate-950/70 backdrop-blur-md border-white/20 text-slate-200 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Weather Penalty Heatmap Overlay (Highlights grid tiles suffering severe weather penalties & vulnerability)"
                aria-label="Toggle Weather Penalty Heatmap Overlay"
              >
                <ShieldAlert className="w-4 h-4 text-rose-300" />
                <span className="text-xs font-bold font-mono uppercase">{isWeatherOverlayActive ? 'WEATHER HEATMAP: ON' : 'WEATHER HEATMAP'}</span>
              </button>
            )}

            {/* Economic Heatmap Overlay Toggle */}
            {onToggleEconomicOverlay && (
              <button 
                onClick={onToggleEconomicOverlay}
                className={`p-2.5 rounded-xl border transition-all shadow-xl flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none cursor-pointer ${
                  isEconomicOverlayActive 
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-emerald-500/20' 
                    : 'bg-slate-950/70 backdrop-blur-md border-white/20 text-slate-200 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Economic Heatmap Overlay (Shades tiles by economic output to identify low-performing zones)"
                aria-label="Toggle Economic Heatmap Overlay"
              >
                <Coins className="w-4 h-4" />
                <span className="text-xs font-bold font-mono uppercase">{isEconomicOverlayActive ? 'ECO OVERLAY: ON' : 'ECO OVERLAY'}</span>
              </button>
            )}
          </div>

          {/* Weather Heatmap Legend */}
          {isWeatherOverlayActive && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full p-3 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-rose-500/50 shadow-2xl flex flex-col gap-2 text-xs text-slate-200"
            >
              <div className="flex items-center justify-between font-bold text-rose-400">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="uppercase font-mono text-[11px] tracking-wider">Weather Incident Heatmap</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px]">
                  {weatherStats.severe} Vulnerable
                </span>
              </div>

              <p className="text-[10px] text-slate-300 leading-tight">
                Grid tiles color-coded by weather output loss & shield protection:
              </p>

              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                <div className="flex flex-col gap-0.5 bg-rose-500/20 border border-rose-500/40 p-1.5 rounded text-rose-300">
                  <div className="flex items-center gap-1 font-bold">
                    <div className="w-2 h-2 rounded bg-rose-500 shrink-0 animate-ping" />
                    <span>Severe (-20%+)</span>
                  </div>
                  <span className="text-[10px] text-rose-200 font-bold">{weatherStats.severe} tiles</span>
                </div>

                <div className="flex flex-col gap-0.5 bg-amber-500/20 border border-amber-500/40 p-1.5 rounded text-amber-300">
                  <div className="flex items-center gap-1 font-bold">
                    <div className="w-2 h-2 rounded bg-amber-400 shrink-0" />
                    <span>Mod (-5..19%)</span>
                  </div>
                  <span className="text-[10px] text-amber-200 font-bold">{weatherStats.moderate} tiles</span>
                </div>

                <div className="flex flex-col gap-0.5 bg-emerald-500/20 border border-emerald-500/40 p-1.5 rounded text-emerald-300">
                  <div className="flex items-center gap-1 font-bold">
                    <div className="w-2 h-2 rounded bg-emerald-400 shrink-0" />
                    <span>Safe (0%)</span>
                  </div>
                  <span className="text-[10px] text-emerald-200 font-bold">{weatherStats.protected} tiles</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                <span className="text-slate-400">Action Needed:</span>
                <span className="text-sky-300 font-medium">Build Shield Domes or Resilience Tier 3</span>
              </div>

              <button
                onClick={() => setIsWeatherForecastOpen(true)}
                className="w-full mt-0.5 py-1.5 px-2 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-400/50 rounded-xl text-sky-200 font-bold font-mono text-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                <span>View 3-Day Weather Forecast</span>
              </button>
            </motion.div>
          )}

          {/* Economic Heatmap Legend */}
          {isEconomicOverlayActive && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full p-3 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-emerald-500/40 shadow-xl flex flex-col gap-1.5 text-xs text-slate-200"
            >
              <div className="flex items-center justify-between font-bold text-emerald-400">
                <span className="uppercase font-mono text-[11px] tracking-wider">Economic Heatmap</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">Shading tiles by economic output per day:</p>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-mono">
                <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 px-1.5 py-1 rounded text-rose-300">
                  <div className="w-2 h-2 rounded bg-rose-500 shrink-0" />
                  <span>Low / $0</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 px-1.5 py-1 rounded text-amber-300">
                  <div className="w-2 h-2 rounded bg-amber-400 shrink-0" />
                  <span>Mod</span>
                </div>
                <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/40 px-1.5 py-1 rounded text-cyan-300">
                  <div className="w-2 h-2 rounded bg-cyan-400 shrink-0" />
                  <span>High</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Advisor Panel */}
          <AnimatePresence mode="wait">
            {aiEnabled && (
              <motion.div 
                layout
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className={`w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
                  currentGoal?.completed 
                  ? 'bg-emerald-950/50 border-emerald-500/60 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-950/75 border-white/20 backdrop-blur-md'
                }`}
              >
                <div 
                  className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setIsGoalExpanded(!isGoalExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isGeneratingGoal ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300">City Advisor</span>
                  </div>
                  {isGoalExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
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
                        <p className="text-xs text-white/95 leading-relaxed italic">"{currentGoal.description}"</p>
                        <div className="flex items-center justify-between text-xs bg-white/10 p-2 rounded-xl border border-white/10">
                          <span className="text-slate-300 font-medium">Reward: <span className="text-emerald-400 font-mono font-bold">${currentGoal.reward}</span></span>
                          {currentGoal.completed && (
                            <motion.button
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onClaimReward();
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-white px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
                            >
                              Claim
                            </motion.button>
                          )}
                        </div>
                        {onOpenAdvisorChat && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAdvisorChat();
                            }}
                            className="w-full mt-2 py-1.5 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 hover:border-cyan-400/70 rounded-xl text-cyan-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Chat with AdvisorAI</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin" />
                        Analyzing metropolis...
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEPARATED NOTIFICATION WIDGET (ALERT DECK & ATMOSPHERIC CONTROL)        */}
      {/* ========================================================================= */}
      <div className="pointer-events-auto self-start my-auto max-w-sm md:max-w-md w-full flex flex-col gap-2.5 z-30">
        
        {/* A. Autonomous Mayor Active Banner */}
        <AnimatePresence>
          {isAutoPlayActive && (
            <motion.div
              initial={{ y: -15, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -15, opacity: 0, scale: 0.95 }}
              className="px-4 py-2 bg-slate-950/90 backdrop-blur-md border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-3 text-xs font-mono font-bold text-emerald-200 shadow-2xl shadow-emerald-500/20"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">AUTONOMOUS MAYOR AI ACTIVE</span>
              </div>
              {onToggleAutoPlay && (
                <button
                  onClick={onToggleAutoPlay}
                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 rounded-lg border border-emerald-400/50 text-[10px] uppercase tracking-wider text-emerald-100 cursor-pointer transition-colors"
                  aria-label="Pause Auto Play"
                >
                  PAUSE
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* B. Live News & Municipal Notification Card */}
        <AnimatePresence mode="popLayout">
          {latestNews && dismissedNewsId !== latestNews.id && (
            <motion.div
              key={latestNews.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col gap-1.5 transition-all ${
                latestNews.type === 'positive' ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-100 shadow-emerald-500/10' :
                latestNews.type === 'negative' ? 'bg-rose-950/85 border-rose-500/50 text-rose-100 shadow-rose-500/10' :
                'bg-slate-950/85 border-white/20 text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>MUNICIPAL ALERT</span>
                </div>
                <button 
                  onClick={() => setDismissedNewsId(latestNews.id)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-medium leading-relaxed">{latestNews.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* C. Weather Environment Controls Bar */}
        <div className="flex items-center gap-2.5 md:gap-3.5 bg-slate-950/80 backdrop-blur-md p-2.5 md:p-3 rounded-2xl border border-white/20 shadow-xl w-fit">
            <button 
              onClick={() => setIsWeatherForecastOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-600/80 to-blue-600/80 hover:from-sky-500 hover:to-blue-500 border border-sky-400/60 text-white transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
              title="View 3-Day Weather Forecast & Defense Rating"
              aria-label="View 3-Day Weather Forecast"
            >
              <Compass className="w-4 h-4 text-sky-200" />
              <span className="text-[10px] font-mono font-bold uppercase text-sky-100">3-Day Forecast</span>
            </button>
            <div className="w-px h-5 bg-white/20" />
            <button 
              onClick={() => onToggleWeather({ isRaining: !weather.isRaining })}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                weather.isRaining ? 'bg-blue-500/40 border-blue-400 text-white shadow-[0_0_15px_rgba(96,165,250,0.5)]' : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle Rain Effect"
              aria-label="Toggle Rain Effect"
            >
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-mono font-bold uppercase">{weather.isRaining ? 'RAIN' : 'DRY'}</span>
            </button>
            <button 
              onClick={() => onToggleWeather({ isFoggy: !weather.isFoggy })}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                weather.isFoggy ? 'bg-slate-500/40 border-slate-300 text-white shadow-[0_0_15px_rgba(148,163,184,0.5)]' : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle Fog Effect"
              aria-label="Toggle Fog Effect"
            >
              <CloudFog className="w-4 h-4 text-slate-300" />
              <span className="text-[10px] font-mono font-bold uppercase">{weather.isFoggy ? 'FOG' : 'CLEAR'}</span>
            </button>
            <button 
              onClick={() => onToggleWeather({ isSnowing: !weather.isSnowing })}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                weather.isSnowing ? 'bg-indigo-300/40 border-indigo-200 text-white shadow-[0_0_15px_rgba(165,180,252,0.5)]' : 'bg-slate-900/60 border-white/10 text-slate-300 hover:text-white'
              }`}
              title="Toggle Snow Effect"
              aria-label="Toggle Snow Effect"
            >
              <Snowflake className="w-4 h-4 text-indigo-300" />
              <span className="text-[10px] font-mono font-bold uppercase">{weather.isSnowing ? 'SNOW' : 'WARM'}</span>
            </button>
        </div>
      </div>

      {/* The Dock - Bottom Center */}
      <div className="mt-auto pointer-events-auto flex flex-col items-center gap-3 pb-4 lg:pb-8">
        <AnimatePresence mode="wait">
          {selectedTool !== BuildingType.None && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.15)] max-w-xs md:max-w-md text-center"
            >
              <div className="flex flex-col gap-0.5 animate-fade-in">
                <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Optimal Placement Advisory
                </span>
                {optimalSpot ? (
                  <span className="text-[10px] text-slate-300 font-medium leading-tight">
                    "{optimalSpot.explanation}"
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-300 font-medium leading-tight">
                    Grid is full or no vacant locations match.
                  </span>
                )}
              </div>
              
              {optimalSpot && (
                <button
                  onClick={onAutoplace}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all text-[10px] font-bold text-slate-950 rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/10 border border-amber-300/20 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Place {BUILDINGS[selectedTool].name} (${BUILDINGS[selectedTool].cost})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          role="toolbar"
          aria-label="Building Tools Palette"
          className={`flex items-center gap-2 md:gap-3.5 p-2.5 md:p-3.5 rounded-2xl md:rounded-3xl border shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-colors ${
            isHighContrast
              ? 'bg-slate-950 border-2 border-white'
              : 'bg-slate-950/80 backdrop-blur-xl border-white/20'
          }`}
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
                aria-label={`Select tool ${config.name}, cost ${config.cost > 0 ? '$' + config.cost : 'free'}`}
                aria-pressed={isSelected}
                className={`
                  relative group flex flex-col items-center justify-center p-3 md:p-4 min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px] rounded-xl md:rounded-2xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none
                  ${isSelected ? (isHighContrast ? 'bg-amber-400 text-slate-950 shadow-lg' : 'bg-white/20 shadow-inner') : 'hover:bg-white/10'}
                  ${(type !== BuildingType.None && !canAfford) ? 'opacity-35 cursor-not-allowed grayscale' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-6 h-6 md:w-8 md:h-8 ${isSelected ? (isHighContrast ? 'text-slate-950' : 'text-white') : color} transition-colors`} />
                
                {/* Tooltip & Cost */}
                <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center z-50">
                  <div className="bg-slate-950 border-2 border-white/40 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap text-white font-bold shadow-2xl">
                    {config.name} {config.cost > 0 && <span className="ml-1 text-cyan-300 font-mono">${config.cost}</span>}
                  </div>
                  <div className="w-2.5 h-2.5 bg-slate-950 border-r-2 border-b-2 border-white/40 rotate-45 -mt-1.5" />
                </div>

                {isSelected && (
                  <motion.div 
                    layoutId="dock-indicator"
                    className="absolute -bottom-1 left-2 right-2 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"
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

      {/* Tri-Node Multi-Tier Ecosystem HUD Panel */}
      <AnimatePresence>
        {isTriNodeOpen && triNodeState && onTriggerPulse && onGenerateDirective && onCompleteDirective && (
          <TriNodeHUD
            triNodeState={triNodeState}
            onTriggerPulse={onTriggerPulse}
            onGenerateDirective={onGenerateDirective}
            onCompleteDirective={onCompleteDirective}
            isGeneratingDirective={!!isGeneratingDirective}
            onClose={() => setIsTriNodeOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* City Chronicle Modal */}
      <AnimatePresence>
        {isChronicleOpen && (
          <CityChronicle
            chronicleEntries={chronicleEntries}
            currentDay={stats.day}
            population={stats.population}
            cityLevel={stats.cityLevel}
            onClose={() => setIsChronicleOpen(false)}
            onAddCustomNote={onAddCustomChronicleNote}
          />
        )}
      </AnimatePresence>

      {/* City Efficiency Report Modal */}
      <AnimatePresence>
        {isEfficiencyReportOpen && (
          <CityEfficiencyReport
            history={cityHistory}
            initialTab={efficiencyReportTab}
            onClose={() => setIsEfficiencyReportOpen(false)}
            onOpenCensus={() => setIsCensusOpen(true)}
            onOpenAdvisorAI={onOpenAdvisorChat}
            onOpenMarket={() => setIsMarketOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Metropolitan Leaderboard Modal */}
      <AnimatePresence>
        {isLeaderboardOpen && (
          <CityLeaderboard
            stats={stats}
            onClose={() => setIsLeaderboardOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Aetherium Market Panel Modal */}
      <AnimatePresence>
        {isMarketOpen && aetheriumMarket && (
          <AetheriumMarketPanel
            marketState={aetheriumMarket}
            onClose={() => setIsMarketOpen(false)}
            onInjectCapital={onInjectMarketCapital}
            onSpeculateMarket={onSpeculateMarket}
            playerMoney={stats.money}
            onOpenCensus={() => setIsCensusOpen(true)}
            onOpenAdvisorAI={onOpenAdvisorChat}
            onOpenEfficiencyReport={() => setIsEfficiencyReportOpen(true)}
            onOpenMarketTrends={() => {
              setIsMarketOpen(false);
              setIsMarketTrendsOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Dedicated D3 Market Trends Panel Modal */}
      <AnimatePresence>
        {isMarketTrendsOpen && aetheriumMarket && (
          <MarketTrendsPanel
            marketState={aetheriumMarket}
            onClose={() => setIsMarketTrendsOpen(false)}
            onInjectCapital={onInjectMarketCapital}
            onSpeculateMarket={onSpeculateMarket}
            playerMoney={stats.money}
          />
        )}
      </AnimatePresence>

      {/* Metropolitan Drone Inspection Panel Modal */}
      <AnimatePresence>
        {isDroneInspectionOpen && (
          <DroneInspectionPanel
            grid={grid}
            stats={stats}
            isAutoRepairEnabled={isAutoRepairEnabled}
            onToggleAutoRepair={onToggleAutoRepair}
            isDroneActive={isDroneActive}
            onToggleDroneActive={onToggleDroneActive}
            onRepairBuilding={onRepairBuilding}
            onRepairAll={onRepairAllBuildings}
            onClose={() => setIsDroneInspectionOpen(false)}
            dronePos={dronePos}
            autoRepairLog={autoRepairLog}
          />
        )}
      </AnimatePresence>

      {/* 3-Day Weather Forecast Modal */}
      <AnimatePresence>
        {isWeatherForecastOpen && (
          <WeatherForecastModal
            currentDay={stats.day}
            weather={weather}
            weatherAlert={activeWeatherAlert}
            grid={grid}
            stats={stats}
            onClose={() => setIsWeatherForecastOpen(false)}
            onOpenAdvisorAI={onOpenAdvisorChat}
            onOpenCensus={() => setIsCensusOpen(true)}
            onToggleWeather={onToggleWeather}
          />
        )}
      </AnimatePresence>

      {/* HOME LAYER MODAL */}
      <HomeLayerModal
        isOpen={activeLayer === 'home'}
        onClose={() => setActiveLayer(null)}
        stats={stats}
        weather={weather}
        currentGoal={currentGoal}
        taxRate={taxRate}
        isAutoPlayActive={isAutoPlayActive}
        onToggleAutoPlay={onToggleAutoPlay}
        onOpenWeatherForecast={() => { setActiveLayer(null); setIsWeatherForecastOpen(true); }}
        onOpenAdvisorChat={onOpenAdvisorChat}
        onOpenCensus={() => { setActiveLayer(null); setIsCensusOpen(true); }}
        onOpenMenuLayer={() => setActiveLayer('menu')}
        onOpenSettingsLayer={() => setActiveLayer('settings')}
        onOpenProfilesLayer={() => setActiveLayer('profiles')}
      />

      {/* MENU LAYER MODAL */}
      <MenuLayerModal
        isOpen={activeLayer === 'menu'}
        onClose={() => setActiveLayer(null)}
        onOpenMarket={() => { setActiveLayer(null); setIsMarketOpen(true); }}
        onOpenLeaderboard={() => { setActiveLayer(null); setIsLeaderboardOpen(true); }}
        onOpenChronicle={() => { setActiveLayer(null); setIsChronicleOpen(true); }}
        onOpenEfficiencyReport={() => { setActiveLayer(null); setIsEfficiencyReportOpen(true); }}
        onOpenAtlas={() => { setActiveLayer(null); if (onViewAtlas) onViewAtlas(); }}
        onOpenWeatherForecast={() => { setActiveLayer(null); setIsWeatherForecastOpen(true); }}
        onOpenBuildingDirectory={() => { setActiveLayer(null); setIsBuildingPanelExpanded(true); }}
        onOpenTriNode={() => { setActiveLayer(null); setIsTriNodeOpen(true); }}
        onOpenCensus={() => { setActiveLayer(null); setIsCensusOpen(true); }}
        onSaveSnapshot={onSaveSnapshot}
        onRestartGame={onRestartGame}
      />

      {/* SETTINGS LAYER MODAL */}
      <SettingsLayerModal
        isOpen={activeLayer === 'settings'}
        onClose={() => setActiveLayer(null)}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        isEnlargedUI={isEnlargedUI}
        setIsEnlargedUI={setIsEnlargedUI}
        isEconomicOverlayActive={isEconomicOverlayActive}
        onToggleEconomicOverlay={onToggleEconomicOverlay}
        isWeatherOverlayActive={isWeatherOverlayActive}
        onToggleWeatherOverlay={onToggleWeatherOverlay}
        isPaused={isPaused}
        onTogglePause={onTogglePause}
        isAutoPlayActive={isAutoPlayActive}
        onToggleAutoPlay={onToggleAutoPlay}
        weather={weather}
        onToggleWeather={onToggleWeather}
        onSaveSnapshot={onSaveSnapshot}
        onRestartGame={onRestartGame}
      />

      {/* PROFILES LAYER MODAL */}
      <ProfilesLayerModal
        isOpen={activeLayer === 'profiles'}
        onClose={() => setActiveLayer(null)}
        stats={stats}
        grid={grid}
      />

      {/* CIVILIZATION CENSUS & DYNAMIC SCALING MODAL */}
      <CivilizationCensusModal
        isOpen={isCensusOpen}
        onClose={() => setIsCensusOpen(false)}
        stats={stats}
        grid={grid}
        history={cityHistory}
        taxRate={taxRate}
        weather={weather}
        onOpenAdvisorChat={onOpenAdvisorChat}
        onOpenWeatherForecast={() => setIsWeatherForecastOpen(true)}
        onOpenMarket={() => setIsMarketOpen(true)}
        onOpenEfficiencyReport={() => setIsEfficiencyReportOpen(true)}
      />

      {/* MATERIAL REFINEMENT & QUALITY OF LIFE MODAL */}
      <MaterialRefinementModal
        isOpen={isRefinementOpen}
        onClose={() => setIsRefinementOpen(false)}
        refinementState={refinementState}
        grid={grid}
        playerMoney={stats.money}
        onTriggerSurge={onTriggerRefinementSurge}
        onOpenAdvisorAI={onOpenAdvisorChat}
        onOpenMarket={() => setIsMarketOpen(true)}
        onOpenCensus={() => setIsCensusOpen(true)}
        onOpenEfficiencyReport={() => setIsEfficiencyReportOpen(true)}
        onOpenWeatherForecast={() => setIsWeatherForecastOpen(true)}
      />

    </div>
  );
};

export default UIOverlay;