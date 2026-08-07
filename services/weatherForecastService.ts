import { WeatherState, WeatherAlert, Grid, TileData, BuildingType } from '../types';

export type ForecastCondition = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';
export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'severe';

export interface ForecastDay {
  dayNumber: number;
  condition: ForecastCondition;
  title: string;
  temperature: string;
  riskLevel: RiskLevel;
  description: string;
  incidentType?: 'monsoon' | 'blizzard' | 'fog' | 'clear';
  recommendedAction: string;
}

const CONDITION_PRESETS: Record<ForecastCondition, {
  titles: string[];
  temperatures: string[];
  descriptions: string[];
  actions: string[];
}> = {
  clear: {
    titles: ['Clear Atmospheric Skies', 'Optimal Cloud Horizon', 'Stable High-Pressure System'],
    temperatures: ['22°C', '24°C', '21°C', '25°C'],
    descriptions: [
      'Unobstructed sunlight and stable cloud buoyancy across all floating districts.',
      'Calm winds and clear skies. Excellent condition for commercial and residential activity.',
      'Optimal atmospheric pressure. High solar and wind turbine harvest efficiency.'
    ],
    actions: [
      'Great time to expand residential and commercial zones without weather risk.',
      'Focus on revenue growth and civic monuments while weather is favorable.'
    ]
  },
  rain: {
    titles: ['Monsoonal Downpour Threat', 'Heavy Rain Front', 'Atmospheric Moisture Surge'],
    temperatures: ['14°C', '16°C', '15°C'],
    descriptions: [
      'Precipitation system testing lower drainage networks and unshielded structures.',
      'Sustained rainfall expected to reduce economic yield on unfortified buildings.',
      'Heavy cloud cover causing localized runoff across commercial corridors.'
    ],
    actions: [
      'Deploy Atmospheric Shield Domes around commercial hubs to eliminate yield penalties.',
      'Upgrade unshielded structures to Resilience Tier 1 (Weather-Sealed).'
    ]
  },
  snow: {
    titles: ['Sub-Zero Blizzard Front', 'Frostbite Cold Wave', 'Atmospheric Glacial Surge'],
    temperatures: ['-4°C', '-8°C', '-2°C', '-10°C'],
    descriptions: [
      'Freezing temperatures threatening power sub-stations and population warmth.',
      'Blizzard conditions will reduce population generation on unshielded residential zones.',
      'Severe sub-zero squalls rolling across higher altitude sky-islands.'
    ],
    actions: [
      'Ensure high-density residential tiles are covered by Atmospheric Shields.',
      'Upgrade high-value residential buildings to Resilience Tier 2 or 3.'
    ]
  },
  fog: {
    titles: ['Dense Fog Navigation Risk', 'Maritime Cloud Bank', 'Zero-Visibility Front'],
    temperatures: ['11°C', '12°C', '10°C'],
    descriptions: [
      'Low visibility affecting transport networks and skyway transit lines.',
      'Thick maritime cloud bank reducing line-of-sight and logistics throughput.',
      'Zero-visibility atmosphere settled over commercial and industrial transit hubs.'
    ],
    actions: [
      'Fortify industrial and transportation roads with Resilience upgrades.',
      'Position Resilience Beacons to maintain high city efficiency.'
    ]
  },
  storm: {
    titles: ['Supercell Atmospheric Storm', 'Electro-Magnetic Tempest', 'Category 4 Sky Gale'],
    temperatures: ['8°C', '6°C', '5°C'],
    descriptions: [
      'Severe atmospheric storm combining torrential rain, gale-force winds, and lightning.',
      'Impending severe weather event threatening maximum economic and population penalties.',
      'Turbulent vortex front moving directly through the central floating grid.'
    ],
    actions: [
      'URGENT: Construct Atmospheric Shield Domes at key intersections immediately!',
      'Upgrade crucial structures to Resilience Tier 3 (100% Weather Immune).'
    ]
  }
};

