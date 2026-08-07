import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  X, 
  Volume2, 
  VolumeX, 
  Contrast, 
  ZoomIn, 
  Eye, 
  Pause, 
  Play, 
  FastForward, 
  Bot, 
  ShieldAlert, 
  Coins, 
  Save, 
  RotateCcw, 
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { WeatherState } from '../types';

interface SettingsLayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHighContrast: boolean;
  setIsHighContrast: (value: boolean) => void;
  isEnlargedUI: boolean;
  setIsEnlargedUI: (value: boolean) => void;
  isEconomicOverlayActive: boolean;
  onToggleEconomicOverlay?: () => void;
  isWeatherOverlayActive: boolean;
  onToggleWeatherOverlay?: () => void;
  isPaused: boolean;
  onTogglePause?: () => void;
  isAutoPlayActive?: boolean;
  onToggleAutoPlay?: () => void;
  weather: WeatherState;
  onToggleWeather?: (weather: Partial<WeatherState>) => void;
  onSaveSnapshot?: () => void;
  onRestartGame?: () => void;
}

export const SettingsLayerModal: React.FC<SettingsLayerModalProps> = ({
  isOpen,
  onClose,
  isHighContrast,
  setIsHighContrast,
  isEnlargedUI,
  setIsEnlargedUI,
  isEconomicOverlayActive,
  onToggleEconomicOverlay,
  isWeatherOverlayActive,
  onToggleWeatherOverlay,
  isPaused,
  onTogglePause,
  isAutoPlayActive = false,
  onToggleAutoPlay,
  weather,
  onToggleWeather,
  onSaveSnapshot,
  onRestartGame
}) => {
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [weatherParticlesEnabled, setWeatherParticlesEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative px-6 py-5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border-b border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-lg shadow-cyan-500/20">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">SETTINGS LAYER</h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold uppercase">
                    Preferences & Accessibility
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Audio, Graphics Quality, Simulation Speeds & System Data
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Close Settings Layer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Settings Grid */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Visuals & Accessibility */}
            <div>
              <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Visuals & Accessibility</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                      <Contrast className="w-4 h-4 text-amber-400" />
                      <span>High Contrast Mode</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      WCAG AAA high contrast ratio styling
                    </p>
                  </div>
                  <button
                    onClick={() => setIsHighContrast(!isHighContrast)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                      isHighContrast 
                        ? 'bg-amber-400 text-slate-950 border-amber-300' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isHighContrast ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span>UI Scale Ratio</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      120% Enlarged controls & typography
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEnlargedUI(!isEnlargedUI)}
                    className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                      isEnlargedUI 
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isEnlargedUI ? '120% SCALE' : '100% SCALE'}
                  </button>
                </div>

                {onToggleEconomicOverlay && (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                        <Coins className="w-4 h-4 text-emerald-400" />
                        <span>Economic Heatmap Overlay</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Color-code grid tiles by financial output
                      </p>
                    </div>
                    <button
                      onClick={onToggleEconomicOverlay}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        isEconomicOverlayActive 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isEconomicOverlayActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                )}

                {onToggleWeatherOverlay && (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Weather Vulnerability Heatmap</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Highlight weather incident output losses
                      </p>
                    </div>
                    <button
                      onClick={onToggleWeatherOverlay}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        isWeatherOverlayActive 
                          ? 'bg-rose-500 text-white border-rose-400' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isWeatherOverlayActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sky Background & Atmospheric Environment */}
            {onToggleWeather && (
              <div>
                <h3 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Sky Background & Time Cycle</span>
                </h3>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-2">Time of Day (Sky Colors Transition)</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['morning', 'noon', 'evening', 'night'] as const).map((cycle) => (
                        <button
                          key={cycle}
                          onClick={() => onToggleWeather({ cycle })}
                          className={`py-2 px-3 rounded-xl border font-mono text-xs font-bold capitalize transition-all cursor-pointer ${
                            weather.cycle === cycle
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {cycle}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-400">Weather Atmosphere:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleWeather({ isRaining: !weather.isRaining })}
                        className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          weather.isRaining
                            ? 'bg-blue-500/30 text-blue-300 border-blue-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        🌧️ Rain
                      </button>
                      <button
                        onClick={() => onToggleWeather({ isSnowing: !weather.isSnowing })}
                        className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          weather.isSnowing
                            ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        ❄️ Snow
                      </button>
                      <button
                        onClick={() => onToggleWeather({ isFoggy: !weather.isFoggy })}
                        className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                          weather.isFoggy
                            ? 'bg-slate-500/30 text-slate-200 border-slate-400'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        🌫️ Fog
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Simulation & Gameplay</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {onTogglePause && (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                        {isPaused ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                        <span>Simulation Clock</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pause or resume metropolis tick engine
                      </p>
                    </div>
                    <button
                      onClick={onTogglePause}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        isPaused 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                      }`}
                    >
                      {isPaused ? 'PAUSED' : 'RUNNING'}
                    </button>
                  </div>
                )}

                {onToggleAutoPlay && (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span>Autonomous AI Governor</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        AI automatically places optimal buildings
                      </p>
                    </div>
                    <button
                      onClick={onToggleAutoPlay}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        isAutoPlayActive 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {isAutoPlayActive ? 'AUTO-PLAY ON' : 'OFF'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Preferences */}
            <div>
              <h3 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <span>Audio Preferences</span>
              </h3>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
                    {sfxEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    <span>Sound Effects & Atmosphere</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Building placement, pulse synthesizers & weather ambient sounds
                  </p>
                </div>
                <button
                  onClick={() => setSfxEnabled(!sfxEnabled)}
                  className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                    sfxEnabled 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {sfxEnabled ? 'AUDIO ON' : 'MUTED'}
                </button>
              </div>
            </div>

            {/* Data & Snapshot Management */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono text-slate-400">DATA MANAGEMENT:</span>
                {onSaveSnapshot && (
                  <button
                    onClick={onSaveSnapshot}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save City Snapshot</span>
                  </button>
                )}
              </div>

              {onRestartGame && (
                <button
                  onClick={() => {
                    if (window.confirm('Reset all metropolis progress and clear local saved city state?')) {
                      onRestartGame();
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset City Data</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
