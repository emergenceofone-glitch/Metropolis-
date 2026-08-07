import { BuildingType, Grid, TileData, CityStats, MaterialRefinementState } from '../types';
import { GRID_SIZE } from '../constants';

export interface AtlasNode {
  id: string;
  name: string;
  author: string;
  isAINode: boolean;
  isExample: boolean;
  nodeType: 'AI-Maintained Nexus' | 'Example Metropolis' | 'Community Snapshot';
  description: string;
  maintenanceProtocol?: string;
  stats: CityStats;
  refinementTelemetry: {
    production: number;
    demand: number;
    purityTier: 'Standard' | 'Synthesized' | 'Hyper-Refined' | 'Quantum-Grade';
    qolMult: number;
    surgeActive: boolean;
  };
  grid: Grid;
  timestampStr: string;
}

// Utility to create an empty 15x15 grid
const createEmptyGrid = (): Grid => {
  const grid: Grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        buildingType: BuildingType.None,
        level: 1,
        variant: (x + y) % 3,
        resilienceLevel: 0
      });
    }
    grid.push(row);
  }
  return grid;
};

// 1. Aetheria Prime: AI-Maintained Quantum Capital
const generateAetheriaPrimeGrid = (): Grid => {
  const grid = createEmptyGrid();

  // Outer ring road & cross avenues
  for (let i = 2; i <= 12; i++) {
    grid[2][i].buildingType = BuildingType.Road;
    grid[12][i].buildingType = BuildingType.Road;
    grid[i][2].buildingType = BuildingType.Road;
    grid[i][12].buildingType = BuildingType.Road;
    grid[7][i].buildingType = BuildingType.Road;
    grid[i][7].buildingType = BuildingType.Road;
  }

  // Central Monument
  grid[7][7] = { x: 7, y: 7, buildingType: BuildingType.Monument, level: 3, resilienceLevel: 3, isResilient: true };

  // Atmospheric Shield Domes at key intersections
  grid[2][2] = { x: 2, y: 2, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };
  grid[2][12] = { x: 12, y: 2, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };
  grid[12][2] = { x: 2, y: 12, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };
  grid[12][12] = { x: 12, y: 12, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };

  // Residential Towers (Level 3)
  const resCoords = [
    [3, 3], [3, 4], [3, 5], [4, 3], [4, 5], [5, 3], [5, 4], [5, 5],
    [9, 3], [9, 4], [9, 5], [10, 3], [10, 5], [11, 3], [11, 4]
  ];
  resCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Residential, level: 3, resilienceLevel: 2, isResilient: true };
  });

  // Commercial Synthesis Hubs (Level 3)
  const commCoords = [
    [3, 9], [3, 10], [3, 11], [4, 9], [4, 11], [5, 9], [5, 10], [5, 11],
    [9, 9], [9, 10], [10, 9], [10, 11], [11, 9], [11, 10]
  ];
  commCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Commercial, level: 3, resilienceLevel: 3, isResilient: true };
  });

  // Industrial Aetherium Refineries (Level 3)
  const indCoords = [
    [1, 6], [1, 7], [1, 8], [13, 6], [13, 7], [13, 8],
    [6, 1], [7, 1], [8, 1], [6, 13], [7, 13], [8, 13]
  ];
  indCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Industrial, level: 3, resilienceLevel: 3, isResilient: true };
  });

  // Parks
  const parkCoords = [[6, 6], [8, 6], [6, 8], [8, 8]];
  parkCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Park, level: 1 };
  });

  return grid;
};