// Seeded pseudo-random forecast based on city day and seed
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generate3DayForecast(
  currentDay: number,
  currentWeather: WeatherState,
  activeAlert: WeatherAlert | null,
  grid: Grid
): ForecastDay[] {
  const forecast: ForecastDay[] = [];

  for (let offset = 1; offset <= 3; offset++) {
    const targetDay = currentDay + offset;
    const seed = targetDay * 1337 + currentDay * 7;
    const randValue = pseudoRandom(seed);

    let condition: ForecastCondition = 'clear';
    let riskLevel: RiskLevel = 'minimal';

    // If an alert is active, Day + 1 or Day + 2 gets a storm or matching incident
    if (activeAlert && offset === 1) {
      if (activeAlert.type === 'monsoon') condition = 'rain';
      else if (activeAlert.type === 'blizzard') condition = 'snow';
      else if (activeAlert.type === 'fog') condition = 'fog';
      else condition = 'storm';

      riskLevel = 'severe';
    } else {
      if (randValue < 0.45) {
        condition = 'clear';
        riskLevel = 'minimal';
      } else if (randValue < 0.65) {
        condition = 'rain';
        riskLevel = 'moderate';
      } else if (randValue < 0.82) {
        condition = 'snow';
        riskLevel = 'high';
      } else if (randValue < 0.93) {
        condition = 'fog';
        riskLevel = 'low';
      } else {
        condition = 'storm';
        riskLevel = 'severe';
      }
    }

    const preset = CONDITION_PRESETS[condition];
    const titleIdx = Math.floor(pseudoRandom(seed + 1) * preset.titles.length);
    const tempIdx = Math.floor(pseudoRandom(seed + 2) * preset.temperatures.length);
    const descIdx = Math.floor(pseudoRandom(seed + 3) * preset.descriptions.length);
    const actIdx = Math.floor(pseudoRandom(seed + 4) * preset.actions.length);

    forecast.push({
      dayNumber: targetDay,
      condition,
      title: preset.titles[titleIdx],
      temperature: preset.temperatures[tempIdx],
      riskLevel,
      description: preset.descriptions[descIdx],
      recommendedAction: preset.actions[actIdx]
    });
  }

  return forecast;
}

export function calculateWeatherDefenseRating(grid: Grid): {
  totalBuildings: number;
  shieldedBuildings: number;
  resilientBuildings: number;
  defensePercentage: number;
  ratingLabel: string;
} {
  let totalBuildings = 0;
  let shieldedBuildings = 0;
  let resilientBuildings = 0;

  // Identify all shield tiles first
  const shieldTiles: { x: number; y: number }[] = [];
  grid.flat().forEach(t => {
    if (t.buildingType === 'AtmosphericShield' || (t.buildingType as string) === 'shield') {
      shieldTiles.push({ x: t.x, y: t.y });
    }
  });

  grid.flat().forEach(t => {
    if (t.buildingType !== 'None' && (t.buildingType as string) !== 'none') {
      totalBuildings++;

      // Check if within 4 tiles of any shield
      const isShielded = shieldTiles.some(
        s => Math.abs(s.x - t.x) <= 4 && Math.abs(s.y - t.y) <= 4
      );

      if (isShielded) shieldedBuildings++;
      if ((t.resilienceLevel && t.resilienceLevel >= 1) || t.isResilient) {
        resilientBuildings++;
      }
    }
  });

  if (totalBuildings === 0) {
    return {
      totalBuildings: 0,
      shieldedBuildings: 0,
      resilientBuildings: 0,
      defensePercentage: 100,
      ratingLabel: 'Optimal'
    };
  }

  // Coverage ratio (shielded or resilient counts as protected)
  const protectedCount = grid.flat().filter(t => {
    if (t.buildingType === 'None' || (t.buildingType as string) === 'none') return false;
    const isShielded = shieldTiles.some(s => Math.abs(s.x - t.x) <= 4 && Math.abs(s.y - t.y) <= 4);
    const isResilient = (t.resilienceLevel && t.resilienceLevel >= 1) || t.isResilient;
    return isShielded || isResilient;
  }).length;

  const pct = Math.round((protectedCount / totalBuildings) * 100);

  let ratingLabel = 'Vulnerable';
  if (pct >= 85) ratingLabel = 'Impenetrable';
  else if (pct >= 60) ratingLabel = 'Fortified';
  else if (pct >= 35) ratingLabel = 'Moderate';

  return {
    totalBuildings,
    shieldedBuildings,
    resilientBuildings,
    defensePercentage: pct,
    ratingLabel
  };
}

