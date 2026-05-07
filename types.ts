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