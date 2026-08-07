/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { TileData, Grid, CityStats, BuildingType } from '../types';
import { BUILDINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Drone, 
  X, 
  Wrench, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RotateCw, 
  Activity, 
  Sliders, 
  Coins, 
  Crosshair, 
  Eye, 
  TrendingDown, 
  Sparkles,
  Bot,
  Radar
} from 'lucide-react';

interface DroneInspectionPanelProps {
  grid: Grid;
  stats: CityStats;
  isAutoRepairEnabled: boolean;
  onToggleAutoRepair: () => void;
  isDroneActive: boolean;
  onToggleDroneActive: () => void;
  onRepairBuilding: (x: number, y: number) => void;
  onRepairAll: () => void;
  onClose: () => void;
  dronePos: { x: number; y: number } | null;
  onFocusTile?: (x: number, y: number) => void;
  autoRepairLog?: Array<{ id: string; buildingName: string; x: number; y: number; cost: number; timestamp: string }>;
}

export const DroneInspectionPanel: React.FC<DroneInspectionPanelProps> = ({
  grid,
  stats,
  isAutoRepairEnabled,
  onToggleAutoRepair,
  isDroneActive,
  onToggleDroneActive,
  onRepairBuilding,
  onRepairAll,
  onClose,
  dronePos,
  onFocusTile,
  autoRepairLog = []
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'efficiency' | 'healthy'>('all');
  const [activeTab, setActiveTab] = useState<'fleet' | 'issues' | 'logs'>('issues');

  // Analyze city grid buildings durability and efficiency
  const buildingAnalysis = useMemo(() => {
    const list: Array<{
      tile: TileData;
      durability: number;
      efficiency: number;
      repairCost: number;
      status: 'critical' | 'warning' | 'healthy';
      buildingName: string;
    }> = [];

    let totalDurability = 0;
    let totalEfficiency = 0;
    let totalBuildings = 0;
    let totalRepairCost = 0;
    let criticalCount = 0;
    let warningCount = 0;

    grid.flat().forEach(tile => {
      if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
        totalBuildings++;
        const durability = tile.durability ?? 100;
        const efficiency = tile.efficiency ?? Math.min(100, Math.round(durability * 0.95 + (tile.level || 1) * 2));
        const config = BUILDINGS[tile.buildingType];
        
        // Calculate repair cost based on missing durability
        const missingDurability = 100 - durability;
        const baseCost = Math.round((config.cost * 0.15) * (missingDurability / 100) + 15);
        const repairCost = Math.max(10, baseCost);

        let status: 'critical' | 'warning' | 'healthy' = 'healthy';
        if (durability < 50 || efficiency < 50) {
          status = 'critical';
          criticalCount++;
        } else if (durability < 75 || efficiency < 75) {
          status = 'warning';
          warningCount++;
        }

        if (status !== 'healthy') {
          totalRepairCost += repairCost;
        }

        totalDurability += durability;
        totalEfficiency += efficiency;

        list.push({
          tile,
          durability,
          efficiency,
          repairCost,
          status,
          buildingName: config.name
        });
      }
    });

    const avgDurability = totalBuildings > 0 ? Math.round(totalDurability / totalBuildings) : 100;
    const avgEfficiency = totalBuildings > 0 ? Math.round(totalEfficiency / totalBuildings) : 100;

    return {
      list,
      totalBuildings,
      avgDurability,
      avgEfficiency,
      criticalCount,
      warningCount,
      totalRepairCost
    };
  }, [grid]);

  // Filtered issue list
  const filteredBuildings = useMemo(() => {
    return buildingAnalysis.list.filter(item => {
      if (selectedFilter === 'critical') return item.status === 'critical';
      if (selectedFilter === 'efficiency') return item.efficiency < 75;
      if (selectedFilter === 'healthy') return item.status === 'healthy';
      return true; // 'all'
    }).sort((a, b) => a.durability - b.durability);
  }, [buildingAnalysis.list, selectedFilter]);

  const canAffordRepairAll = stats.money >= buildingAnalysis.totalRepairCost;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-900/95 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/40 text-emerald-300 shadow-lg shadow-emerald-500/10">
              <Drone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-mono tracking-wide text-white uppercase">
                  Metropolitan Drone Inspection Sweep
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase border ${
                  isDroneActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isDroneActive ? 'SWEEP ACTIVE' : 'SWEEP PAUSED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous aerial LiDAR scanning for building structural durability & efficiency degradation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDroneActive}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isDroneActive 
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/50' 
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isDroneActive ? 'animate-spin' : ''}`} />
              {isDroneActive ? 'Pause Drone' : 'Start Sweep'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-white/10"
              aria-label="Close Drone Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-white/10">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" /> City Structural Health
            </div>
            <div className="text-xl font-black font-mono text-cyan-300">
              {buildingAnalysis.avgDurability}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  buildingAnalysis.avgDurability > 75 ? 'bg-emerald-400' : buildingAnalysis.avgDurability > 50 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                style={{ width: `${buildingAnalysis.avgDurability}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Operational Efficiency
            </div>
            <div className="text-xl font-black font-mono text-amber-300">
              {buildingAnalysis.avgEfficiency}%
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${buildingAnalysis.avgEfficiency}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Critical Warnings
            </div>
            <div className="text-xl font-black font-mono text-red-400">
              {buildingAnalysis.criticalCount + buildingAnalysis.warningCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {buildingAnalysis.criticalCount} Critical • {buildingAnalysis.warningCount} Minor
            </div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1"><Wrench className="w-3 h-3 text-emerald-400" /> Auto-Repair</span>
              <button
                onClick={onToggleAutoRepair}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAutoRepairEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                aria-label="Toggle Auto-Repair Protocol"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAutoRepairEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 text-xs font-mono font-semibold text-slate-200">
              {isAutoRepairEnabled ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE PROTOCOL
                </span>
              ) : (
                <span className="text-slate-400">DISABLED (MANUAL)</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 pt-3 bg-slate-900 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                activeTab === 'issues'
                  ? 'bg-slate-950 text-cyan-300 border-cyan-500/40 border-b-transparent shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
              }`}
            >
              Inspect Issues ({buildingAnalysis.list.filter(i => i.status !== 'healthy').length})
            </button>

            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                activeTab === 'fleet'
                  ? 'bg-slate-950 text-emerald-300 border-emerald-500/40 border-b-transparent shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
              }`}
            >
              Drone Sweep Radar
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-slate-950 text-purple-300 border-purple-500/40 border-b-transparent shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
              }`}
            >
              Repair Log ({autoRepairLog.length})
            </button>
          </div>

          {buildingAnalysis.totalRepairCost > 0 && (
            <button
              onClick={onRepairAll}
              disabled={!canAffordRepairAll}
              className={`mb-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 border shadow-md ${
                canAffordRepairAll
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Repair All (${buildingAnalysis.totalRepairCost})
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 space-y-4 min-h-[320px]">
          {activeTab === 'issues' && (
            <>
              {/* Filter controls */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400 mr-1">Filter:</span>
                  {(['all', 'critical', 'efficiency', 'healthy'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[11px] font-bold transition-all border cursor-pointer ${
                        selectedFilter === filter
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                          : 'bg-slate-900 text-slate-400 border-white/5 hover:text-slate-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Showing {filteredBuildings.length} of {buildingAnalysis.totalBuildings} buildings
                </div>
              </div>

              {filteredBuildings.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-white/5 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-lg font-bold font-mono text-white">All City Infrastructure In Prime Condition</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Drone scanning confirms no structural damage or efficiency bottlenecks detected across the city grid.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredBuildings.map((item, idx) => (
                    <div
                      key={`${item.tile.x}-${item.tile.y}-${idx}`}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        item.status === 'critical'
                          ? 'bg-red-950/20 border-red-500/40 hover:border-red-400/70'
                          : item.status === 'warning'
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400/70'
                          : 'bg-slate-900/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">{item.buildingName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                              X:{item.tile.x} Y:{item.tile.y}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase border ${
                            item.status === 'critical' ? 'bg-red-500/20 text-red-300 border-red-400/40' :
                            item.status === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
                            'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Progress bars */}
                        <div className="space-y-2 my-3">
                          <div>
                            <div className="flex justify-between text-[11px] font-mono mb-1">
                              <span className="text-slate-400">Durability</span>
                              <span className={item.durability < 60 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                                {item.durability}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  item.durability > 75 ? 'bg-emerald-400' : item.durability > 50 ? 'bg-amber-400' : 'bg-red-500'
                                }`}
                                style={{ width: `${item.durability}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-mono mb-1">
                              <span className="text-slate-400">Efficiency</span>
                              <span className={item.efficiency < 60 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                                {item.efficiency}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 transition-all duration-300"
                                style={{ width: `${item.efficiency}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-2">
                        {onFocusTile && (
                          <button
                            onClick={() => onFocusTile(item.tile.x, item.tile.y)}
                            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Crosshair className="w-3.5 h-3.5" /> Locate
                          </button>
                        )}

                        <button
                          onClick={() => onRepairBuilding(item.tile.x, item.tile.y)}
                          disabled={stats.money < item.repairCost || item.durability >= 100}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                            item.durability >= 100
                              ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-default'
                              : stats.money >= item.repairCost
                              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/40 cursor-pointer'
                              : 'bg-red-950/40 text-red-400 border-red-500/30 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Wrench className="w-3 h-3" />
                          {item.durability >= 100 ? '100% Repaired' : `Repair ($${item.repairCost})`}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-900/80 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-400/40 flex items-center justify-center text-emerald-400 relative">
                      <Radar className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
                      <div className="absolute inset-0 rounded-2xl border border-emerald-400/20 animate-ping" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400" /> Aerial Inspection Unit Alpha
                      </h3>
                      <p className="text-xs text-slate-400">
                        Autonomous LiDAR scanner sweeping sector grid coordinates at 1,200 RPM.
                      </p>
                      {dronePos && (
                        <div className="mt-2 text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 inline-block">
                          Current Focus Target: X:{dronePos.x} Y:{dronePos.y}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <button
                      onClick={onToggleAutoRepair}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isAutoRepairEnabled
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      Auto-Repair Protocol: {isAutoRepairEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Protocol Instructions Box */}
              <div className="p-4 bg-slate-900/50 rounded-xl border border-white/10 text-xs text-slate-300 space-y-2">
                <div className="font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> How Auto-Repair Operates
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                  <li>The inspection drone continuously patrols the sky above your city grid.</li>
                  <li>When a building's durability drops below 80%, the drone automatically deducts the necessary repair funds from your treasury and restores structural integrity back to 100%.</li>
                  <li>If treasury funds are low or insufficient, auto-repair pauses and highlights critical buildings with pulsing visual indicators so you can prioritize manual intervention!</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                Recent Automated & Manual Maintenance Actions
              </h3>

              {autoRepairLog.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-white/5 text-slate-500 font-mono text-xs">
                  No maintenance repair events recorded yet. Enable Auto-Repair or perform manual repairs to populate logs.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {autoRepairLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-900/80 rounded-xl border border-white/10 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                          <Wrench className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-white">{log.buildingName}</span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            (X:{log.x} Y:{log.y})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-emerald-400 font-bold">-${log.cost}</span>
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Treasury Balance: <span className="text-emerald-400 font-bold">${stats.money}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/10 cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </motion.div>
  );
};
