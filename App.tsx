/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem, HintIndicator, WeatherState } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { BuildingMenuModal } from './components/BuildingMenuModal';
import { AdvisorChatModal } from './components/AdvisorChatModal';
import { generateCityGoal, generateNewsEvent, generateArcadeNarrativePayload } from './services/geminiService';
import { audioService } from './services/audioService';
import { findOptimalPosition } from './utils/cityOptimizer';
import { generateDailyWeatherChronicle } from './utils/weatherLogGenerator';
import { createInitialTriNodeState, processPhysicalPulse } from './services/triNodeEngine';
import { TriNodeState, PhysicalPulse, ChronicleEntry, AetheriumMarketState, GlobalMarketEvent, AetheriumMarketPoint, MaterialRefinementState, RefinementPurityTier } from './types';
import { NotificationManager, AppNotification } from './components/NotificationManager';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CloudRain, Snowflake, Wind, Play, Pause, Info, Target, History, Globe, Save } from 'lucide-react';
import { AtlasView } from './components/AtlasView';
import { saveCitySnapshot } from './services/firebaseService';

const INITIAL_CHRONICLE_ENTRIES: ChronicleEntry[] = [
  {
    id: 'chronicle-founding-01',
    day: 1,
    timestamp: Date.now() - 3600000,
    title: 'SkyMetropolis City Charter Signed',
    description: 'Municipal grounds surveyed and initial grid infrastructure commissioned under high-density zoning ordinances.',
    category: 'historical',
    impact: 'Charter Established'
  },
  {
    id: 'chronicle-tri-01',
    day: 1,
    timestamp: Date.now() - 1800000,
    title: 'Tri-Node Ecosystem Synchronization',
    description: 'Aetherium Arcade City and Re-Ality Observer Physics Engine coupled with SkyMetropolis sandbox.',
    category: 'directive',
    impact: '40Hz Resonance Active'
  }
];

// Initialize empty grid with island shape generation for 3D visual interest
const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const center = GRID_SIZE / 2;
  // const radius = GRID_SIZE / 2 - 1;

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // Simple circle crop for island look
      const dist = Math.sqrt((x-center)*(x-center) + (y-center)*(y-center));
      
      row.push({ x, y, buildingType: BuildingType.None });
    }
    grid.push(row);
  }
  return grid;
};

