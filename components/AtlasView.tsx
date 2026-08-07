import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, Environment, Text, Html } from '@react-three/drei';
import { getCitySnapshots, CitySnapshot } from '../services/firebaseService';
import { AI_AND_EXAMPLE_ATLAS_NODES, AtlasNode } from '../services/atlasPresetNodesService';
import { BuildingType, Grid, CityStats } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';
import { WeatherHeatmap } from './WeatherHeatmap';
import { 
  Map, 
  Thermometer, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Activity, 
  Users, 
  DollarSign, 
  Calendar, 
  Download, 
  X, 
  Filter, 
  Award, 
  BarChart3,
  Flame,
  ArrowRight
} from 'lucide-react';

const CELL_SIZE = 1;

interface MiniCityProps {
  node: AtlasNode;
  offsetX: number;
  offsetZ: number;
  isSelected: boolean;
  onSelect: (node: AtlasNode) => void;
}

const MiniCity: React.FC<MiniCityProps> = ({ node, offsetX, offsetZ, isSelected, onSelect }) => {
  const { grid, name, author, isAINode, isExample, stats, refinementTelemetry } = node;

  return (
    <group position={[offsetX, 0, offsetZ]} onClick={(e) => { e.stopPropagation(); onSelect(node); }}>
      {/* City Base Platform */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE * CELL_SIZE + 0.5, 0.3, GRID_SIZE * CELL_SIZE + 0.5]} />
        <meshStandardMaterial 
          color={isSelected ? "#1e293b" : "#0f172a"} 
          roughness={0.4}
        />
      </mesh>

      {/* Glowing Aura Ring for AI Nodes */}
      {isAINode && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[GRID_SIZE * CELL_SIZE * 0.6, GRID_SIZE * CELL_SIZE * 0.7, 32]} />
          <meshBasicMaterial 
            color="#06b6d4" 
            transparent 
            opacity={isSelected ? 0.8 : 0.4} 
          />
        </mesh>
      )}

      {/* Selection Highlight Ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[GRID_SIZE * CELL_SIZE * 0.72, GRID_SIZE * CELL_SIZE * 0.78, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} />
        </mesh>
      )}

      {/* Floating HTML Badge & Name Label */}
      <Html position={[0, 5.5, 0]} center pointerEvents="auto">
        <div 
          onClick={(e) => { e.stopPropagation(); onSelect(node); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all select-none ${
            isSelected ? 'scale-110 z-20' : 'hover:scale-105 opacity-90 hover:opacity-100'
          }`}
        >
          <div className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl border backdrop-blur-md ${
            isAINode
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-400/80 shadow-cyan-500/30'
              : isExample
              ? 'bg-amber-950/90 text-amber-300 border-amber-400/80 shadow-amber-500/30'
              : 'bg-slate-900/90 text-slate-200 border-slate-700'
          }`}>
            {isAINode ? <Bot className="w-3 h-3 text-cyan-400 animate-pulse" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
            <span>{name}</span>
            {isAINode && <span className="text-[8px] bg-cyan-500 text-slate-950 px-1 rounded font-black">AI</span>}
          </div>

          <div className="flex items-center gap-2 text-[9px] font-mono bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/10 text-slate-300 shadow">
            <span>Pop: {stats.population}</span>
            <span>•</span>
            <span className="text-emerald-400">${stats.money}</span>
          </div>
        </div>
      </Html>

      {/* Buildings */}
      {grid.map((row, y) => 
        row.map((tile, x) => {
          if (tile.buildingType === BuildingType.None) return null;
          
          const wx = (x - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
          const wz = (y - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
          
          if (tile.buildingType === BuildingType.Road) {
            return (
              <mesh key={`${x}-${y}`} position={[wx, 0.05, wz]} receiveShadow>
                <planeGeometry args={[CELL_SIZE * 0.9, CELL_SIZE * 0.9]} />
                <meshStandardMaterial color="#334155" rotation={[-Math.PI/2, 0, 0]} />
              </mesh>
            );
          }

          const level = tile.level || 1;
          const height = tile.buildingType === BuildingType.Residential ? 0.35 * level : 
                         tile.buildingType === BuildingType.Commercial ? 0.45 * level :
                         tile.buildingType === BuildingType.Industrial ? 0.25 * level :
                         tile.buildingType === BuildingType.Monument ? 1.8 : 
                         tile.buildingType === BuildingType.AtmosphericShield ? 0.8 : 0.12;

          const color = tile.buildingType === BuildingType.AtmosphericShield ? "#06b6d4" :
                        BUILDINGS[tile.buildingType]?.color || '#ffffff';

          return (
            <mesh key={`${x}-${y}`} position={[wx, height / 2, wz]} castShadow receiveShadow>
              <boxGeometry args={[CELL_SIZE * 0.8, height, CELL_SIZE * 0.8]} />
              <meshStandardMaterial 
                color={color} 
                metalness={0.2}
                roughness={0.5}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
};

interface AtlasViewProps {
  onClose: () => void;
  onLoadCityState?: (grid: Grid, stats: CityStats) => void;
  currentLocalStats?: CityStats;
}

export const AtlasView: React.FC<AtlasViewProps> = ({ 
  onClose, 
  onLoadCityState,
  currentLocalStats 
}) => {
  const [nodes, setNodes] = useState<AtlasNode[]>(AI_AND_EXAMPLE_ATLAS_NODES);
  const [snapshots, setSnapshots] = useState<CitySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'city' | 'weather'>('city');
  const [filter, setFilter] = useState<'all' | 'ai' | 'example' | 'community'>('all');
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(AI_AND_EXAMPLE_ATLAS_NODES[0]);

  useEffect(() => {
    getCitySnapshots().then(data => {
      setSnapshots(data);
      
      // Convert community snapshots into AtlasNodes
      const communityNodes: AtlasNode[] = data.map((snap, idx) => ({
        id: snap.id || `community-${idx}`,
        name: `Metropolis-${snap.id?.slice(0, 4) || 'Zero'}`,
        author: snap.author || "Anonymous Mayor",
        isAINode: false,
        isExample: false,
        nodeType: 'Community Snapshot',
        description: 'A historical city snapshot committed to the public ledger by a local mayor.',
        stats: snap.stats,
        refinementTelemetry: {
          production: Math.round(snap.stats.population * 0.5),
          demand: Math.round(snap.stats.population * 0.4),
          purityTier: 'Standard',
          qolMult: 1.15,
          surgeActive: false
        },
        grid: snap.grid,
        timestampStr: snap.timestamp ? new Date(snap.timestamp.seconds * 1000).toLocaleDateString() : 'Recorded'
      }));

      // Combine AI Nodes, Examples, and Community Snapshots
      const allCombined = [...AI_AND_EXAMPLE_ATLAS_NODES, ...communityNodes];
      setNodes(allCombined);
      setLoading(false);
    });
  }, []);

  const filteredNodes = nodes.filter(node => {
    if (filter === 'ai') return node.isAINode;
    if (filter === 'example') return node.isExample;
    if (filter === 'community') return !node.isAINode && !node.isExample;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans select-none">
      {/* Top Bar Header */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pointer-events-none bg-gradient-to-b from-slate-950/90 to-transparent pb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider font-mono">GLOBAL ATLAS VIEW</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AI Nodes Active
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Regional Public Ledger featuring AI-Maintained Nodes & Historical Metropolises
          </p>
          
          {/* Mode & Category Filter Controls */}
          <div className="mt-3 flex flex-wrap gap-2 pointer-events-auto">
            <button
              onClick={() => setViewMode('city')}
              className={`px-3 py-1.5 flex items-center gap-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                viewMode === 'city' 
                  ? 'bg-cyan-600/90 border-cyan-400 text-white shadow-lg shadow-cyan-500/30' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>City Topology</span>
            </button>

            <button
              onClick={() => setViewMode('weather')}
              className={`px-3 py-1.5 flex items-center gap-1.5 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                viewMode === 'weather' 
                  ? 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-500/30' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Regional Weather Heatmap</span>
            </button>

            {/* Filters */}
            <div className="h-6 w-px bg-white/10 my-auto mx-1" />

            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-950 font-bold' : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              All ({nodes.length})
            </button>

            <button
              onClick={() => setFilter('ai')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                filter === 'ai' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900/80 text-cyan-300 hover:bg-cyan-950'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span>AI Nodes ({nodes.filter(n => n.isAINode).length})</span>
            </button>

            <button
              onClick={() => setFilter('example')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                filter === 'example' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900/80 text-amber-300 hover:bg-amber-950'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Examples ({nodes.filter(n => n.isExample).length})</span>
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="pointer-events-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 shadow-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Return to Local Simulation</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main 3D Stage or Weather Heatmap */}
      <div className="flex-1 w-full h-full relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm font-mono space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-cyan-300 animate-pulse">Synchronizing Global Atlas & AI Nodes...</span>
          </div>
        ) : viewMode === 'weather' ? (
          <WeatherHeatmap snapshots={snapshots} />
        ) : (
          <Canvas shadows camera={{ position: [0, 50, 50], fov: 45 }}>
            <MapControls maxPolarAngle={Math.PI / 2.2} />
            <ambientLight intensity={0.6} />
            <directionalLight castShadow position={[25, 35, 25]} intensity={1.6} shadow-mapSize={[2048, 2048]} />
            <Environment preset="night" />
            <fog attach="fog" args={['#020617', 60, 160]} />
            
            {filteredNodes.map((node, index) => {
              const cols = Math.ceil(Math.sqrt(Math.max(filteredNodes.length, 1)));
              const col = index % cols;
              const row = Math.floor(index / cols);
              
              const spacing = GRID_SIZE * CELL_SIZE * 1.6;
              const offsetX = (col - (cols - 1) / 2) * spacing;
              const offsetZ = (row - (cols - 1) / 2) * spacing;

              return (
                <MiniCity 
                  key={node.id}
                  node={node}
                  offsetX={offsetX}
                  offsetZ={offsetZ}
                  isSelected={selectedNode?.id === node.id}
                  onSelect={(n) => setSelectedNode(n)}
                />
              );
            })}
          </Canvas>
        )}
      </div>

      {/* Selected Node Telemetry & Action Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-20 bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl text-slate-100 space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                  selectedNode.isAINode
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : selectedNode.isExample
                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedNode.nodeType}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{selectedNode.timestampStr}</span>
              </div>
              <h3 className="text-lg font-bold font-mono text-white mt-1 flex items-center gap-2">
                {selectedNode.isAINode && <Bot className="w-4 h-4 text-cyan-400" />}
                <span>{selectedNode.name}</span>
              </h3>
              <p className="text-xs text-slate-400">Maintained by: <strong className="text-slate-200">{selectedNode.author}</strong></p>
            </div>

            <button
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedNode.description}
          </p>

          {/* AI Maintenance Protocol Badge */}
          {selectedNode.maintenanceProtocol && (
            <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/30 rounded-xl flex items-start gap-2">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-[11px] font-mono">
                <span className="text-cyan-300 font-bold uppercase block">AI Directive Protocol:</span>
                <span className="text-slate-300">{selectedNode.maintenanceProtocol}</span>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Population</span>
                <span className="font-bold text-white">{selectedNode.stats.population} Citizens</span>
              </div>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Treasury</span>
                <span className="font-bold text-emerald-400">${selectedNode.stats.money}</span>
              </div>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Refined Aether</span>
                <span className="font-bold text-amber-300">+{selectedNode.refinementTelemetry.production}/tick</span>
              </div>
            </div>

            <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">QoL Multiplier</span>
                <span className="font-bold text-cyan-300">+{selectedNode.refinementTelemetry.qolMult}x</span>
              </div>
            </div>
          </div>

          {/* Action Button: Load as Simulation State */}
          {onLoadCityState && (
            <button
              onClick={() => {
                onLoadCityState(selectedNode.grid, selectedNode.stats);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Load Node as Local Simulation</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
