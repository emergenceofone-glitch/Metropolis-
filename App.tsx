/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, AIGoal, NewsItem, HintIndicator, WeatherState } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { generateCityGoal, generateNewsEvent } from './services/geminiService';
import { audioService } from './services/audioService';

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
  
  // --- AI State ---
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState(false);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  
  // Refs for accessing state inside intervals without dependencies
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  const goalRef = useRef(currentGoal);
  const aiEnabledRef = useRef(aiEnabled);

  // Sync refs
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { goalRef.current = currentGoal; }, [currentGoal]);
  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  // --- AI Logic Wrappers ---

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

  const fetchNews = useCallback(async () => {
    // chance to fetch news per tick
    if (!aiEnabledRef.current || Math.random() > 0.15) return; 
    const news = await generateNewsEvent(statsRef.current, null);
    if (news) addNewsItem(news);
  }, [addNewsItem]);


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
      // 1. Calculate income/pop gen
      let totalBaseIncome = 0;
      let totalBasePopGrowth = 0;
      let buildingCounts: Record<string, number> = {};
      let industrialCount = 0;
      let parkCount = 0;
      let monumentCount = 0;

      gridRef.current.flat().forEach(tile => {
        if (tile.buildingType !== BuildingType.None) {
          const config = BUILDINGS[tile.buildingType];
          const level = tile.level || 1;
          const income = config.incomeGen * level;
          const pop = config.popGen * level;

          totalBaseIncome += income;
          totalBasePopGrowth += pop;
          buildingCounts[tile.buildingType] = (buildingCounts[tile.buildingType] || 0) + 1;
          
          if (tile.buildingType === BuildingType.Industrial) industrialCount++;
          if (tile.buildingType === BuildingType.Park) parkCount++;
          if (tile.buildingType === BuildingType.Monument) monumentCount++;

          // Periodic hints for active buildings
          if (Math.random() < 0.1) {
             if (income > 0) triggerHint(tile.x, tile.y, `+$${income}`, '#4ade80');
             if (pop > 0) triggerHint(tile.x, tile.y, `+${pop} Pop`, '#60a5fa');
          }
        }
      });

      // 2. Happiness Calculation
      // Tax penalty: > 15% reduces happiness, < 10% increases it
      const taxImpact = (10 - taxRate) * 2; 
      // Industrial penalty: people hate factories near their city (simplified to total count for now)
      const pollutionImpact = industrialCount * -1;
      // Park bonus
      const parkImpact = parkCount * 3;
      // Monument bonus
      const monumentImpact = monumentCount * 15;
      
      const newHappiness = Math.min(100, Math.max(0, statsRef.current.happiness + (taxImpact + pollutionImpact + parkImpact + monumentImpact) / 10));

      // 3. Modifiers based on Happiness
      const happinessMultiplier = newHappiness / 100; // 0 to 1
      const effectivePopGrowth = totalBasePopGrowth * happinessMultiplier;
      // Tax Income calc: (Base Income) * (Tax Rate / 10) * (Happiness Modifier)
      const effectiveIncome = totalBaseIncome * (taxRate / 10) * (newHappiness / 75);

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
        }

        const newStats = {
          money: prev.money + effectiveIncome,
          population: newPop,
          day: prev.day + 1,
          happiness: newHappiness,
          cityLevel: newLevel,
          experience: finalExperience,
        };
        
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

        if (Math.random() < 0.05) {
           const rand = Math.random();
           if (rand < 0.3) { isRaining = !isRaining; isSnowing = false; }
           else if (rand < 0.6) { isSnowing = !isSnowing; isRaining = false; }
           else { isFoggy = !isFoggy; }
        }

        return { ...prev, cycle, isRaining, isSnowing, isFoggy };
      });

      // 7. Trigger news
      fetchNews();

    }, TICK_RATE_MS);

    return () => clearInterval(intervalId);
  }, [fetchNews, gameStarted]);


  // --- Interaction Logic ---

  const handleTileClick = useCallback((x: number, y: number) => {
    if (!gameStarted) return; // Prevent clicking through start screen

    const currentGrid = gridRef.current;
    const currentStats = statsRef.current;
    const tool = selectedTool; // Capture current tool
    
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    const currentTile = currentGrid[y][x];
    const buildingConfig = BUILDINGS[tool];

    // Bulldoze logic
    if (tool === BuildingType.None) {
      if (currentTile.buildingType !== BuildingType.None) {
        const demolishCost = 5;
        if (currentStats.money >= demolishCost) {
            const newGrid = currentGrid.map(row => [...row]);
            newGrid[y][x] = { ...currentTile, buildingType: BuildingType.None };
            setGrid(newGrid);
            setStats(prev => ({ ...prev, money: prev.money - demolishCost }));
            triggerHint(x, y, `-$${demolishCost}`, '#ef4444');
            // Sound effect here
        } else {
            addNewsItem({id: Date.now().toString(), text: "Cannot afford demolition costs.", type: 'negative'});
        }
      }
      return;
    }

    // Upgrade Logic
    if (currentTile.buildingType === tool && tool !== BuildingType.Road) {
      const currentLevel = currentTile.level || 1;
      const maxLevel = 5;
      
      if (currentLevel < maxLevel) {
        const upgradeCost = Math.floor(buildingConfig.cost * (currentLevel + 0.5));
        
        if (currentStats.money >= upgradeCost) {
          setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
          
          const newGrid = currentGrid.map(row => [...row]);
          newGrid[y][x] = { ...currentTile, level: currentLevel + 1 };
          setGrid(newGrid);
          triggerHint(x, y, `Level Up!`, '#fbbf24');
          
          audioService.playUpgrade();
          addNewsItem({
            id: Date.now().toString(), 
            text: `${buildingConfig.name} upgraded to Level ${currentLevel + 1}!`, 
            type: 'positive'
          });
        } else {
          addNewsItem({
            id: Date.now().toString(), 
            text: `Need $${upgradeCost} to upgrade ${buildingConfig.name}.`, 
            type: 'negative'
          });
        }
      } else {
        addNewsItem({
          id: Date.now().toString(), 
          text: `${buildingConfig.name} is already at maximum level.`, 
          type: 'neutral'
        });
      }
      return;
    }

    // Placement Logic
    if (currentTile.buildingType === BuildingType.None) {
      if (currentStats.money >= buildingConfig.cost) {
        // Deduct cost
        setStats(prev => ({ ...prev, money: prev.money - buildingConfig.cost }));
        
        // Place building (initial level 1)
        const newGrid = currentGrid.map(row => [...row]);
        newGrid[y][x] = { ...currentTile, buildingType: tool, level: 1 };
        setGrid(newGrid);
        triggerHint(x, y, `Built!`, buildingConfig.color);
        audioService.playPlacement();
      } else {
        // Not enough money feedback
        addNewsItem({id: Date.now().toString() + Math.random(), text: `Treasury insufficient for ${buildingConfig.name}.`, type: 'negative'});
      }
    }
  }, [selectedTool, addNewsItem, gameStarted]);

  const handleClaimReward = () => {
    if (currentGoal && currentGoal.completed) {
      setStats(prev => ({ ...prev, money: prev.money + currentGoal.reward }));
      addNewsItem({id: Date.now().toString(), text: `Goal achieved! ${currentGoal.reward} deposited to treasury.`, type: 'positive'});
      setCurrentGoal(null);
      fetchNewGoal();
    }
  };

  const handleStart = (enabled: boolean) => {
    setAiEnabled(enabled);
    setGameStarted(true);
  };

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
        />
      )}
    </div>
  );
}

export default App;