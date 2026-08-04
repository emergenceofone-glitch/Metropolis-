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
  // Suggested by AI for visual variety later
  variant?: number;
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

export type ChronicleCategory = 'milestone' | 'goal' | 'disaster' | 'directive' | 'historical';

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

