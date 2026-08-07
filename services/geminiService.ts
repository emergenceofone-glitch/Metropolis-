import { AIGoal, BuildingType, CityStats, Grid, NewsItem, MaterialRefinementState } from "../types";
import { BUILDINGS } from "../constants";

// --- Procedural Fallbacks ---

const FALLBACK_NEWS_HEADLINES: { text: string; type: 'positive' | 'negative' | 'neutral' }[] = [
  { text: "Market analysts report steady financial growth across the central district.", type: "positive" },
  { text: "Local artisans host a vibrant cloud-side festival; civic happiness surges.", type: "positive" },
  { text: "Aetherium collectors log record-high energy capture levels today.", type: "positive" },
  { text: "City council approves new zoning incentives for incoming citizens.", type: "positive" },
  { text: "Engineers complete routine maintenance on the sky platform stabilization grid.", type: "neutral" },
  { text: "Minor traffic slowdowns reported along primary avenues; transit optimization suggested.", type: "neutral" },
  { text: "Atmospheric weather sensors indicate clear skies and stable pressure ahead.", type: "neutral" },
  { text: "Solar winds briefly fluctuate power output; backup generators engaged smoothly.", type: "neutral" },
  { text: "Citizens request additional green spaces and parkland near residential sectors.", type: "neutral" },
  { text: "High demand for commercial space as local economy expands.", type: "positive" }
];

function getFallbackNews(recentAction: string | null): NewsItem {
  if (recentAction) {
    return {
      id: Date.now().toString() + Math.random(),
      text: `Municipal Update: ${recentAction} executed successfully across the city grid.`,
      type: 'positive'
    };
  }
  const item = FALLBACK_NEWS_HEADLINES[Math.floor(Math.random() * FALLBACK_NEWS_HEADLINES.length)];
  return {
    id: Date.now().toString() + Math.random(),
    text: item.text,
    type: item.type
  };
}

function getFallbackGoal(stats: CityStats, grid: Grid): AIGoal {
  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    if (tile.buildingType !== BuildingType.None) {
      counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
    }
  });

  if (stats.population < 30) {
    return {
      description: "Expand the residential zone to welcome 30 citizens to Sky Metropolis.",
      targetType: 'population',
      targetValue: 30,
      reward: 1200,
      completed: false
    };
  }

  if (stats.money < 2500) {
    return {
      description: "Boost municipal revenue to reach $2,500 in the city treasury.",
      targetType: 'money',
      targetValue: 2500,
      reward: 1500,
      completed: false
    };
  }

  const resCount = counts[BuildingType.Residential] || 0;
  const commCount = counts[BuildingType.Commercial] || 0;

  if (commCount < Math.floor(resCount / 2)) {
    return {
      description: `Construct more commercial buildings to support local commerce (${commCount + 2} target).`,
      targetType: 'building_count',
      targetValue: commCount + 2,
      buildingType: BuildingType.Commercial,
      reward: 2000,
      completed: false
    };
  }

  return {
    description: `Build additional residential structures to reach a target population of ${stats.population + 25}.`,
    targetType: 'population',
    targetValue: stats.population + 25,
    reward: 1800,
    completed: false
  };
}

function getFallbackDirective(triNodeState: import('../types').TriNodeState): import('../types').EcosystemDirective {
  const districts: ('DIST-PS' | 'DIST-RD' | 'DIST-OT')[] = ['DIST-PS', 'DIST-RD', 'DIST-OT'];
  const sourceDistrict = districts[Math.floor(Math.random() * districts.length)];
  
  return {
    id: `directive-${Date.now()}`,
    sourceDistrict,
    title: `Aetherium ${sourceDistrict} Grid Synchronization`,
    objective: `Calibrate municipal grid systems in ${sourceDistrict} to stabilize physical pulses and maintain platform homeostasis.`,
    treasuryReward: 3500,
    rewardYieldMultiplier: 1.45,
    active: true,
    ambientSourceVersion: 'v1.0-ambient-procedural'
  };
}

// --- Goal Generation ---

export const generateCityGoal = async (stats: CityStats, grid: Grid): Promise<AIGoal | null> => {
  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
  });

  const buildingStats = Object.values(BUILDINGS).filter(b => b.type !== BuildingType.None).map(b => ({
    type: b.type,
    cost: b.cost,
    pop: b.popGen,
    income: b.incomeGen
  }));

  try {
    const response = await fetch("/api/gemini/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, counts, buildingStats })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.goal) return data.goal;
    }
  } catch (error) {
    console.warn("Server Gemini Goal fallback engaged:", error);
  }
  return getFallbackGoal(stats, grid);
};

// --- News Feed Generation ---

export const generateNewsEvent = async (stats: CityStats, recentAction: string | null): Promise<NewsItem | null> => {
  try {
    const response = await fetch("/api/gemini/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, recentAction })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.news) return data.news;
    }
  } catch (error) {
    console.warn("Server Gemini News fallback engaged:", error);
  }
  return getFallbackNews(recentAction);
};

// --- Tri-Node Narrative Payload ---

export const generateArcadeNarrativePayload = async (
  stats: CityStats,
  triNodeState: import('../types').TriNodeState
): Promise<import('../types').EcosystemDirective | null> => {
  // Use procedural or fallback if needed
  return getFallbackDirective(triNodeState);
};

// --- Strategic City & Refinement Analysis ---

export interface CityAnalysisResult {
  cityGrade: string;
  executiveSummary: string;
  supplyChainDiagnosis: string;
  keyRecommendations: string[];
  suggestedMayoralDecree: string;
}

export const generateCityAnalysis = async (
  stats: CityStats,
  grid: Grid,
  refinementState: MaterialRefinementState
): Promise<CityAnalysisResult | null> => {
  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
  });

  try {
    const response = await fetch("/api/gemini/city-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, counts, refinementState })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.analysis) return data.analysis;
    }
  } catch (error) {
    console.warn("Server Gemini City Analysis fallback engaged:", error);
  }

  // Procedural Fallback
  return {
    cityGrade: stats.happiness >= 80 ? "A" : stats.happiness >= 65 ? "B" : "C",
    executiveSummary: `Sky Metropolis is maintaining steady operation on Day ${stats.day} with a population of ${stats.population} citizens and a treasury of $${stats.money}.`,
    supplyChainDiagnosis: `Refined Aetherium output stands at ${refinementState.refinedAetheriumProduction} units/tick against commercial synthesis demand of ${refinementState.refinedAetheriumDemand} units/tick. Quality of Life multiplier is ${refinementState.qualityOfLifeMultiplier}x.`,
    keyRecommendations: [
      "Maintain a balanced 2:1 ratio of Residential zones to Commercial synthesis hubs.",
      "Upgrade Commercial structures to Level 2+ to unlock full Refined Aetherium Quality of Life bonuses.",
      "Deploy Atmospheric Shield Domes at key intersections to protect supply chains from storm disruptions."
    ],
    suggestedMayoralDecree: "Mayoral Directive: Industrial Refinement Optimization Decree"
  };
};
