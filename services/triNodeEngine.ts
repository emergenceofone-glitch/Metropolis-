/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ArcadeDistrict, EcosystemDirective, HomeostasisState, PhysicalPulse, TriNodeState } from '../types';

// Default initial state for Tri-Node Integration
export const createInitialTriNodeState = (): TriNodeState => ({
  reAlityConnected: true,
  arcadeCityAttuned: true,
  physicalPulsesCount: 14,
  lastPulse: {
    id: 'pulse-init-01',
    timestamp: Date.now(),
    type: 'pedal_stomp',
    magnitude: 88.4,
    telemetryData: 'PROLATE_ELLIPSOID_FORCE: 94.2N | FRICTION_COEFF: 0.82 | STOMP_AZIMUTH: 12.4°'
  },
  homeostasis: {
    stage: 4,
    stageName: 'Resonance Cascade',
    masterPulseHz: 40.0,
    homeostasisIndex: 86.5,
    districtCoherence: {
      'DIST-PS': 92.4, // Player Services
      'DIST-RD': 88.9, // Rewards District
      'DIST-OT': 94.1  // Operations Tower
    },
    activeAmbientPayload: 'v1.0-ambient-source::METROPOLIS_DISTRICT_HARMONY_SYNC_ACTIVE'
  },
  activeDirectives: [
    {
      id: 'dir-01',
      sourceDistrict: 'DIST-PS',
      title: 'Attune Citizens to 40Hz Resonance',
      objective: 'Build Parks & Monuments adjacent to Residential zones to maintain district coherence above 85%.',
      rewardYieldMultiplier: 1.35,
      treasuryReward: 2500,
      active: true,
      ambientSourceVersion: 'v1.0-ambient-source'
    },
    {
      id: 'dir-02',
      sourceDistrict: 'DIST-RD',
      title: 'Telemetry Yield Pipeline',
      objective: 'Process pedal stomp telemetry pulses from Re-Ality to scale Rewards District player yield output.',
      rewardYieldMultiplier: 1.50,
      treasuryReward: 4000,
      active: true,
      ambientSourceVersion: 'v1.0-ambient-source'
    }
  ],
  totalArcadeYield: 12450,
  ecosystemMultiplier: 1.42
});

export const STAGE_NAMES = [
  'Initialization Attunement',
  'Dynamic Equilibrium',
  'Homeostatic Resonance',
  'Resonance Cascade',
  'Cybernetic Synthesis',
  'District Coherence',
  'Systemic Transcendence',
  'Ecosystem Equilibrium'
];

export const processPhysicalPulse = (
  state: TriNodeState,
  type: PhysicalPulse['type'],
  customMagnitude?: number
): { newState: TriNodeState; pulse: PhysicalPulse; message: string } => {
  const now = Date.now();
  let mag = customMagnitude ?? (60 + Math.random() * 38);
  let telemetry = '';

  switch (type) {
    case 'pedal_stomp':
      telemetry = `PEDAL_STOMP_FORCE: ${mag.toFixed(1)}N | CADENCE: ${(110 + Math.random() * 20).toFixed(0)}RPM | TORQUE_APEX: ${(mag * 1.4).toFixed(1)}Nm`;
      break;
    case 'kick_trajectory':
      telemetry = `PROLATE_ELLIPSOID_TRAJECTORY: ${(mag * 2.1).toFixed(1)}m/s | LAUNCH_ANGLE: ${(22 + Math.random() * 15).toFixed(1)}° | GYRO_SPIN: ${(450 + Math.random() * 200).toFixed(0)}deg/s`;
      break;
    case 'friction_tuner':
      telemetry = `SURFACE_FRICTION_MU: ${(0.65 + Math.random() * 0.3).toFixed(2)} | TURF_GRIP: ${mag.toFixed(1)}% | TREAD_WEAR: ${(Math.random() * 12).toFixed(1)}%`;
      break;
    case 'observer_mint':
      telemetry = `OBSERVER_MINT_LOG_HASH: 0x${Math.floor(Math.random() * 16777215).toString(16)} | TELEMETRY_BLOCK: #${Math.floor(8000 + Math.random() * 2000)}`;
      break;
  }

  const pulse: PhysicalPulse = {
    id: `pulse-${now.toString().slice(-6)}`,
    timestamp: now,
    type,
    magnitude: mag,
    telemetryData: telemetry
  };

  // Boost coherence across Arcade Districts
  const psBoost = (mag / 100) * 2.5;
  const rdBoost = (mag / 100) * 3.2;
  const otBoost = (mag / 100) * 2.0;

  const newPS = Math.min(100, state.homeostasis.districtCoherence['DIST-PS'] + psBoost);
  const newRD = Math.min(100, state.homeostasis.districtCoherence['DIST-RD'] + rdBoost);
  const newOT = Math.min(100, state.homeostasis.districtCoherence['DIST-OT'] + otBoost);

  const avgCoherence = (newPS + newRD + newOT) / 3;
  const newStage = Math.min(8, Math.max(1, Math.floor((avgCoherence / 100) * 8)));
  const newStageName = STAGE_NAMES[newStage - 1];

  const newMultiplier = Number((1.0 + (avgCoherence / 100) * 0.85 + (state.physicalPulsesCount + 1) * 0.01).toFixed(2));
  const yieldBonus = Math.floor(mag * 25);

  const newState: TriNodeState = {
    ...state,
    physicalPulsesCount: state.physicalPulsesCount + 1,
    lastPulse: pulse,
    totalArcadeYield: state.totalArcadeYield + yieldBonus,
    ecosystemMultiplier: newMultiplier,
    homeostasis: {
      ...state.homeostasis,
      stage: newStage,
      stageName: newStageName,
      homeostasisIndex: Number(avgCoherence.toFixed(1)),
      districtCoherence: {
        'DIST-PS': Number(newPS.toFixed(1)),
        'DIST-RD': Number(newRD.toFixed(1)),
        'DIST-OT': Number(newOT.toFixed(1))
      },
      activeAmbientPayload: `v1.0-ambient-source::PHYSICAL_PULSE_${type.toUpperCase()}_INGESTED_MINT_${pulse.id}`
    }
  };

  const message = `Re-Ality Engine transmitted ${type.replace('_', ' ').toUpperCase()} telemetry. Arcade Rewards Yield +${yieldBonus} ARC. Ecosystem Multiplier now ${newMultiplier}x!`;

  return { newState, pulse, message };
};