function App() {
  // --- Game State ---
  const [gameStarted, setGameStarted] = useState(false);
  const [isAtlasViewActive, setIsAtlasViewActive] = useState(false);
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ 
    money: INITIAL_MONEY, 
    population: 0, 
    day: 1, 
    happiness: 75,
    cityLevel: 1,
    experience: 0
  });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  const [hoveredTileData, setHoveredTileData] = useState<TileData | null>(null);
  const [weather, setWeather] = useState<WeatherState>({ isRaining: false, isFoggy: false, isSnowing: false, cycle: 'noon' });
  const [taxRate, setTaxRate] = useState(10); // 10% base
  const [hints, setHints] = useState<HintIndicator[]>([]);
  const [isEconomicOverlayActive, setIsEconomicOverlayActive] = useState(false);
  const [isWeatherOverlayActive, setIsWeatherOverlayActive] = useState(false);
  
  // --- AI State ---
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);

  // --- Tri-Node Ecosystem Integration State ---
  const [triNodeState, setTriNodeState] = useState<TriNodeState>(createInitialTriNodeState);
  const [isGeneratingDirective, setIsGeneratingDirective] = useState(false);

  // --- City Chronicle State & History ---
  const [chronicleEntries, setChronicleEntries] = useState<ChronicleEntry[]>(INITIAL_CHRONICLE_ENTRIES);
  const [cityHistory, setCityHistory] = useState<Array<{ day: number; population: number; income: number; happiness: number }>>([
    { day: 1, population: 0, income: 0, happiness: 75 }
  ]);
  const popMilestonesReached = useRef<Set<number>>(new Set());

  // --- Aetherium Market State ---
  const [aetheriumMarket, setAetheriumMarket] = useState<AetheriumMarketState>({
    currentPrice: 124.50,
    previousPrice: 118.00,
    priceHistory: [
      { day: 1, price: 100.00 },
      { day: 2, price: 108.20 },
      { day: 3, price: 118.00 },
      { day: 4, price: 124.50 }
    ],
    activeEvent: null,
    overallMultiplier: 1.24,
    volatility: 'Moderate',
    trend: 'up'
  });
  const aetheriumMarketRef = useRef(aetheriumMarket);
  useEffect(() => { aetheriumMarketRef.current = aetheriumMarket; }, [aetheriumMarket]);

  // --- City Auto Play State & Ref ---
  const [isAutoPlayActive, setIsAutoPlayActive] = useState(false);
  const isAutoPlayActiveRef = useRef(isAutoPlayActive);
  const autoPlayStepCounter = useRef(0);

  // --- Pause and Alerts ---
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  
  const [weatherAlert, setWeatherAlert] = useState<{ type: string; title: string; description: string; ticksRemaining: number } | null>(null);
  const weatherAlertRef = useRef(weatherAlert);
  useEffect(() => { weatherAlertRef.current = weatherAlert; }, [weatherAlert]);

  const [isWeatherPopupVisible, setIsWeatherPopupVisible] = useState(false);
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState(false);

  // --- Material Refinement System State ---
  const [materialRefinement, setMaterialRefinement] = useState<MaterialRefinementState>({
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
  });
  const materialRefinementRef = useRef(materialRefinement);
  useEffect(() => { materialRefinementRef.current = materialRefinement; }, [materialRefinement]);

  // --- Drone Inspection & Auto-Repair System State ---
  const [isDroneActive, setIsDroneActive] = useState(true);
  const isDroneActiveRef = useRef(isDroneActive);
  useEffect(() => { isDroneActiveRef.current = isDroneActive; }, [isDroneActive]);

  const [isAutoRepairEnabled, setIsAutoRepairEnabled] = useState(true);
  const isAutoRepairEnabledRef = useRef(isAutoRepairEnabled);
  useEffect(() => { isAutoRepairEnabledRef.current = isAutoRepairEnabled; }, [isAutoRepairEnabled]);

  const [dronePos, setDronePos] = useState<{ x: number; y: number } | null>({ x: 8, y: 8 });
  const [autoRepairLog, setAutoRepairLog] = useState<Array<{ id: string; buildingName: string; x: number; y: number; cost: number; timestamp: string }>>([]);

  // --- Notification System ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  const notify = useCallback((notification: Omit<AppNotification, 'id'>) => {
    setNotifications(prev => [...prev, { ...notification, id: `notif-${Date.now()}-${Math.random()}` }]);
  }, []);

  useEffect(() => {
    isAutoPlayActiveRef.current = isAutoPlayActive;
  }, [isAutoPlayActive]);

  // --- Optimization State ---
  const optimalSpot = useMemo(() => {
    return findOptimalPosition(grid, selectedTool);
  }, [grid, selectedTool]);
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const aiEnabledRef = useRef(aiEnabled);
  const triNodeRef = useRef(triNodeState);
  const weatherRef = useRef(weather);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);
  useEffect(() => { triNodeRef.current = triNodeState; }, [triNodeState]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // --- Core Utility Callbacks ---
  const addNewsItem = useCallback((item: NewsItem) => {
    setNewsFeed(prev => [...prev.slice(-12), item]); // Keep last few
  }, []);

  const triggerHint = useCallback((x: number, y: number, text: string, color: string = '#ffffff') => {
    const id = Math.random().toString(36).substr(2, 9);
    setHints(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setHints(prev => prev.filter(h => h.id !== id));
    }, 2000); // 2 seconds lifecycle
  }, []);

  // --- Chronicle Entry Helper ---
  const addChronicleEntry = useCallback((entry: Omit<ChronicleEntry, 'id' | 'timestamp' | 'day'> & { day?: number }) => {
    const newEntry: ChronicleEntry = {
      id: `chronicle-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      day: entry.day ?? statsRef.current.day,
      ...entry
    };
    setChronicleEntries(prev => [newEntry, ...prev]);

    // Dispatch a subtle toast notification for this chronicle
    let type: 'info' | 'success' | 'warning' = 'info';
    let icon = History;
    if (entry.category === 'goal') { type = 'success'; icon = Target; }
    else if (entry.category === 'disaster') { type = 'warning'; icon = AlertTriangle; }
    
    notify({
      type,
      title: entry.title,
      message: entry.description,
      isModal: false,
      duration: 5000,
      icon
    });
  }, [notify]);

  const handleAddCustomChronicleNote = useCallback((title: string, description: string) => {
    addChronicleEntry({
      title,
      description,
      category: 'historical',
      impact: 'Archival Note'
    });
    setNewsFeed(prev => [...prev.slice(-12), {
      id: Date.now().toString(),
      text: `[City Chronicle Logged] ${title}`,
      type: 'neutral'
    }]);
  }, [addChronicleEntry]);

  // --- Material Refinement Directive Handler ---
  const handleTriggerRefinementSurge = useCallback(() => {
    if (statsRef.current.money < 500) return;
    setStats(prev => ({ ...prev, money: prev.money - 500 }));
    setMaterialRefinement(prev => ({
      ...prev,
      surgeActive: true,
      surgeDaysRemaining: 5,
      qualityOfLifeMultiplier: Math.round((prev.qualityOfLifeMultiplier + 0.20) * 100) / 100
    }));
    audioService.playLevelUpSound();
    addNewsItem({
      id: Date.now().toString(),
      text: '⚡ Refinement Surge Initiated! Industrial facilities boosted with +20% Quality of Life multiplier for 5 days.',
      type: 'positive'
    });
    addChronicleEntry({
      title: 'Industrial Refinement Surge Initiated',
      description: 'The Mayor authorized a $500 directive to supercharge industrial Refined Aetherium output and citywide Quality of Life.',
      category: 'directive',
      impact: '+20% QoL Multiplier'
    });
  }, [addNewsItem, addChronicleEntry]);

  // --- Tri-Node Ecosystem Handlers ---

  const handleTriggerPulse = useCallback((type: PhysicalPulse['type']) => {
    const { newState, pulse, message } = processPhysicalPulse(triNodeRef.current, type);
    setTriNodeState(newState);
    addNewsItem({
      id: pulse.id,
      text: `[Re-Ality Pulse Ingest] ${message}`,
      type: 'positive'
    });
    audioService.playBuildSound();
  }, [addNewsItem]);

  const handleGenerateDirective = useCallback(async () => {
    if (isGeneratingDirective) return;
    setIsGeneratingDirective(true);
    
    const newDirective = await generateArcadeNarrativePayload(statsRef.current, triNodeRef.current);
    if (newDirective) {
      setTriNodeState(prev => ({
        ...prev,
        activeDirectives: [newDirective, ...prev.activeDirectives.slice(0, 3)]
      }));
      addNewsItem({
        id: newDirective.id,
        text: `[Arcade City Broadcast] New Ecosystem Directive: ${newDirective.title}`,
        type: 'neutral'
      });
      audioService.playLevelUpSound();
    }
    setIsGeneratingDirective(false);
  }, [isGeneratingDirective, addNewsItem]);

  const handleCompleteDirective = useCallback((directiveId: string, treasuryReward: number) => {
    const targetDirective = triNodeRef.current.activeDirectives.find(d => d.id === directiveId);
    setStats(prev => ({ ...prev, money: prev.money + treasuryReward }));
    setTriNodeState(prev => ({
      ...prev,
      totalArcadeYield: prev.totalArcadeYield + Math.floor(treasuryReward * 1.5),
      activeDirectives: prev.activeDirectives.filter(d => d.id !== directiveId)
    }));
    addNewsItem({
      id: Date.now().toString(),
      text: `Directive Fulfilled! +$${treasuryReward} Treasury Grant claimed from Arcade City.`,
      type: 'positive'
    });
    audioService.playRewardSound();

    if (targetDirective) {
      addChronicleEntry({
        title: `Ecosystem Directive Fulfilled: ${targetDirective.title}`,
        description: targetDirective.objective,
        category: 'directive',
        impact: `+$${(treasuryReward ?? 0).toLocaleString()} Grant`
      });
    }
  }, [addNewsItem, addChronicleEntry]);

  // --- AI Logic Wrappers ---

  const fetchNewGoal = useCallback(async () => {
    if (isGeneratingGoal || !aiEnabledRef.current) return;
    setIsGeneratingGoal(true);
    // Short delay for visual effect
    await new Promise(r => setTimeout(r, 500));
    
    const newGoal = await generateCityGoal(statsRef.current, gridRef.current);
    if (newGoal) {
      setCurrentGoal(newGoal);
    } else {
      // Retry soon if failed, but only if AI still enabled
      if(aiEnabledRef.current) setTimeout(fetchNewGoal, 5000);
    }
    setIsGeneratingGoal(false);
  }, [isGeneratingGoal]); 

  // --- Auto Play Autonomous Step Engine ---
  const runAutoPlayStep = useCallback(() => {
    if (!gameStarted) return;

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const currentGoalObj = goalRef.current;

    // A. Auto Claim Goal
    if (currentGoalObj && currentGoalObj.completed) {
      setStats(prev => ({ ...prev, money: prev.money + (currentGoalObj.reward || 0) }));
      addNewsItem({
        id: Date.now().toString(),
        text: `[Auto Play] AI Goal achieved automatically! +$${(currentGoalObj?.reward ?? 0).toLocaleString()} deposited to treasury.`,
        type: 'positive'
      });
      setCurrentGoal(null);
      fetchNewGoal();
      audioService.playRewardSound();
      return;
    }

    // B. Auto Complete Active Directives
    const activeDirectives = triNodeRef.current.activeDirectives;
    if (activeDirectives.length > 0) {
      const directive = activeDirectives[0];
      if (directive) {
        handleCompleteDirective(directive.id, directive.reward);
        return;
      }
    }

    // C. Autonomous Building Placement
    let counts: Record<string, number> = {
      [BuildingType.Road]: 0,
      [BuildingType.Residential]: 0,
      [BuildingType.Commercial]: 0,
      [BuildingType.Industrial]: 0,
      [BuildingType.Park]: 0,
      [BuildingType.Monument]: 0,
    };

    let totalBuildings = 0;
    currentGrid.flat().forEach(tile => {
      if (tile.buildingType !== BuildingType.None) {
        counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
        totalBuildings++;
      }
    });

    const candidates: BuildingType[] = [];

    // Strategy 1: Build roads if network is sparse
    if (counts[BuildingType.Road] === 0 || (totalBuildings > 3 && counts[BuildingType.Road] / totalBuildings < 0.22)) {
      candidates.push(BuildingType.Road);
    }

    // Strategy 2: Build parks if happiness < 75 or no parks exist
    if (currentStats.happiness < 75 || counts[BuildingType.Park] === 0) {
      candidates.push(BuildingType.Park);
    }

    // Strategy 3: Build monuments if wealthy & < 2 monuments
    if (currentStats.money >= BUILDINGS[BuildingType.Monument].cost && counts[BuildingType.Monument] < 2) {
      candidates.push(BuildingType.Monument);
    }

    // Strategy 4: Economic balance (Residential -> Commercial -> Industrial)
    const resCount = counts[BuildingType.Residential];
    const comCount = counts[BuildingType.Commercial];
    const indCount = counts[BuildingType.Industrial];

    if (resCount <= comCount || resCount <= indCount) {
      candidates.push(BuildingType.Residential);
    }
    if (comCount < resCount * 0.7) {
      candidates.push(BuildingType.Commercial);
    }
    if (indCount < resCount * 0.4) {
      candidates.push(BuildingType.Industrial);
    }

    // Candidate Fallbacks
    candidates.push(
      BuildingType.Residential,
      BuildingType.Commercial,
      BuildingType.Industrial,
      BuildingType.Road,
      BuildingType.Park
    );

    for (const candidate of candidates) {
      const config = BUILDINGS[candidate];
      if (currentStats.money >= config.cost) {
        const spot = findOptimalPosition(currentGrid, candidate);
        if (spot && spot.score > -10) {
          setStats(prev => ({ ...prev, money: prev.money - config.cost }));

          const newGrid = currentGrid.map(row => [...row]);
          newGrid[spot.y][spot.x] = { x: spot.x, y: spot.y, buildingType: candidate, level: 1 };
          setGrid(newGrid);

          triggerHint(spot.x, spot.y, `Auto Mayor!`, '#10b981');
          audioService.playPlacement();

          addNewsItem({
            id: Date.now().toString() + Math.random(),
            text: `[Auto Play] Mayor AI constructed ${config.name} at (${spot.x + 1}, ${spot.y + 1}): ${spot.explanation}`,
            type: 'positive'
          });

          return; // Action performed
        }
      }
    }

    // D. Auto Upgrade existing structures if treasury >= $200
    if (currentStats.money >= 200) {
      const upgradables: { x: number; y: number; tile: TileData }[] = [];
      currentGrid.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
            const lvl = tile.level || 1;
            if (lvl < 5) {
              const cost = Math.floor(BUILDINGS[tile.buildingType].cost * (lvl + 0.5));
              if (currentStats.money >= cost) {
                upgradables.push({ x, y, tile });
              }
            }
          }
        });
      });

      if (upgradables.length > 0) {
        upgradables.sort((a, b) => (a.tile.level || 1) - (b.tile.level || 1));
        const target = upgradables[0];
        const config = BUILDINGS[target.tile.buildingType];
        const currentLvl = target.tile.level || 1;
        const upgradeCost = Math.floor(config.cost * (currentLvl + 0.5));

        setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));

        const newGrid = currentGrid.map(r => [...r]);
        newGrid[target.y][target.x] = { ...target.tile, level: currentLvl + 1 };
        setGrid(newGrid);

        triggerHint(target.x, target.y, `Auto Level Up!`, '#fbbf24');
        audioService.playUpgrade();

        addNewsItem({
          id: Date.now().toString() + Math.random(),
          text: `[Auto Play] Mayor AI upgraded ${config.name} at (${target.x + 1}, ${target.y + 1}) to Level ${currentLvl + 1}!`,
          type: 'positive'
        });
      }
    }
  }, [gameStarted, addNewsItem, fetchNewGoal, handleCompleteDirective, triggerHint]);

  const handleToggleAutoPlay = useCallback(() => {
    setIsAutoPlayActive(prev => {
      const next = !prev;
      addNewsItem({
        id: Date.now().toString(),
        text: next 
          ? "[City Auto Play] Autonomous Mayor AI Enabled. Metropolitan expansion running automatically."
          : "[City Auto Play] Autonomous Mayor AI Disabled. Manual control returned to player.",
        type: next ? 'positive' : 'neutral'
      });
      if (next) {
        audioService.playLevelUpSound();
        setTimeout(() => runAutoPlayStep(), 300);
      }
      return next;
    });
  }, [addNewsItem, runAutoPlayStep]); 

  const fetchNews = useCallback(async () => {
    // chance to fetch news per tick
    if (!aiEnabledRef.current || Math.random() > 0.15) return; 
    const news = await generateNewsEvent(statsRef.current, null);
    if (news) addNewsItem(news);
  }, [addNewsItem]);

  const handleRepairBuilding = useCallback((x: number, y: number) => {
    setGrid(prevGrid => {
      const tile = prevGrid[y]?.[x];
      if (!tile || tile.buildingType === BuildingType.None || tile.buildingType === BuildingType.Road) {
        return prevGrid;
      }
      const missing = 100 - (tile.durability ?? 100);
      if (missing <= 0) {
        notify('info', 'Building Pristine', 'This building is already at 100% structural durability.');
        return prevGrid;
      }
      const config = BUILDINGS[tile.buildingType];
      const cost = Math.max(10, Math.round((config.cost * 0.15) * (missing / 100) + 15));

      if (statsRef.current.money < cost) {
        notify('error', 'Insufficient Treasury Funds', `Repairing ${config.name} requires $${cost}, but treasury only has $${statsRef.current.money}.`);
        return prevGrid;
      }

      setStats(s => ({ ...s, money: s.money - cost }));
      const newGrid = prevGrid.map(row => [...row]);
      newGrid[y][x] = {
        ...tile,
        durability: 100,
        efficiency: 100
      };
      triggerHint(x, y, `Repaired (-$${cost})`, '#10b981');
      setAutoRepairLog(prev => [
        {
          id: `repair-${Date.now()}`,
          buildingName: config.name,
          x,
          y,
          cost,
          timestamp: `Day ${statsRef.current.day}`
        },
        ...prev.slice(0, 19)
      ]);
      notify('success', 'Building Repaired', `${config.name} restored to 100% structural durability.`);
      return newGrid;
    });
  }, [notify, triggerHint]);

  const handleRepairAllBuildings = useCallback(() => {
    setGrid(prevGrid => {
      let totalCost = 0;
      const targets: { x: number; y: number; cost: number; name: string }[] = [];

      prevGrid.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
          const durability = tile.durability ?? 100;
          if (durability < 100) {
            const missing = 100 - durability;
            const config = BUILDINGS[tile.buildingType];
            const cost = Math.max(10, Math.round((config.cost * 0.15) * (missing / 100) + 15));
            totalCost += cost;
            targets.push({ x: tile.x, y: tile.y, cost, name: config.name });
          }
        }
      });

      if (targets.length === 0) {
        notify('info', 'All Buildings Pristine', 'No municipal structures require structural repairs.');
        return prevGrid;
      }

      if (statsRef.current.money < totalCost) {
        notify('error', 'Insufficient Treasury Funds', `Total repairs cost $${totalCost}, but treasury only has $${statsRef.current.money}.`);
        return prevGrid;
      }

      setStats(s => ({ ...s, money: s.money - totalCost }));
      const newGrid = prevGrid.map(row => [...row]);
      targets.forEach(t => {
        newGrid[t.y][t.x] = {
          ...newGrid[t.y][t.x],
          durability: 100,
          efficiency: 100
        };
        triggerHint(t.x, t.y, `Repaired!`, '#10b981');
      });

      notify('success', 'Citywide Repairs Completed', `Repaired ${targets.length} buildings for $${totalCost}.`);
      return newGrid;
    });
  }, [notify, triggerHint]);


  // --- Initial Setup ---
  useEffect(() => {
    if (!gameStarted) return;

    addNewsItem({ id: Date.now().toString(), text: "Welcome to SkyMetropolis. Terrain generation complete.", type: 'positive' });
    
    if (aiEnabled) {
      // @google/genai-api-key-fix: The API key's availability is a hard requirement and should not be checked in the UI.
      fetchNewGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);


  // --- Game Loop ---
  useEffect(() => {
    if (!gameStarted) return;

    const intervalId = setInterval(() => {
      if (isPausedRef.current) return;
      
      // 1. Calculate income/pop gen with Weather Incident & Resilience Mitigation
      let totalBaseIncome = 0;
      let totalBasePopGrowth = 0;
      let buildingCounts: Record<string, number> = {};
      let industrialCount = 0;
      let parkCount = 0;
      let monumentCount = 0;

      // Find Atmospheric Shield forcefield positions
      const shieldPositions: { x: number; y: number }[] = [];
      gridRef.current.flat().forEach(t => {
        if (t.buildingType === BuildingType.AtmosphericShield) {
          shieldPositions.push({ x: t.x, y: t.y });
        }
      });
      const isCoveredByShield = (x: number, y: number) => {
        return shieldPositions.some(sp => Math.hypot(sp.x - x, sp.y - y) <= 4.0);
      };

      const currentWeather = weatherRef.current;
      const currentAlert = weatherAlertRef.current;
      const isSevereWeather = currentWeather.isRaining || currentWeather.isSnowing || currentWeather.isFoggy || !!currentAlert;

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          const level = tile.level || 1;
          let income = config.incomeGen * level;
          let pop = config.popGen * level;

          if (tile.buildingType === BuildingType.Industrial) industrialCount++;
          if (tile.buildingType === BuildingType.Park) parkCount++;
          if (tile.buildingType === BuildingType.Monument) monumentCount++;

          // Apply weather incident penalty if severe weather and tile is unshielded
          if (isSevereWeather && tile.buildingType !== BuildingType.Road && tile.buildingType !== BuildingType.AtmosphericShield) {
            const inDome = isCoveredByShield(tile.x, tile.y);
            if (!inDome) {
              const resLvl = tile.resilienceLevel || (tile.isResilient ? 3 : 0);
              let basePenalty = 0.25;
              if (currentWeather.isSnowing || currentAlert?.type === 'blizzard') basePenalty = 0.35;
              else if (currentWeather.isRaining || currentAlert?.type === 'monsoon') basePenalty = 0.30;
              else if (currentWeather.isFoggy || currentAlert?.type === 'fog') basePenalty = 0.15;

              // Resilience Mitigation: Tier 3 = 100% immune, Tier 2 = 80%, Tier 1 = 50%, Tier 0 = 0%
              let mitigation = 0;
              if (resLvl >= 3) mitigation = 1.0;
              else if (resLvl === 2) mitigation = 0.8;
              else if (resLvl === 1) mitigation = 0.5;

              const effectivePenalty = basePenalty * (1.0 - mitigation);
              income = Math.max(0, Math.round(income * (1.0 - effectivePenalty)));
              pop = Math.max(0, Math.round(pop * (1.0 - effectivePenalty)));
            }
          }

          totalBaseIncome += income;
          totalBasePopGrowth += pop;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;

          // Periodic hints for active buildings
          if (Math.random() < 0.1) {
             if (income > 0) triggerHint(tile.x, tile.y, `+$${income}`, '#4ade80');
             if (pop > 0) triggerHint(tile.x, tile.y, `+${pop} Pop`, '#60a5fa');
          }
        }
      });

      // 2. Material Refinement & Quality of Life Calculation
      let refinedProduction = 0;
      let refinedDemand = 0;
      let indCountForRefinement = 0;
      let comHubCountForRefinement = 0;

      gridRef.current.flat().forEach(t => {
        if (t.buildingType === BuildingType.Industrial) {
          const lvl = t.level || 1;
          refinedProduction += lvl * 10;
          indCountForRefinement++;
          if (Math.random() < 0.08) {
            triggerHint(t.x, t.y, `+${lvl * 10} Refined`, '#fbbf24');
          }
        } else if (t.buildingType === BuildingType.Commercial) {
          const lvl = t.level || 1;
          if (lvl >= 2) {
            refinedDemand += (lvl - 1) * 15;
            comHubCountForRefinement++;
            if (Math.random() < 0.08) {
              triggerHint(t.x, t.y, `⚡ QoL Goods`, '#38bdf8');
            }
          }
        }
      });

      let satisfactionRatio = 1.0;
      let qolMultiplier = 1.0;

      if (refinedDemand > 0) {
        satisfactionRatio = Math.min(1.5, refinedProduction / refinedDemand);
        qolMultiplier = 1.0 + (satisfactionRatio * 0.30); // Up to +30% QoL multiplier!
      } else if (refinedProduction > 0) {
        // Raw surplus export boost
        satisfactionRatio = 1.0;
        qolMultiplier = 1.05;
      }

      // Surge Directive Bonus Check
      const prevRefinement = materialRefinementRef.current;
      let surgeActive = prevRefinement.surgeActive;
      let surgeDays = prevRefinement.surgeDaysRemaining;

      if (surgeActive) {
        surgeDays -= 1;
        if (surgeDays <= 0) {
          surgeActive = false;
          surgeDays = 0;
          addNewsItem({
            id: Date.now().toString(),
            text: 'Refinement Surge Directive concluded. Output returning to nominal rates.',
            type: 'neutral'
          });
        } else {
          qolMultiplier += 0.20; // +20% surge boost
        }
      }

      let purityTier: RefinementPurityTier = 'Standard';
      if (refinedProduction >= 100) purityTier = 'Quantum-Grade';
      else if (refinedProduction >= 50) purityTier = 'Hyper-Refined';
      else if (refinedProduction >= 25) purityTier = 'Synthesized';

      const newHistoryPoint = {
        day: statsRef.current.day,
        production: refinedProduction,
        demand: refinedDemand,
        netBalance: refinedProduction - refinedDemand,
        qolBonusPercent: Math.round((qolMultiplier - 1.0) * 100)
      };

      const prevHistory = prevRefinement.history || [];
      const updatedHistory = [...prevHistory, newHistoryPoint].slice(-25);

      const nextRefinementState: MaterialRefinementState = {
        refinedAetheriumProduction: refinedProduction,
        refinedAetheriumDemand: refinedDemand,
        satisfactionRatio,
        qualityOfLifeMultiplier: Math.round(qolMultiplier * 100) / 100,
        industrialBuildingCount: indCountForRefinement,
        commercialHubCount: comHubCountForRefinement,
        purityTier,
        surgeActive,
        surgeDaysRemaining: surgeDays,
        history: updatedHistory
      };

      setMaterialRefinement(nextRefinementState);

      // 3. Happiness Calculation
      // Tax penalty: > 15% reduces happiness, < 10% increases it
      const taxImpact = (10 - taxRate) * 2; 
      // Industrial penalty: people hate factories near their city
      const pollutionImpact = industrialCount * -1;
      // Park bonus
      const parkImpact = parkCount * 3;
      // Monument bonus
      const monumentImpact = monumentCount * 15;
      // QoL Multiplier Happiness Bonus
      const qolHappinessBonus = (qolMultiplier - 1.0) * 15;
      
      const newHappiness = Math.min(100, Math.max(0, statsRef.current.happiness + (taxImpact + pollutionImpact + parkImpact + monumentImpact + qolHappinessBonus) / 10));

      // 4. Modifiers based on Happiness, Quality of Life & Aetherium Market
      const happinessMultiplier = newHappiness / 100; // 0 to 1
      const effectivePopGrowth = totalBasePopGrowth * happinessMultiplier * qolMultiplier;

      // --- Aetherium Market Fluctuation & Global Events ---
      const currentMarket = aetheriumMarketRef.current;
      let newMarketEvent = currentMarket.activeEvent;

      if (newMarketEvent) {
        const remaining = newMarketEvent.daysRemaining - 1;
        if (remaining <= 0) {
          addNewsItem({ id: Date.now().toString(), text: `Global Market Event Concluded: ${newMarketEvent.name}. Index stabilizing.`, type: 'neutral' });
          newMarketEvent = null;
        } else {
          newMarketEvent = { ...newMarketEvent, daysRemaining: remaining };
        }
      } else if (Math.random() < 0.22) {
        const POSSIBLE_EVENTS: Omit<GlobalMarketEvent, 'id' | 'daysRemaining'>[] = [
          {
            name: 'Quantum Fusion Grid Surge',
            description: 'Worldwide breakthroughs in fusion drive exponential industrial Aetherium demand.',
            type: 'boom',
            multiplier: 1.35,
            affectedSector: 'Industrial',
            durationDays: 3
          },
          {
            name: 'Aetherium Supply Shortage',
            description: 'Off-world cargo delays cause a sharp spike in raw index trading values.',
            type: 'demand_surge',
            multiplier: 1.25,
            affectedSector: 'All',
            durationDays: 2
          },
          {
            name: 'Inter-Metropolitan Tariff',
            description: 'Regional trade friction compresses commercial export margins.',
            type: 'crash',
            multiplier: 0.85,
            affectedSector: 'Commercial',
            durationDays: 2
          },
          {
            name: 'Skyway Freight Expansion',
            description: 'Automated aerial logistics boost commercial trade distribution yield.',
            type: 'boom',
            multiplier: 1.30,
            affectedSector: 'Commercial',
            durationDays: 4
          }
        ];
        const selected = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
        newMarketEvent = {
          ...selected,
          id: `event-${Date.now()}`,
          daysRemaining: selected.durationDays
        };
        addNewsItem({
          id: Date.now().toString(),
          text: `⚡ MARKET SHIFT: ${newMarketEvent.name}! (${newMarketEvent.description})`,
          type: newMarketEvent.type === 'crash' ? 'negative' : 'positive'
        });
        addChronicleEntry({
          day: statsRef.current.day + 1,
          title: `Market Directive: ${newMarketEvent.name}`,
          description: newMarketEvent.description,
          category: 'directive',
          impact: `${Math.round((newMarketEvent.multiplier - 1) * 100)}% Yield Shift`
        });
      }

      // Fluctuate price
      const baseChangePercent = (Math.random() * 10 - 5); // -5% to +5%
      const eventMultiplierBoost = newMarketEvent ? (newMarketEvent.multiplier - 1.0) * 100 : 0;
      const rawPrice = currentMarket.currentPrice * (1 + (baseChangePercent + eventMultiplierBoost / 2) / 100);
      const newPrice = Math.max(50, Math.min(300, Math.round(rawPrice * 100) / 100));
      const overallMult = Math.max(0.6, Math.min(2.5, newPrice / 100)) * (newMarketEvent ? newMarketEvent.multiplier : 1.0);

      const nextMarketState: AetheriumMarketState = {
        currentPrice: newPrice,
        previousPrice: currentMarket.currentPrice,
        priceHistory: [
          ...currentMarket.priceHistory,
          {
            day: statsRef.current.day + 1,
            price: newPrice,
            eventTitle: newMarketEvent?.name,
            changePercent: Math.round(((newPrice - currentMarket.currentPrice) / currentMarket.currentPrice) * 100)
          }
        ].slice(-30),
        activeEvent: newMarketEvent,
        overallMultiplier: overallMult,
        volatility: Math.abs(newPrice - currentMarket.currentPrice) > 10 ? 'Extreme' : Math.abs(newPrice - currentMarket.currentPrice) > 5 ? 'High' : 'Moderate',
        trend: newPrice >= currentMarket.currentPrice ? 'up' : 'down'
      };

      setAetheriumMarket(nextMarketState);

      // Tax Income calc: (Base Income) * (Tax Rate / 10) * (Happiness Modifier) * (Tri-Node Multiplier) * (Aetherium Market Multiplier) * (QoL Multiplier)
      const effectiveIncome = totalBaseIncome * (taxRate / 10) * (newHappiness / 75) * triNodeRef.current.ecosystemMultiplier * overallMult * qolMultiplier;


      // Cap population growth by residential count
      const resCount = buildingCounts[BuildingType.Residential] || 0;
      const maxPop = resCount * 50;

      // 4. Update Stats
      setStats(prev => {
        let newPop = prev.population + effectivePopGrowth;
        if (newPop > maxPop) newPop = maxPop;
        if (resCount === 0 && prev.population > 0) newPop = Math.max(0, prev.population - 5);

        // Experience from population growth
        const newExperience = prev.experience + effectivePopGrowth;
        const expToNextLevel = prev.cityLevel * 500;
        let newLevel = prev.cityLevel;
        let finalExperience = newExperience;

        if (newExperience >= expToNextLevel) {
           newLevel += 1;
           finalExperience = 0; // Reset for next level
           addNewsItem({id: Date.now().toString(), text: `City reached Level ${newLevel}! New opportunities await.`, type: 'positive'});
           addChronicleEntry({
             day: prev.day + 1,
             title: `Civic Expansion: Reached Level ${newLevel}`,
             description: `SkyMetropolis expanded civic status to Level ${newLevel}, unlocking higher tier urban developments.`,
             category: 'milestone',
             impact: `Level ${newLevel}`
           });
        }

        // Check Population Threshold Milestones
        const popThresholds = [25, 50, 100, 250, 500, 1000, 2500, 5000];
        popThresholds.forEach(t => {
          if (newPop >= t && !popMilestonesReached.current.has(t)) {
            popMilestonesReached.current.add(t);
            addChronicleEntry({
              day: prev.day + 1,
              title: `Population Milestone: ${(t ?? 0).toLocaleString()} Citizens`,
              description: `SkyMetropolis officially reached ${(t ?? 0).toLocaleString()} active residents living across residential sectors.`,
              category: 'milestone',
              impact: `${(t ?? 0).toLocaleString()} Citizens`
            });
          }
        });

        const newStats = {
          money: prev.money + effectiveIncome,
          population: newPop,
          day: prev.day + 1,
          happiness: newHappiness,
          cityLevel: newLevel,
          experience: finalExperience,
        };

        setCityHistory(hist => {
          const point = {
            day: newStats.day,
            population: Math.round(newStats.population),
            income: Math.round(effectiveIncome),
            happiness: Math.round(newStats.happiness)
          };
          const filtered = hist.filter(h => h.day !== newStats.day);
          return [...filtered, point].sort((a, b) => a.day - b.day).slice(-30);
        });
        
        // 5. Check Goal Completion
        const goal = goalRef.current;
        if (aiEnabledRef.current && goal && !goal.completed) {
          let isMet = false;
          if (goal.targetType === 'money' && newStats.money >= goal.targetValue) isMet = true;
          if (goal.targetType === 'population' && newStats.population >= goal.targetValue) isMet = true;
          if (goal.targetType === 'building_count' && goal.buildingType) {
            if ((buildingCounts[goal.buildingType] || 0) >= goal.targetValue) isMet = true;
          }

          if (isMet) {
            setCurrentGoal({ ...goal, completed: true });
            addChronicleEntry({
              day: newStats.day,
              title: `Municipal Goal Met: ${goal.description}`,
              description: `City Council goal fulfilled! Treasury reward grant of $${(goal?.reward ?? 0).toLocaleString()} earned.`,
              category: 'goal',
              impact: `+$${(goal?.reward ?? 0).toLocaleString()} Grant`
            });
          }
        }

        return newStats;
      });

      // 6. Automatic Weather & Cycle
      setWeather(prev => {
        const nextDay = (statsRef.current.day % 40); // 40 ticks = full cycle
        let cycle = prev.cycle;
        if (nextDay === 0) cycle = 'morning';
        else if (nextDay === 10) cycle = 'noon';
        else if (nextDay === 20) cycle = 'evening';
        else if (nextDay === 30) cycle = 'night';

        // Chance to change weather conditions
        let isRaining = prev.isRaining;
        let isSnowing = prev.isSnowing;
        let isFoggy = prev.isFoggy;

        const currentAlert = weatherAlertRef.current;
        if (currentAlert) {
          if (currentAlert.ticksRemaining <= 1) {
             if (currentAlert.type === 'monsoon') {
                isRaining = true;
                isSnowing = false;
                addChronicleEntry({
                  title: currentAlert.title,
                  description: currentAlert.description,
                  category: 'disaster',
                  impact: 'Drainage Tested'
                });
             } else if (currentAlert.type === 'blizzard') {
                isSnowing = true;
                isRaining = false;
                addChronicleEntry({
                  title: currentAlert.title,
                  description: currentAlert.description,
                  category: 'disaster',
                  impact: 'Grid Weathered'
                });
             } else if (currentAlert.type === 'fog') {
                isFoggy = true;
                addChronicleEntry({
                  title: currentAlert.title,
                  description: currentAlert.description,
                  category: 'disaster',
                  impact: 'Low Visibility'
                });
             }
             setWeatherAlert(null);
          } else {
             setWeatherAlert({ ...currentAlert, ticksRemaining: currentAlert.ticksRemaining - 1 });
          }
        } else {
          if (Math.random() < 0.05) {
             const rand = Math.random();
             if (rand < 0.3) { 
               if (!isRaining && Math.random() < 0.3) {
                 setWeatherAlert({
                    type: 'monsoon',
                    title: 'Monsoonal Heavy Rain Incident',
                    description: 'Heavy precipitation testing municipal drainage networks across lower commercial and residential districts.',
                    ticksRemaining: 4
                 });
                 setIsWeatherPopupVisible(true);
                 setIsPaused(true);
               } else {
                 isRaining = !isRaining; 
                 isSnowing = false; 
               }
             }
             else if (rand < 0.6) { 
               if (!isSnowing && Math.random() < 0.3) {
                 setWeatherAlert({
                    type: 'blizzard',
                    title: 'Sub-Zero Blizzard Front',
                    description: 'Glacial atmospheric front approaching SkyMetropolis; power sub-stations prepare for maximum capacity.',
                    ticksRemaining: 4
                 });
                 setIsWeatherPopupVisible(true);
                 setIsPaused(true);
               } else {
                 isSnowing = !isSnowing; 
                 isRaining = false; 
               }
             }
             else { 
               if (!isFoggy && Math.random() < 0.3) {
                 setWeatherAlert({
                    type: 'fog',
                    title: 'Dense Fog Transport Disruption',
                    description: 'Zero-visibility maritime fog bank rolling over high-density transit corridors.',
                    ticksRemaining: 4
                 });
                 setIsWeatherPopupVisible(true);
                 setIsPaused(true);
               } else {
                 isFoggy = !isFoggy; 
               }
             }
          }
        }

        const nextWeather = { cycle, isRaining, isSnowing, isFoggy };
        weatherRef.current = nextWeather;
        return nextWeather;
      });

      // Automatic Weather Summary Chronicle Entry
      const nextDayNum = statsRef.current.day + 1;
      const weatherEntry = generateDailyWeatherChronicle(gridRef.current, weatherRef.current, nextDayNum);
      addChronicleEntry(weatherEntry);

      // 7. Trigger news
      fetchNews();

      // 8. Auto Play Engine Execution
      if (isAutoPlayActiveRef.current) {
        autoPlayStepCounter.current += 1;
        if (autoPlayStepCounter.current % 2 === 0) {
          runAutoPlayStep();
        }
      }

      // 9. Drone LiDAR Sweep & Auto-Repair Execution
      if (isDroneActiveRef.current) {
        const buildings: TileData[] = [];
        gridRef.current.flat().forEach(t => {
          if (t.buildingType !== BuildingType.None && t.buildingType !== BuildingType.Road) {
            buildings.push(t);
          }
        });

        if (buildings.length > 0) {
          const target = buildings[Math.floor(Math.random() * buildings.length)];
          setDronePos({ x: target.x, y: target.y });

          // Gradual durability wear
          let durability = target.durability ?? (Math.floor(Math.random() * 20) + 80);
          if (weatherRef.current.isRaining || weatherRef.current.isSnowing) {
            durability = Math.max(20, durability - Math.floor(Math.random() * 3 + 1));
          } else if (Math.random() < 0.4) {
            durability = Math.max(30, durability - 1);
          }
          let efficiency = Math.min(100, Math.round(durability * 0.95 + (target.level || 1) * 2));

          // Auto-Repair Execution
          if (isAutoRepairEnabledRef.current && durability < 80) {
            const missing = 100 - durability;
            const config = BUILDINGS[target.buildingType];
            const repairCost = Math.max(10, Math.round((config.cost * 0.15) * (missing / 100) + 15));

            if (statsRef.current.money >= repairCost) {
              setStats(s => ({ ...s, money: s.money - repairCost }));
              durability = 100;
              efficiency = 100;

              triggerHint(target.x, target.y, `Auto-Repaired (-$${repairCost})`, '#10b981');
              setAutoRepairLog(prev => [
                {
                  id: `auto-repair-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  buildingName: config.name,
                  x: target.x,
                  y: target.y,
                  cost: repairCost,
                  timestamp: `Day ${statsRef.current.day}`
                },
                ...prev.slice(0, 19)
              ]);
            } else {
              triggerHint(target.x, target.y, `Low Treasury! Repair Needed ($${repairCost})`, '#ef4444');
            }
          }

          // Update building state in grid
          const nextGrid = gridRef.current.map(row => [...row]);
          nextGrid[target.y][target.x] = {
            ...target,
            durability,
            efficiency
          };
          gridRef.current = nextGrid;
          setGrid(nextGrid);
        }
      }

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted, runAutoPlayStep]);


  // --- Interaction & Building Menu Logic ---
  const [selectedBuildingTilePos, setSelectedBuildingTilePos] = useState<{ x: number; y: number } | null>(null);

  const selectedBuildingTile = useMemo(() => {
    if (!selectedBuildingTilePos) return null;
    const { x, y } = selectedBuildingTilePos;
    if (grid[y] && grid[y][x] && grid[y][x].buildingType !== BuildingType.None) {
      return grid[y][x];
    }
    return null;
  }, [grid, selectedBuildingTilePos]);

  const isSelectedTileShielded = useMemo(() => {
    if (!selectedBuildingTilePos) return false;
    const { x, y } = selectedBuildingTilePos;
    const shieldPositions: { x: number; y: number }[] = [];
    grid.forEach(row => {
      row.forEach(t => {
        if (t.buildingType === BuildingType.AtmosphericShield) {
          shieldPositions.push({ x: t.x, y: t.y });
        }
      });
    });
    return shieldPositions.some(sp => Math.hypot(sp.x - x, sp.y - y) <= 4.0);
  }, [grid, selectedBuildingTilePos]);

  const handleUpgradeBuildingLevel = useCallback((x: number, y: number) => {
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tile = currentGrid[y]?.[x];
    if (!tile || tile.buildingType === BuildingType.None) return;

    const config = BUILDINGS[tile.buildingType];
    const currentLvl = tile.level || 1;
    if (currentLvl >= 5) {
      addNewsItem({ id: Date.now().toString(), text: `${config.name} is at maximum level (5).`, type: 'neutral' });
      return;
    }

    const upgradeCost = Math.floor(config.cost * (currentLvl + 0.5));
    if (currentStats.money < upgradeCost) {
      addNewsItem({ id: Date.now().toString(), text: `Insufficient funds ($${upgradeCost} needed to upgrade ${config.name}).`, type: 'negative' });
      return;
    }

    setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[y][x] = { ...tile, level: currentLvl + 1 };
    setGrid(newGrid);

    triggerHint(x, y, `Lvl ${currentLvl + 1}!`, '#fbbf24');
    audioService.playUpgrade();
    addNewsItem({
      id: Date.now().toString(),
      text: `${config.name} at (${x + 1}, ${y + 1}) upgraded to Level ${currentLvl + 1}!`,
      type: 'positive'
    });
  }, [addNewsItem, triggerHint]);

  const handleUpgradeBuildingResilience = useCallback((x: number, y: number) => {
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tile = currentGrid[y]?.[x];
    if (!tile || tile.buildingType === BuildingType.None) return;

    const config = BUILDINGS[tile.buildingType];
    const currentResLevel = tile.resilienceLevel || (tile.isResilient ? 3 : 0);
    if (currentResLevel >= 3) {
      addNewsItem({ id: Date.now().toString(), text: `${config.name} already has Maximum Resilience (Tier 3).`, type: 'neutral' });
      return;
    }

    const nextTier = currentResLevel + 1;
    const cost = nextTier === 1 ? 200 : nextTier === 2 ? 450 : 850;

    if (currentStats.money < cost) {
      addNewsItem({ id: Date.now().toString(), text: `Need $${cost} to upgrade Resilience to Tier ${nextTier}.`, type: 'negative' });
      return;
    }

    setStats(prev => ({ ...prev, money: prev.money - cost }));
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[y][x] = { 
      ...tile, 
      resilienceLevel: nextTier,
      isResilient: nextTier >= 3
    };
    setGrid(newGrid);

    triggerHint(x, y, `Resilience Tier ${nextTier}!`, '#06b6d4');
    audioService.playUpgrade();
    addNewsItem({
      id: Date.now().toString(),
      text: `🛡️ [Resilience] ${config.name} at (${x + 1}, ${y + 1}) upgraded to Resilience Tier ${nextTier} (${nextTier >= 3 ? '100% Weather Immune' : nextTier === 2 ? '80% Storm Shielded' : '50% Weather Sealed'})!`,
      type: 'positive'
    });
    addChronicleEntry({
      day: statsRef.current.day,
      title: `Structural Resilience: ${config.name}`,
      description: `Upgraded ${config.name} at (${x + 1}, ${y + 1}) to Resilience Tier ${nextTier}. Structure now withstands weather incidents.`,
      category: 'milestone',
      impact: `Resilience Tier ${nextTier}`
    });
  }, [addNewsItem, triggerHint, addChronicleEntry]);

  const handleDemolishBuilding = useCallback((x: number, y: number) => {
    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tile = currentGrid[y]?.[x];
    if (!tile || tile.buildingType === BuildingType.None) return;

    const demolishCost = 5;
    if (currentStats.money < demolishCost) {
      addNewsItem({ id: Date.now().toString(), text: "Cannot afford demolition costs ($5 required).", type: 'negative' });
      return;
    }

    setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[y][x] = { x, y, buildingType: BuildingType.None };
    setGrid(newGrid);

    setSelectedBuildingTilePos(null);
    triggerHint(x, y, `-$${demolishCost}`, '#ef4444');
    addNewsItem({ id: Date.now().toString(), text: `Demolished building at (${x + 1}, ${y + 1}).`, type: 'neutral' });
  }, [addNewsItem, triggerHint]);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return; // Prevent clicking through start screen

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool; // Capture current tool
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];

    // If clicking an existing building -> open Building Click Menu!
    if (currentTile.buildingType !== BuildingType.None) {
      setSelectedBuildingTilePos({ x, y });
      return;
    }

    // Placement Logic for empty ground
    if (currentTile.buildingType === BuildingType.None && tool !== BuildingType.None) {
      const buildingConfig = BUILDINGS[tool];
      if (currentStats.money >= buildingConfig.cost) {
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool, level: 1, resilienceLevel: 0, isResilient: false };
        setGrid(newGrid);
        triggerHint(x, y, `Built!`, buildingConfig.color);
        audioService.playPlacement();
      } else {
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  }, [selectedTool, addNewsItem, gameStarted, triggerHint]);

  const handleAutoplace = useCallback(() => {
    if (!gameStarted || selectedTool === BuildingType.None) return;

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool;
    const buildingConfig = BUILDINGS[tool];

    const spot = findOptimalPosition(currentGrid, tool);
    if (!spot) {
      addNewsItem({
        id: Date.now().toString() + Math.random(),
        text: `No optimal vacancies found for placing ${buildingConfig.name}.`,
        type: 'neutral'
      });
      return;
    }

    if (currentStats.money >= buildingConfig.cost) {
      setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));

      const newGrid = currentGrid.map(row => [...row]);
      newGrid[spot.y][spot.x] = { x: spot.x, y: spot.y, buildingType: tool, level: 1 };
      setGrid(newGrid);

      triggerHint(spot.x, spot.y, `Auto-Built!`, '#fbbf24');
      audioService.playPlacement();

      addNewsItem({
        id: Date.now().toString() + Math.random(),
        text: `Metropolitan planner auto-placed a ${buildingConfig.name} at (${spot.x + 1}, ${spot.y + 1}) for maximum performance: ${spot.explanation}.`,
        type: 'positive'
      });
    } else {
      addNewsItem({
        id: Date.now().toString() + Math.random(),
        text: `Treasury inadequate to auto-place ${buildingConfig.name} ($${buildingConfig.cost} needed).`,
        type: 'negative'
      });
    }
  }, [selectedTool, gameStarted, addNewsItem, triggerHint]);

  const handleClaimReward = () => {
    if (currentGoal && currentGoal.completed) {
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} deposited to treasury.`, type: 'positive'});
      setCurrentGoal(null);
      fetchNewGoal();
    }
  };

  const handleInjectMarketCapital = useCallback((amount: number) => {
    setStats(prev => {
      if (prev.money < amount) return prev;
      return { ...prev, money: prev.money - amount };
    });
    setAetheriumMarket(prev => {
      const newPrice = Math.min(350, Math.round(prev.currentPrice * 1.10 * 100) / 100);
      const newMult = Math.max(0.6, Math.min(2.5, newPrice / 100)) * (prev.activeEvent ? prev.activeEvent.multiplier : 1.0);
      return {
        ...prev,
        previousPrice: prev.currentPrice,
        currentPrice: newPrice,
        overallMultiplier: newMult,
        trend: 'up',
        priceHistory: [
          ...prev.priceHistory,
          { day: statsRef.current.day, price: newPrice, eventTitle: 'Municipal Stabilization' }
        ].slice(-30)
      };
    });
    addNewsItem({ id: Date.now().toString(), text: `Municipal Treasury injected $${amount.toLocaleString()} into Aetherium Market nodes (+10% Boost).`, type: 'positive' });
  }, [addNewsItem]);

  const handleSpeculateMarket = useCallback((amount: number) => {
    setStats(prev => {
      if (prev.money < amount) return prev;
      return { ...prev, money: prev.money - amount };
    });
    setAetheriumMarket(prev => {
      const newPrice = Math.min(350, Math.round(prev.currentPrice * 1.05 * 100) / 100);
      return {
        ...prev,
        previousPrice: prev.currentPrice,
        currentPrice: newPrice,
        trend: 'up'
      };
    });
    addNewsItem({ id: Date.now().toString(), text: `Market speculation hedge contract executed ($${amount.toLocaleString()}). Yield positions secured.`, type: 'positive' });
  }, [addNewsItem]);

  const handleStart = (enabled: boolean) => {
    setAiEnabled(enabled);
    setGameStarted(true);
  };

  const handleSaveSnapshot = useCallback(async () => {
    if (isSavingSnapshot) return;
    setIsSavingSnapshot(true);
    notify({
      type: 'info',
      title: 'Saving Snapshot',
      message: 'Committing metropolis to the Global Atlas public ledger...',
      duration: 3000
    });
    try {
      await saveCitySnapshot(grid, stats, `Mayor-${Date.now().toString().slice(-4)}`);
      notify({
        type: 'success',
        title: 'Snapshot Saved',
        message: 'Your city has been successfully recorded in the Global Atlas.',
        duration: 5000,
        icon: Globe
      });
    } catch (e) {
      console.error(e);
      notify({
        type: 'alert',
        title: 'Save Failed',
        message: 'Could not commit to the Global Atlas.',
        duration: 5000
      });
    } finally {
      setIsSavingSnapshot(false);
    }
  }, [grid, stats, notify, isSavingSnapshot]);

  return (
    <div className="relative w-screen h-screen overflow-hidden selection:bg-transparent selection:text-transparent bg-sky-900">
      {/* 3D Rendering Layer - Always visible now, providing background for start screen */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool}
        population={stats.population}
        weather={weather}
        hints={hints}
        money={stats.money}
        optimalSpot={optimalSpot}
        isEconomicOverlayActive={isEconomicOverlayActive}
        isWeatherOverlayActive={isWeatherOverlayActive}
        activeAlert={weatherAlert}
        isPaused={isPaused || !gameStarted}
        refinementState={materialRefinement}
        dronePos={dronePos}
        isDroneActive={isDroneActive}
        onHoverTile={(x, y) => {
          if (x >= 0 && y >= 0) {
            setHoveredTileData(grid[y][x]);
          } else {
            setHoveredTileData(null);
          }
        }}
      />
      
      {/* Start Screen Overlay */}
      {!gameStarted && (
        <StartScreen onStart={handleStart} />
      )}

      {/* UI Layer */}
      {gameStarted && (
        <UIOverlay
          stats={stats}
          taxRate={taxRate}
          onTaxChange={setTaxRate}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          hoveredTile={hoveredTileData}
          weather={weather}
          onToggleWeather={(w) => setWeather(prev => ({ ...prev, ...w }))}
          optimalSpot={optimalSpot}
          onAutoplace={handleAutoplace}
          isAutoPlayActive={isAutoPlayActive}
          onToggleAutoPlay={handleToggleAutoPlay}
          triNodeState={triNodeState}
          onTriggerPulse={handleTriggerPulse}
          onGenerateDirective={handleGenerateDirective}
          onCompleteDirective={handleCompleteDirective}
          isGeneratingDirective={isGeneratingDirective}
          chronicleEntries={chronicleEntries}
          onAddCustomChronicleNote={handleAddCustomChronicleNote}
          isEconomicOverlayActive={isEconomicOverlayActive}
          onToggleEconomicOverlay={() => setIsEconomicOverlayActive(!isEconomicOverlayActive)}
          isWeatherOverlayActive={isWeatherOverlayActive}
          onToggleWeatherOverlay={() => setIsWeatherOverlayActive(!isWeatherOverlayActive)}
          cityHistory={cityHistory}
          aetheriumMarket={aetheriumMarket}
          onInjectMarketCapital={handleInjectMarketCapital}
          onSpeculateMarket={handleSpeculateMarket}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          activeWeatherAlert={weatherAlert}
          onSaveSnapshot={handleSaveSnapshot}
          onViewAtlas={() => setIsAtlasViewActive(true)}
          onOpenAdvisorChat={() => setIsAdvisorChatOpen(true)}
          onRestartGame={() => handleStart(aiEnabled)}
          grid={grid}
          refinementState={materialRefinement}
          onTriggerRefinementSurge={handleTriggerRefinementSurge}
          isDroneActive={isDroneActive}
          onToggleDroneActive={() => setIsDroneActive(!isDroneActive)}
          isAutoRepairEnabled={isAutoRepairEnabled}
          onToggleAutoRepair={() => setIsAutoRepairEnabled(!isAutoRepairEnabled)}
          onRepairBuilding={handleRepairBuilding}
          onRepairAllBuildings={handleRepairAllBuildings}
          dronePos={dronePos}
          autoRepairLog={autoRepairLog}
        />
      )}

      {/* AdvisorAI Multi-Turn Chatbot Modal */}
      {isAdvisorChatOpen && (
        <AdvisorChatModal
          stats={stats}
          grid={grid}
          weather={weather}
          weatherAlert={weatherAlert}
          refinementState={materialRefinement}
          onClose={() => setIsAdvisorChatOpen(false)}
        />
      )}

      {/* Building Click Menu Modal */}
      {selectedBuildingTile && (
        <BuildingMenuModal
          tile={selectedBuildingTile}
          stats={stats}
          weather={weather}
          isCoveredByShield={isSelectedTileShielded}
          onClose={() => setSelectedBuildingTilePos(null)}
          onUpgradeLevel={handleUpgradeBuildingLevel}
          onUpgradeResilience={handleUpgradeBuildingResilience}
          onDemolish={handleDemolishBuilding}
          onOpenAdvisorAI={() => setIsAdvisorChatOpen(true)}
        />
      )}

      {/* Atlas View Overlay */}
      {isAtlasViewActive && (
        <AtlasView 
          onClose={() => setIsAtlasViewActive(false)} 
          currentLocalStats={stats}
          onLoadCityState={(loadedGrid, loadedStats) => {
            setGrid(loadedGrid);
            setStats(loadedStats);
            setIsAtlasViewActive(false);
            addNotification("City State loaded from Atlas into live simulation!", "positive");
          }}
        />
      )}

      {/* Generic Notification System */}
      <NotificationManager notifications={notifications} removeNotification={removeNotification} />

      {/* High-Priority Weather Alert Popup */}
      <AnimatePresence>
        {weatherAlert && isWeatherPopupVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/80 backdrop-blur-sm pointer-events-auto"
          >
             <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md w-full m-4"
             >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${weatherAlert.type === 'blizzard' ? 'bg-cyan-500/20 text-cyan-400' : weatherAlert.type === 'monsoon' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {weatherAlert.type === 'blizzard' ? <Snowflake className="w-8 h-8" /> : weatherAlert.type === 'monsoon' ? <CloudRain className="w-8 h-8" /> : <Wind className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      <h2 className="text-xl font-bold text-white uppercase tracking-wider">SEVERE WEATHER</h2>
                    </div>
                    <h3 className="text-sm text-slate-400">{weatherAlert.title}</h3>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">{weatherAlert.description}</p>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                     <p className="text-xs text-slate-400 mb-1">Time until impact:</p>
                     <div className="text-lg font-mono text-white">{weatherAlert.ticksRemaining * (TICK_RATE_MS / 1000)} Seconds</div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsWeatherPopupVisible(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  <Pause className="w-5 h-5" />
                  Acknowledge (Game Paused)
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;