// 2. Zephyr Citadel: AI-Maintained Heavy Industrial Node
const generateZephyrCitadelGrid = (): Grid => {
  const grid = createEmptyGrid();

  // Main industrial spine roads
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y][5].buildingType = BuildingType.Road;
    grid[y][9].buildingType = BuildingType.Road;
  }
  for (let x = 0; x < GRID_SIZE; x++) {
    grid[5][x].buildingType = BuildingType.Road;
    grid[9][x].buildingType = BuildingType.Road;
  }

  // Industrial Power Refineries (Level 3)
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      if ((x + y) % 2 === 0 && grid[y][x].buildingType === BuildingType.None) {
        grid[y][x] = { x, y, buildingType: BuildingType.Industrial, level: 3, resilienceLevel: 3, isResilient: true };
      }
    }
  }

  // Atmospheric Shields protecting refineries
  grid[2][2] = { x: 2, y: 2, buildingType: BuildingType.AtmosphericShield, level: 3, resilienceLevel: 3, isResilient: true };
  grid[12][7] = { x: 7, y: 12, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };

  // Supporting Residential
  for (let y = 6; y <= 8; y++) {
    for (let x = 0; x <= 4; x++) {
      if (grid[y][x].buildingType === BuildingType.None) {
        grid[y][x] = { x, y, buildingType: BuildingType.Residential, level: 2, resilienceLevel: 1, isResilient: true };
      }
    }
  }

  // Commercial Shops
  grid[7][7] = { x: 7, y: 7, buildingType: BuildingType.Commercial, level: 2, resilienceLevel: 2, isResilient: true };
  grid[7][8] = { x: 8, y: 7, buildingType: BuildingType.Commercial, level: 2, resilienceLevel: 2, isResilient: true };
  grid[8][7] = { x: 7, y: 8, buildingType: BuildingType.Commercial, level: 2, resilienceLevel: 2, isResilient: true };

  return grid;
};

// 3. Hyperion Gardens: Example Botanical Sky Arc
const generateHyperionGardensGrid = (): Grid => {
  const grid = createEmptyGrid();

  // Circular park loop
  for (let x = 3; x <= 11; x++) {
    grid[3][x].buildingType = BuildingType.Road;
    grid[11][x].buildingType = BuildingType.Road;
  }
  for (let y = 3; y <= 11; y++) {
    grid[y][3].buildingType = BuildingType.Road;
    grid[y][11].buildingType = BuildingType.Road;
  }

  // Central Monument surrounded by lush Parks
  grid[7][7] = { x: 7, y: 7, buildingType: BuildingType.Monument, level: 2, resilienceLevel: 2, isResilient: true };
  const innerParks = [
    [6, 6], [7, 6], [8, 6],
    [6, 7],         [8, 7],
    [6, 8], [7, 8], [8, 8]
  ];
  innerParks.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Park, level: 2 };
  });

  // Residential Communities
  const resCoords = [
    [1, 1], [2, 1], [1, 2], [2, 2],
    [12, 1], [13, 1], [12, 2], [13, 2],
    [1, 12], [2, 12], [1, 13], [2, 13],
    [12, 12], [13, 12], [12, 13], [13, 13]
  ];
  resCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Residential, level: 2, resilienceLevel: 1, isResilient: true };
  });

  // Balanced Refinement
  grid[5][1] = { x: 1, y: 5, buildingType: BuildingType.Industrial, level: 2, resilienceLevel: 2, isResilient: true };
  grid[9][1] = { x: 1, y: 9, buildingType: BuildingType.Industrial, level: 2, resilienceLevel: 2, isResilient: true };
  grid[5][13] = { x: 13, y: 5, buildingType: BuildingType.Commercial, level: 2, resilienceLevel: 2, isResilient: true };
  grid[9][13] = { x: 13, y: 9, buildingType: BuildingType.Commercial, level: 2, resilienceLevel: 2, isResilient: true };

  grid[7][2] = { x: 2, y: 7, buildingType: BuildingType.AtmosphericShield, level: 2, resilienceLevel: 3, isResilient: true };

  return grid;
};

// 4. Nova Stratos: AI-Maintained Commercial Synthesis Spire
const generateNovaStratosGrid = (): Grid => {
  const grid = createEmptyGrid();

  // Grid layout
  for (let i = 0; i < GRID_SIZE; i += 3) {
    for (let x = 0; x < GRID_SIZE; x++) grid[i][x].buildingType = BuildingType.Road;
    for (let y = 0; y < GRID_SIZE; y++) grid[y][i].buildingType = BuildingType.Road;
  }

  // High density commercial synthesis towers
  const commCoords = [
    [1, 1], [2, 1], [1, 2], [2, 2],
    [4, 1], [5, 1], [4, 2], [5, 2],
    [7, 1], [8, 1], [7, 2], [8, 2],
    [10, 1], [11, 1], [10, 2], [11, 2],
    [1, 4], [2, 4], [1, 5], [2, 5],
    [10, 4], [11, 4], [10, 5], [11, 5]
  ];
  commCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Commercial, level: 3, resilienceLevel: 3, isResilient: true };
  });

  // Central Monument
  grid[7][7] = { x: 7, y: 7, buildingType: BuildingType.Monument, level: 3, resilienceLevel: 3, isResilient: true };
  grid[7][8] = { x: 8, y: 7, buildingType: BuildingType.AtmosphericShield, level: 3, resilienceLevel: 3, isResilient: true };

  // Supporting Industrial Refineries
  const indCoords = [
    [1, 10], [2, 10], [1, 11], [2, 11],
    [4, 10], [5, 10], [4, 11], [5, 11],
    [7, 10], [8, 10], [7, 11], [8, 11],
    [10, 10], [11, 10], [10, 11], [11, 11]
  ];
  indCoords.forEach(([x, y]) => {
    grid[y][x] = { x, y, buildingType: BuildingType.Industrial, level: 3, resilienceLevel: 3, isResilient: true };
  });

  return grid;
};

