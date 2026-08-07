/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum BuildingType {
  None = 'None',
  Road = 'Road',
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
  Park = 'Park',
  Monument = 'Monument',
  AtmosphericShield = 'AtmosphericShield',
}

export interface BuildingConfig {
  type: BuildingType;
  cost: number;
  name: string;
  description: string;
  color: string; // Main color for 3D material
  popGen: number; // Population generation per tick
  incomeGen: number; // Money generation per tick
}

export interface TileData {
  x: number;
  y: number;
  buildingType: BuildingType;
  level?: number; // Building level (1, 2, 3...)
  variant?: number;
  resilienceLevel?: number; // 0 = Standard, 1 = Weather-Sealed, 2 = Storm-Fortified, 3 = Atmospheric-Mastered (100% Weather Immune)
  isResilient?: boolean; // True when resilienceLevel > 0
  durability?: number; // 0-100% building structural integrity
  efficiency?: number; // 0-100% operational efficiency
}

export type Grid = TileData[][];

export interface HintIndicator {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  type?: 'positive' | 'negative' | 'neutral';
}

export interface CityStats {
  money: number;
  population: number;
  day: number;
  happiness: number; // 0-100
  cityLevel: number;
  experience: number; // For progression
}

export interface WeatherState {
  isRaining: boolean;
  isFoggy: boolean;
  isSnowing: boolean;
  cycle: 'morning' | 'noon' | 'evening' | 'night';
}

export interface AIGoal {
  description: string;
  targetType: 'population' | 'money' | 'building_count';
  targetValue: number;
  buildingType?: BuildingType; // If target is building_count
  reward: number;
  completed: boolean;
}

export interface NewsItem {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

// --- Tri-Node Ecosystem Integration Types ---

export type ArcadeDistrict = 'DIST-PS' | 'DIST-RD' | 'DIST-OT';

export interface PhysicalPulse {
  id: string;
  timestamp: number;
  type: 'pedal_stomp' | 'kick_trajectory' | 'friction_tuner' | 'observer_mint';
  magnitude: number;
  telemetryData: string;
}

export interface HomeostasisState {
  stage: number; // 1-8
  stageName: string;
  masterPulseHz: number; // e.g. 40.0
  homeostasisIndex: number; // 0 - 100%
  districtCoherence: Record<ArcadeDistrict, number>;
  activeAmbientPayload: string; // v1.0-ambient-source
}

export interface EcosystemDirective {
  id: string;
  sourceDistrict: ArcadeDistrict;
  title: string;
  objective: string;
  rewardYieldMultiplier: number;
  treasuryReward: number;
  active: boolean;
  ambientSourceVersion: string;
}

export interface TriNodeState {
  reAlityConnected: boolean;
  arcadeCityAttuned: boolean;
  physicalPulsesCount: number;
  lastPulse: PhysicalPulse | null;
  homeostasis: HomeostasisState;
  activeDirectives: EcosystemDirective[];
  totalArcadeYield: number;
  ecosystemMultiplier: number;
}

// --- City Chronicle Legacy Types ---

export type ChronicleCategory = 'milestone' | 'goal' | 'disaster' | 'directive' | 'historical' | 'weather';

export interface ChronicleEntry {
  id: string;
  day: number;
  timestamp: number;
  title: string;
  description: string;
  category: ChronicleCategory;
  impact?: string;
  location?: { x: number; y: number };
}

// --- Aetherium Market Fluctuation Types ---

export interface AetheriumMarketPoint {
  day: number;
  price: number;
  eventTitle?: string;
  changePercent?: number;
}

export interface GlobalMarketEvent {
  id: string;
  name: string;
  description: string;
  type: 'boom' | 'crash' | 'demand_surge' | 'supply_shortage' | 'normal';
  multiplier: number;
  affectedSector: 'All' | 'Commercial' | 'Industrial' | 'Residential';
  durationDays: number;
  daysRemaining: number;
}

export interface AetheriumMarketState {
  currentPrice: number;
  previousPrice: number;
  priceHistory: AetheriumMarketPoint[];
  activeEvent: GlobalMarketEvent | null;
  overallMultiplier: number;
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  trend: 'up' | 'down' | 'stable';
}

// --- Material Refinement System Types ---

export type RefinementPurityTier = 'Standard' | 'Synthesized' | 'Hyper-Refined' | 'Quantum-Grade';

export interface RefinementHistoryPoint {
  day: number;
  production: number;      // Industrial Output
  demand: number;          // Commercial Input/Demand
  netBalance: number;      // Surplus/Deficit (Production - Demand)
  qolBonusPercent: number; // Quality of Life Bonus % (e.g., 20 = +20%)
}

export interface MaterialRefinementState {
  refinedAetheriumProduction: number; // Output by industrial buildings (units per tick)
  refinedAetheriumDemand: number;     // Consumed by level 2+ commercial buildings (units per tick)
  satisfactionRatio: number;          // 0 to 1+ (production / demand)
  qualityOfLifeMultiplier: number;    // e.g., 1.00 to 1.50 (100% to 150%)
  industrialBuildingCount: number;    // Count of active industrial buildings
  commercialHubCount: number;         // Count of level 2+ commercial hubs
  purityTier: RefinementPurityTier;   // Current refined purity grade
  surgeActive: boolean;               // True if player triggered a refinement surge
  surgeDaysRemaining: number;         // Surge countdown
  history: RefinementHistoryPoint[];  // Real-time input/output trend history
}