export interface TileWeatherPenaltyInfo {
  x: number;
  y: number;
  basePenalty: number;
  mitigation: number;
  effectivePenalty: number;
  penaltyPct: number;
  isCoveredByShield: boolean;
  resilienceLevel: number;
  statusCategory: 'severe' | 'moderate' | 'protected' | 'shield';
  statusLabel: string;
  recommendedAction?: string;
}

export function calculateTileWeatherPenalty(
  tile: TileData,
  grid: Grid,
  weather: WeatherState,
  activeAlert: WeatherAlert | null
): TileWeatherPenaltyInfo {
  if (tile.buildingType === BuildingType.AtmosphericShield || (tile.buildingType as string) === 'shield') {
    return {
      x: tile.x,
      y: tile.y,
      basePenalty: 0,
      mitigation: 1,
      effectivePenalty: 0,
      penaltyPct: 0,
      isCoveredByShield: true,
      resilienceLevel: 3,
      statusCategory: 'shield',
      statusLabel: 'Forcefield Dome Generator (4-Tile Radius)'
    };
  }

  const shieldTiles: { x: number; y: number }[] = [];
  grid.flat().forEach(t => {
    if (t.buildingType === BuildingType.AtmosphericShield || (t.buildingType as string) === 'shield') {
      shieldTiles.push({ x: t.x, y: t.y });
    }
  });

  const isCoveredByShield = shieldTiles.some(
    s => Math.hypot(s.x - tile.x, s.y - tile.y) <= 4.0
  );

  const resLvl = tile.resilienceLevel || (tile.isResilient ? 3 : 0);

  if (isCoveredByShield || tile.buildingType === BuildingType.None || tile.buildingType === BuildingType.Road) {
    return {
      x: tile.x,
      y: tile.y,
      basePenalty: 0,
      mitigation: 1,
      effectivePenalty: 0,
      penaltyPct: 0,
      isCoveredByShield,
      resilienceLevel: resLvl,
      statusCategory: 'protected',
      statusLabel: isCoveredByShield ? 'Protected by Forcefield Shield Dome' : 'Immune'
    };
  }

  let basePenalty = 0.25;
  if (weather.isSnowing || activeAlert?.type === 'blizzard') basePenalty = 0.35;
  else if (weather.isRaining || activeAlert?.type === 'monsoon') basePenalty = 0.30;
  else if (weather.isFoggy || activeAlert?.type === 'fog') basePenalty = 0.15;

  let mitigation = 0;
  if (resLvl >= 3) mitigation = 1.0;
  else if (resLvl === 2) mitigation = 0.8;
  else if (resLvl === 1) mitigation = 0.5;

  const effectivePenalty = basePenalty * (1.0 - mitigation);
  const penaltyPct = Math.round(effectivePenalty * 100);

  let statusCategory: 'severe' | 'moderate' | 'protected' = 'protected';
  let statusLabel = 'Protected (Tier 3 Weatherproof)';
  let recommendedAction: string | undefined = undefined;

  if (penaltyPct >= 20) {
    statusCategory = 'severe';
    statusLabel = `SEVERE PENALTY (-${penaltyPct}% Output)`;
    recommendedAction = resLvl === 0 ? 'Upgrade Resilience or deploy Shield Dome' : 'Upgrade to Resilience Tier 3';
  } else if (penaltyPct > 0) {
    statusCategory = 'moderate';
    statusLabel = `Moderate Penalty (-${penaltyPct}% Output)`;
    recommendedAction = 'Upgrade to Resilience Tier 3';
  }

  return {
    x: tile.x,
    y: tile.y,
    basePenalty,
    mitigation,
    effectivePenalty,
    penaltyPct,
    isCoveredByShield,
    resilienceLevel: resLvl,
    statusCategory,
    statusLabel,
    recommendedAction
  };
}
