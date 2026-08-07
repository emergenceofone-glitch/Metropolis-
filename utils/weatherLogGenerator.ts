/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Grid, WeatherState, ChronicleEntry, BuildingType } from '../types';
import { GRID_SIZE } from '../constants';

export interface DistrictImpact {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  buildingCount: number;
  shieldedCount: number;
  primaryType: string;
  isFullyShielded: boolean;
  isPartiallyShielded: boolean;
  isUnshielded: boolean;
  impactDescription: string;
}

export function analyzeDistrictWeatherImpacts(grid: Grid, weather: WeatherState): DistrictImpact[] {
  // Define 4 main city districts across the 15x15 grid
  const districts = [
    { id: 'nw', name: 'Northwest District (Arcology Heights)', bounds: { minX: 0, maxX: 7, minY: 0, maxY: 7 } },
    { id: 'ne', name: 'Northeast District (Financial Promenade)', bounds: { minX: 8, maxX: GRID_SIZE - 1, minY: 0, maxY: 7 } },
    { id: 'sw', name: 'Southwest District (Industrial Belt)', bounds: { minX: 0, maxX: 7, minY: 8, maxY: GRID_SIZE - 1 } },
    { id: 'se', name: 'Southeast District (Metropolitan Center)', bounds: { minX: 8, maxX: GRID_SIZE - 1, minY: 8, maxY: GRID_SIZE - 1 } },
  ];

  // Find all shield positions
  const shieldPositions: { x: number; y: number }[] = [];
  grid.forEach(row => {
    row.forEach(tile => {
      if (tile.buildingType === BuildingType.AtmosphericShield) {
        shieldPositions.push({ x: tile.x, y: tile.y });
      }
    });
  });

  const isShielded = (x: number, y: number) => {
    return shieldPositions.some(sp => Math.hypot(sp.x - x, sp.y - y) <= 4.0);
  };

  const weatherType = weather.isSnowing
    ? 'blizzard'
    : weather.isRaining
    ? 'monsoon'
    : weather.isFoggy
    ? 'fog'
    : 'clear';

  return districts.map(d => {
    let buildingCount = 0;
    let shieldedCount = 0;
    let resilientCount = 0;
    const typeCounts: Record<string, number> = {};

    for (let y = d.bounds.minY; y <= d.bounds.maxY; y++) {
      for (let x = d.bounds.minX; x <= d.bounds.maxX; x++) {
        const tile = grid[y]?.[x];
        if (tile && tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
          buildingCount++;
          typeCounts[tile.buildingType] = (typeCounts[tile.buildingType] || 0) + 1;
          const isDomeShielded = isShielded(x, y);
          const isBuildingResilient = (tile.resilienceLevel && tile.resilienceLevel >= 3) || tile.isResilient;
          if (isDomeShielded || isBuildingResilient) {
            shieldedCount++;
          }
          if (isBuildingResilient) {
            resilientCount++;
          }
        }
      }
    }

    // Determine primary functional type in this district
    let primaryType = 'Developing';
    let maxC = 0;
    Object.entries(typeCounts).forEach(([bType, count]) => {
      if (count > maxC) {
        maxC = count;
        primaryType = bType;
      }
    });

    const isFullyShielded = buildingCount > 0 && shieldedCount === buildingCount;
    const isPartiallyShielded = buildingCount > 0 && shieldedCount > 0 && shieldedCount < buildingCount;
    const isUnshielded = buildingCount > 0 && shieldedCount === 0;

    let impactDescription = '';
    if (buildingCount === 0) {
      impactDescription = 'Uninhabited terrain sector.';
    } else if (weatherType === 'clear') {
      impactDescription = 'Optimal solar exposure & mild atmospheric conditions (+5% comfort).';
    } else if (isFullyShielded) {
      impactDescription = `Protected by Atmospheric Shield forcefield dome (0% weather penalty).`;
    } else if (isPartiallyShielded) {
      const pct = Math.round((shieldedCount / buildingCount) * 100);
      impactDescription = `${pct}% shield dome coverage. Minor localized drag on unshielded ${primaryType} nodes.`;
    } else {
      if (weatherType === 'blizzard') {
        impactDescription = `Unshielded sector experienced freezing temperatures (-12% grid output penalty).`;
      } else if (weatherType === 'monsoon') {
        impactDescription = `Unshielded sector experienced heavy downpour & drainage delay (-8% commerce penalty).`;
      } else if (weatherType === 'fog') {
        impactDescription = `Unshielded sector affected by low visibility (-5% transit speed).`;
      }
    }

    return {
      id: d.id,
      name: d.name,
      bounds: d.bounds,
      buildingCount,
      shieldedCount,
      primaryType,
      isFullyShielded,
      isPartiallyShielded,
      isUnshielded,
      impactDescription
    };
  });
}

export function generateDailyWeatherChronicle(
  grid: Grid,
  weather: WeatherState,
  day: number
): Omit<ChronicleEntry, 'id' | 'timestamp'> {
  const districtImpacts = analyzeDistrictWeatherImpacts(grid, weather);
  const activeDistricts = districtImpacts.filter(d => d.buildingCount > 0);

  const weatherLabel = weather.isSnowing
    ? 'Sub-Zero Blizzard'
    : weather.isRaining
    ? 'Monsoonal Torrent'
    : weather.isFoggy
    ? 'Dense Thermal Fog'
    : 'Temperate Sunshine';

  const shieldedDistrictCount = activeDistricts.filter(d => d.isFullyShielded || d.isPartiallyShielded).length;
  const totalActive = activeDistricts.length;

  let title = `Day ${day} Weather: ${weatherLabel}`;
  if (totalActive > 0 && (weather.isSnowing || weather.isRaining || weather.isFoggy)) {
    title += ` (${shieldedDistrictCount}/${totalActive} Districts Shielded)`;
  }

  let description = `Daily atmospheric status for Day ${day}: ${weatherLabel} across SkyMetropolis. `;

  if (activeDistricts.length === 0) {
    description += 'No populated districts currently established on the urban grid.';
  } else {
    const details = activeDistricts.map(d => `${d.name}: ${d.impactDescription}`).join(' ');
    description += details;
  }

  let impact = 'Normal Operations';
  if (weather.isSnowing) {
    impact = shieldedDistrictCount === totalActive && totalActive > 0 ? 'Shielded from Blizzard' : 'Grid Frost Penalty';
  } else if (weather.isRaining) {
    impact = shieldedDistrictCount === totalActive && totalActive > 0 ? 'Shielded from Monsoon' : 'Drainage Drag';
  } else if (weather.isFoggy) {
    impact = 'Low Visibility';
  } else {
    impact = '+5% Solar Yield';
  }

  return {
    day,
    title,
    description,
    category: 'weather',
    impact
  };
}
