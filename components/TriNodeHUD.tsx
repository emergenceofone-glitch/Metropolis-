/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Radio, 
  ShieldCheck, 
  Sparkles, 
  Flame, 
  Compass, 
  ChevronRight, 
  RefreshCw, 
  Layers, 
  Globe, 
  Sliders, 
  X,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { TriNodeState, PhysicalPulse, EcosystemDirective } from '../types';

interface TriNodeHUDProps {
  triNodeState: TriNodeState;
  onTriggerPulse: (type: PhysicalPulse['type']) => void;
  onGenerateDirective: () => void;
  onCompleteDirective: (directiveId: string, treasuryReward: number) => void;
  isGeneratingDirective: boolean;
  onClose: () => void;
}

export const TriNodeHUD: React.FC<TriNodeHUDProps> = ({
  triNodeState,
  onTriggerPulse,
  onGenerateDirective,
  onCompleteDirective,
  isGeneratingDirective,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'telemetry' | 'homeostasis' | 'directives'>('architecture');

  const districtColors = {
    'DIST-PS': 'from-cyan-500 to-blue-600 text-cyan-300 border-cyan-500/30',
    'DIST-RD': 'from-amber-500 to-yellow-600 text-amber-300 border-amber-500/30',
    'DIST-OT': 'from-purple-500 to-indigo-600 text-purple-300 border-purple-500/30'
  };

  const districtNames = {
    'DIST-PS': 'Player Services District',
    'DIST-RD': 'Rewards District',
    'DIST-OT': 'Operations Tower'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-y-6 right-6 w-full max-w-2xl bg-slate-950/90 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] z-50 flex flex-col overflow-hidden font-sans text-slate-100 pointer-events-auto"
    >
      {/* Top Header */}
      <div className="p-5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-400/30 rounded-2xl text-cyan-400 shadow-lg shadow-cyan-500/20 animate-pulse">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-wide text-white font-mono uppercase">
                Tri-Node Multi-Tier Ecosystem
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono font-bold text-cyan-300">
                40Hz ATTUNED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Re-Ality Micro-Physics • Arcade City Organism • Sky Metropolis Sandbox
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Realtime Ecosystem Bar */}
      <div className="px-5 py-3 bg-slate-900/80 border-b border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">Re-Ality: ONLINE</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
            <span>40.0Hz Pulse Loop</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-amber-300 font-bold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Ecosystem Yield: {triNodeState.ecosystemMultiplier}x</span>
          <span className="text-slate-500">|</span>
          <Award className="w-3.5 h-3.5 text-purple-400" />
          <span>{triNodeState.totalArcadeYield} ARC</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-slate-900/40 p-2 gap-2 text-xs font-mono font-semibold">
        {[
          { id: 'architecture', label: 'Tri-Node Topology', icon: Layers },
          { id: 'telemetry', label: 'Re-Ality Telemetry', icon: Cpu },
          { id: 'homeostasis', label: '40Hz Homeostasis', icon: Activity },
          { id: 'directives', label: 'Gemini Directives', icon: Sparkles }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all border ${
                isActive 
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-200 shadow-md shadow-cyan-500/10' 
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Tab 1: Tri-Node Topology Diagram */}
        {activeTab === 'architecture' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Active Tri-Node Ecosystem Architecture
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                {/* Node 1: Re-Ality Engine */}
                <div className="bg-gradient-to-b from-blue-950/60 to-slate-900/80 p-3.5 rounded-xl border border-blue-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold text-blue-400 uppercase tracking-wider">Node 01</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Re-Ality Engine</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Micro-physics engine processing prolate ellipsoid trajectory, friction tuners, pedal stomp energy, & observer mint logs.
                  </p>
                  <div className="pt-2 border-t border-blue-500/20 text-[10px] font-mono text-blue-300 flex items-center justify-between">
                    <span>Pulses: {triNodeState.physicalPulsesCount}</span>
                    <span className="text-emerald-400">100% Sync</span>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="hidden md:flex absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 text-cyan-400 animate-pulse">
                  <ChevronRight className="w-5 h-5" />
                </div>

                {/* Node 2: Aetherium Arcade City */}
                <div className="bg-gradient-to-b from-purple-950/60 to-slate-900/80 p-3.5 rounded-xl border border-purple-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold text-purple-400 uppercase tracking-wider">Node 02</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Aetherium Arcade City</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Cybernetic urban organism running 40Hz Master Pulse loop, 8-Stage Homeostasis, and Gemini v1.0-ambient-source payloads.
                  </p>
                  <div className="pt-2 border-t border-purple-500/20 text-[10px] font-mono text-purple-300 flex items-center justify-between">
                    <span>Stage {triNodeState.homeostasis.stage}/8</span>
                    <span>{triNodeState.homeostasis.homeostasisIndex}% Coherence</span>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="hidden md:flex absolute right-1/3 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-purple-400 animate-pulse">
                  <ChevronRight className="w-5 h-5" />
                </div>

                {/* Node 3: Sky Metropolis */}
                <div className="bg-gradient-to-b from-amber-950/60 to-slate-900/80 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider">Node 03</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Sky Metropolis</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Macro generative economy sandbox with zoning, real-time optimal placement advisory, and yield feedback loops.
                  </p>
                  <div className="pt-2 border-t border-amber-500/20 text-[10px] font-mono text-amber-300 flex items-center justify-between">
                    <span>Yield: {triNodeState.ecosystemMultiplier}x</span>
                    <span className="text-amber-400 font-bold">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient Payload Feed */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  Broadcasting Payload Source
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                  v1.0-ambient-source
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-xs text-cyan-200/90 break-all leading-relaxed">
                {triNodeState.homeostasis.activeAmbientPayload}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Re-Ality Physics Telemetry */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Physical Energy & Micro-Physics Input Generator
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulate low-level pedal stomp telemetry, prolate ellipsoid vectors, and surface friction tuner pulses from the Re-Ality Observer Engine directly into Sky Metropolis.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => onTriggerPulse('pedal_stomp')}
                  className="p-3 bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50 border border-blue-400/40 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                    <span>Pedal Stomp Pulse</span>
                    <Zap className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Transmits cadence & torque vector force</p>
                </button>

                <button
                  onClick={() => onTriggerPulse('kick_trajectory')}
                  className="p-3 bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-600/50 hover:to-yellow-600/50 border border-amber-400/40 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                    <span>Kick Trajectory Vector</span>
                    <Compass className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Prolate ellipsoid spin & velocity</p>
                </button>

                <button
                  onClick={() => onTriggerPulse('friction_tuner')}
                  className="p-3 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-400/40 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span>Surface Friction Tuner</span>
                    <Sliders className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Adjust turf grip & friction coefficient</p>
                </button>

                <button
                  onClick={() => onTriggerPulse('observer_mint')}
                  className="p-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-400/40 rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                    <span>Observer Mint Log</span>
                    <Flame className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Mints physical telemetry state block</p>
                </button>
              </div>
            </div>

            {/* Last Received Telemetry Log */}
            {triNodeState.lastPulse && (
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Latest Telemetry Ingest ({triNodeState.lastPulse.type.toUpperCase()})
                  </span>
                  <span className="text-slate-500">{new Date(triNodeState.lastPulse.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="p-3 bg-black/50 rounded-xl border border-white/5 font-mono text-xs text-amber-300/90 leading-relaxed">
                  {triNodeState.lastPulse.telemetryData}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: 40Hz Homeostasis Loop */}
        {activeTab === 'homeostasis' && (
          <div className="space-y-4">
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Arcade City 8-Stage Homeostasis Loop
                  </h3>
                  <span className="text-xs text-cyan-300 font-mono">
                    Stage {triNodeState.homeostasis.stage}: {triNodeState.homeostasis.stageName}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <div className="text-lg font-extrabold text-cyan-400">{triNodeState.homeostasis.homeostasisIndex}%</div>
                  <span className="text-[10px] text-slate-400 uppercase">System Coherence</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
                <div 
                  className="bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 h-full transition-all duration-500"
                  style={{ width: `${triNodeState.homeostasis.homeostasisIndex}%` }}
                />
              </div>

              {/* District Meters */}
              <div className="space-y-3 pt-2">
                {(['DIST-PS', 'DIST-RD', 'DIST-OT'] as const).map(district => {
                  const val = triNodeState.homeostasis.districtCoherence[district];
                  return (
                    <div key={district} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{districtNames[district]} ({district})</span>
                        <span className="text-cyan-400 font-bold">{val}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300" 
                          style={{ width: `${val}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Gemini Arcade City Directives */}
        {activeTab === 'directives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Active Arcade City Directives & Quests
              </h3>

              <button
                onClick={onGenerateDirective}
                disabled={isGeneratingDirective}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDirective ? 'animate-spin' : ''}`} />
                <span>{isGeneratingDirective ? 'Broadcasting...' : 'Query Gemini Narrative'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {triNodeState.activeDirectives.map(directive => {
                return (
                  <div 
                    key={directive.id}
                    className="bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30 space-y-3 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/30 text-purple-300 font-mono text-[10px] font-bold">
                            {directive.sourceDistrict}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            {directive.ambientSourceVersion}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{directive.title}</h4>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-xs font-extrabold text-amber-400">+${directive.treasuryReward}</span>
                        <div className="text-[10px] text-cyan-300 font-bold">{directive.rewardYieldMultiplier}x Yield Boost</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                      {directive.objective}
                    </p>

                    <button
                      onClick={() => onCompleteDirective(directive.id, directive.treasuryReward)}
                      className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Fulfill Directive & Claim Treasury Grant (+${directive.treasuryReward})</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
