import { Grid, BuildingType, TileData } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';

export interface OptimalPosition {
  x: number;
  y: number;
  score: number;
  explanation: string;
}

const isValid = (x: number, y: number) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

const getNeighbors = (grid: Grid, cx: number, cy: number, radius = 1): TileData[] => {
  const neighbors: TileData[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = cx + dx;
      const ny = cy + dy;
      if (isValid(nx, ny)) {
        neighbors.push(grid[ny][nx]);
      }
    }
  }
  return neighbors;
};

export const findOptimalPosition = (grid: Grid, tool: BuildingType): OptimalPosition | null => {
  if (tool === BuildingType.None) return null;

  let bestX = -1;
  let bestY = -1;
  let bestScore = -Infinity;
  let bestExplanation = '';

  const center = GRID_SIZE / 2;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = grid[y][x];
      
      if (tile.buildingType !== BuildingType.None) continue;

      let score = 0;
      let reasons: string[] = [];

      // Minor distance bias from center
      const distFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
      const centerFactor = (GRID_SIZE / 2 - distFromCenter) / (GRID_SIZE / 2);
      score += centerFactor * 2.0; 

      const immediateNeighbors = getNeighbors(grid, x, y, 1);
      const mediumNeighbors = getNeighbors(grid, x, y, 2);

      const hasRoadAdjacent = immediateNeighbors.some(n => n.buildingType === BuildingType.Road);
      const roadCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Road).length;
      const adjacentBuildings = immediateNeighbors.filter(n => n.buildingType !== BuildingType.None && n.buildingType !== BuildingType.Road);

      switch (tool) {
        case BuildingType.Road: {
          if (roadCount > 0) {
            score += 5;
            reasons.push("Extends transportation network");
          }
          if (adjacentBuildings.length > 0) {
            score += adjacentBuildings.length * 4;
            reasons.push(`Services ${adjacentBuildings.length} nearby structures`);
          }
          if (roadCount >= 3) {
            score -= 6;
          }
          break;
        }

        case BuildingType.Residential: {
          if (hasRoadAdjacent) {
            score += 15;
            reasons.push("Accessible road connection");
          } else {
            score -= 10;
          }

          const parkImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Park).length;
          const parkMediumCount = mediumNeighbors.filter(n => n.buildingType === BuildingType.Park).length;
          const monumentImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Monument).length;
          const industrialImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;
          const industrialMediumCount = mediumNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;
          const residentialImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;

          if (parkImmediateCount > 0) {
            score += parkImmediateCount * 12;
            reasons.push("Adjacent to clean recreational park");
          } else if (parkMediumCount > 0) {
            score += parkMediumCount * 5;
            reasons.push("Close park breeze");
          }

          if (monumentImmediateCount > 0) {
            score += monumentImmediateCount * 25;
            reasons.push("Next to inspiring monument");
          }

          if (industrialImmediateCount > 0) {
            score -= industrialImmediateCount * 20;
            reasons.push("Heavy industrial air pollution warning");
          } else if (industrialMediumCount > 0) {
            score -= industrialMediumCount * 8;
            reasons.push("Close to factory smoke zones");
          }

          if (residentialImmediateCount > 0) {
            score += Math.min(6, residentialImmediateCount * 2);
            reasons.push("Forms a supportive home neighborhood");
          }
          break;
        }

        case BuildingType.Commercial: {
          if (hasRoadAdjacent) {
            score += 15;
            reasons.push("High consumer footfall");
          } else {
            score -= 10;
          }

          const resImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const resMediumCount = mediumNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const commImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Commercial).length;
          const indImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;

          if (resImmediateCount > 0) {
            score += resImmediateCount * 10;
            reasons.push("High density customer access");
          } else if (resMediumCount > 0) {
            score += resMediumCount * 4;
            reasons.push("Broad local residential supply");
          }

          if (commImmediateCount > 0) {
            score += commImmediateCount * 3;
            reasons.push("Synergizes with existing shops");
          }

          if (indImmediateCount > 0) {
            score -= indImmediateCount * 5;
          }
          break;
        }

        case BuildingType.Industrial: {
          if (hasRoadAdjacent) {
            score += 15;
            reasons.push("Accessible shipping highway");
          } else {
            score -= 10;
          }

          const resImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const resMediumCount = mediumNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const indImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;
          const parkImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Park).length;

          if (resImmediateCount > 0) {
            score -= resImmediateCount * 20;
            reasons.push("Residential zoning conflict");
          } else if (resMediumCount > 0) {
            score -= resMediumCount * 8;
            reasons.push("Citizen residential proximity alerts");
          }

          if (indImmediateCount > 0) {
            score += indImmediateCount * 8;
            reasons.push("Integrated industrial zone block");
          }

          if (parkImmediateCount > 0) {
            score -= parkImmediateCount * 10;
          }
          break;
        }

        case BuildingType.Park: {
          const resImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const resMediumCount = mediumNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const indImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;
          const parkImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Park).length;

          if (resImmediateCount > 0) {
            score += resImmediateCount * 15;
            reasons.push("Services adjacent residential population");
          } else if (resMediumCount > 0) {
            score += resMediumCount * 6;
            reasons.push("Beautifies residential block");
          }

          if (indImmediateCount > 0) {
            score -= indImmediateCount * 12;
            reasons.push("Close to factory smog");
          }

          if (parkImmediateCount > 0) {
            score += parkImmediateCount * 5;
            reasons.push("Combines into a larger green park space");
          }
          break;
        }

        case BuildingType.Monument: {
          const resImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Residential).length;
          const commImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Commercial).length;
          const indImmediateCount = immediateNeighbors.filter(n => n.buildingType === BuildingType.Industrial).length;
          
          score += (10 - distFromCenter) * 2.5;
          reasons.push("Central civic capital plaza");

          if (resImmediateCount > 0) {
            score += resImmediateCount * 15;
            reasons.push("Core residential status boost");
          }

          if (commImmediateCount > 0) {
            score += commImmediateCount * 12;
            reasons.push("Elevates commercial land status");
          }

          if (indImmediateCount > 0) {
            score -= indImmediateCount * 15;
          }
          break;
        }

        case BuildingType.AtmosphericShield: {
          if (hasRoadAdjacent) {
            score += 15;
            reasons.push("Connected to urban grid power");
          } else {
            score -= 10;
          }

          const nearbyBuildings = mediumNeighbors.filter(n => n.buildingType !== BuildingType.None && n.buildingType !== BuildingType.Road);
          if (nearbyBuildings.length > 0) {
            score += nearbyBuildings.length * 12;
            reasons.push("Shields dense urban cluster from severe weather");
          } else {
            reasons.push("Optimal position for broad shield dome coverage");
          }
          break;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestY = y;
        bestExplanation = reasons.slice(0, 2).join(", ") || "Balanced, empty land plot";
      }
    }
  }

  if (bestX === -1) return null;

  return {
    x: bestX,
    y: bestY,
    score: bestScore,
    explanation: bestExplanation
  };
};