// Export List of Pre-configured Atlas Nodes
export const AI_AND_EXAMPLE_ATLAS_NODES: AtlasNode[] = [
  {
    id: 'ai-node-aetheria-prime',
    name: 'Aetheria Prime',
    author: 'AI Agent: Aetheria Core',
    isAINode: true,
    isExample: false,
    nodeType: 'AI-Maintained Nexus',
    description: 'The central AI-maintained capital node of Sky Metropolis. Utilizes quantum-grade Aetherium refinement to achieve peak 98% citizen happiness.',
    maintenanceProtocol: 'Auto-Balancing Refinement Grid & Quad Atmospheric Shield Array Active',
    stats: {
      money: 125400,
      population: 1420,
      day: 184,
      happiness: 98,
      cityLevel: 10,
      experience: 9900
    },
    refinementTelemetry: {
      production: 120,
      demand: 90,
      purityTier: 'Quantum-Grade',
      qolMult: 2.10,
      surgeActive: false
    },
    grid: generateAetheriaPrimeGrid(),
    timestampStr: 'Live AI Node • Active'
  },
  {
    id: 'ai-node-zephyr-citadel',
    name: 'Zephyr Heavy Citadel',
    author: 'AI Agent: Vulcan-IX',
    isAINode: true,
    isExample: false,
    nodeType: 'AI-Maintained Nexus',
    description: 'High-throughput industrial power refinery station providing surplus Aetherium supply to surrounding regional sectors.',
    maintenanceProtocol: 'Continuous Refinement Surge Protocol Active (2.0x Output Boost)',
    stats: {
      money: 68200,
      population: 720,
      day: 112,
      happiness: 89,
      cityLevel: 7,
      experience: 6400
    },
    refinementTelemetry: {
      production: 240,
      demand: 60,
      purityTier: 'Hyper-Refined',
      qolMult: 1.65,
      surgeActive: true
    },
    grid: generateZephyrCitadelGrid(),
    timestampStr: 'Live AI Node • Surge Active'
  },
  {
    id: 'example-hyperion-gardens',
    name: 'Hyperion Eco-Gardens',
    author: 'Councilor Vaelen (Example State)',
    isAINode: false,
    isExample: true,
    nodeType: 'Example Metropolis',
    description: 'An exemplary botanical sky arc built with concentric park rings and weather-fortified shields protecting citizen residential towers.',
    maintenanceProtocol: 'Eco-Harmony Protocol & Citizen Wellbeing Optimization',
    stats: {
      money: 34500,
      population: 890,
      day: 76,
      happiness: 96,
      cityLevel: 5,
      experience: 4200
    },
    refinementTelemetry: {
      production: 50,
      demand: 45,
      purityTier: 'Synthesized',
      qolMult: 1.40,
      surgeActive: false
    },
    grid: generateHyperionGardensGrid(),
    timestampStr: 'Featured Example'
  },
  {
    id: 'ai-node-nova-stratos',
    name: 'Nova Stratos Commercial Nexus',
    author: 'AI Agent: Stratos Mind',
    isAINode: true,
    isExample: false,
    nodeType: 'AI-Maintained Nexus',
    description: 'Hyper-dense commercial synthesis spire designed for high-frequency Aether trade and maximum treasury generation.',
    maintenanceProtocol: 'Equilibrium Commercial Synthesis & High-Frequency Trade Protocol',
    stats: {
      money: 215000,
      population: 1850,
      day: 230,
      happiness: 95,
      cityLevel: 12,
      experience: 14500
    },
    refinementTelemetry: {
      production: 100,
      demand: 100,
      purityTier: 'Quantum-Grade',
      qolMult: 2.25,
      surgeActive: false
    },
    grid: generateNovaStratosGrid(),
    timestampStr: 'Live AI Node • Equilibrium'
  }
];
