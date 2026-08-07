import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sun, 
  CloudRain, 
  Snowflake, 
  Wind, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  Thermometer, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  Bot,
  ChevronRight,
  Info
} from 'lucide-react';
import { WeatherState, WeatherAlert, Grid, CityStats } from '../types';
import { 
  generate3DayForecast, 
  calculateWeatherDefenseRating, 
  ForecastCondition, 
  RiskLevel 
} from '../services/weatherForecastService';

interface WeatherForecastModalProps {
  currentDay: number;
  weather: WeatherState;
  weatherAlert: WeatherAlert | null;
  grid: Grid;
  stats: CityStats;
  onClose: () => void;
  onOpenAdvisorAI?: () => void;
  onOpenCensus?: () => void;
  onToggleWeather?: (weather: Partial<WeatherState>) => void;
}

const CONDITION_ICONS: Record<ForecastCondition, React.ReactNode> = {
  clear: <Sun className="w-6 h-6 text-amber-400" />,
  rain: <CloudRain className="w-6 h-6 text-blue-400" />,
  snow: <Snowflake className="w-6 h-6 text-cyan-300" />,
  fog: <Wind className="w-6 h-6 text-slate-300" />,
  storm: <Zap className="w-6 h-6 text-amber-300 animate-pulse" />
};

const CONDITION_BG: Record<ForecastCondition, string> = {
  clear: 'from-amber-950/40 to-slate-900/90 border-amber-500/30 text-amber-200',
  rain: 'from-blue-950/40 to-slate-900/90 border-blue-500/30 text-blue-200',
  snow: 'from-cyan-950/40 to-slate-900/90 border-cyan-500/30 text-cyan-200',
  fog: 'from-slate-900/80 to-slate-950/90 border-slate-500/30 text-slate-200',
  storm: 'from-amber-950/60 to-purple-950/60 border-amber-400/50 text-amber-100'
};

const RISK_BADGES: Record<RiskLevel, { label: string; colorClass: string }> = {
  minimal: { label: 'Minimal Risk', colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  low: { label: 'Low Risk', colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  moderate: { label: 'Moderate Threat', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  high: { label: 'High Threat', colorClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  severe: { label: 'CRISIS SEVERE', colorClass: 'bg-rose-500/25 text-rose-300 border-rose-500/50 font-bold animate-pulse' }
};

export const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({
  currentDay,
  weather,
  weatherAlert,
  grid,
  stats,
  onClose,
  onOpenAdvisorAI,
  onOpenCensus,
  onToggleWeather
}) => {
  const forecastDays = useMemo(() => {
    return generate3DayForecast(currentDay, weather, weatherAlert, grid);
  }, [currentDay, weather, weatherAlert, grid]);

  const defenseRating = useMemo(() => {
    return calculateWeatherDefenseRating(grid);
  }, [grid]);

  // Determine current active weather label
  const currentWeatherLabel = weather.isSnowing ? 'Blizzard Front'
    : weather.isRaining ? 'Heavy Rain / Monsoon'
    : weather.isFoggy ? 'Dense Maritime Fog'
    : 'Clear Skylines';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-slate-900/95 border border-sky-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 relative max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-slate-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-wide text-white">3-Day Weather Forecast</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  Telemetry Sensor Array
                </span>
              </div>
              <p className="text-xs text-slate-400">Predictive atmospheric simulation for Day {currentDay + 1} to Day {currentDay + 3}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Weather Forecast"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Current Day Status Banner */}
          <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                {weather.isSnowing ? <Snowflake className="w-6 h-6 text-cyan-300" /> :
                 weather.isRaining ? <CloudRain className="w-6 h-6 text-blue-400" /> :
                 weather.isFoggy ? <Wind className="w-6 h-6 text-slate-300" /> :
                 <Sun className="w-6 h-6 text-amber-400" />}
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400">Current Day {currentDay} Atmospheric Status</div>
                <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <span>{currentWeatherLabel}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono capitalize">
                    {weather.cycle}
                  </span>
                </div>
              </div>
            </div>

            {weatherAlert ? (
              <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-2.5 flex items-center gap-2 text-rose-200 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce shrink-0" />
                <div>
                  <div className="font-bold uppercase text-rose-300">{weatherAlert.title}</div>
                  <div className="text-[10px] text-rose-200/80">Active for next {weatherAlert.ticksRemaining} ticks</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No Immediate Crisis Alerts</span>
              </div>
            )}
          </div>

          {/* 3-Day Forecast Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-400" />
                Forward 3-Day Atmospheric Outlook
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Updated every game cycle</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {forecastDays.map((dayItem, idx) => {
                const badgeInfo = RISK_BADGES[dayItem.riskLevel];

                return (
                  <motion.div
                    key={dayItem.dayNumber}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-gradient-to-b ${CONDITION_BG[dayItem.condition]} rounded-2xl p-4 border flex flex-col justify-between gap-3 shadow-lg relative overflow-hidden`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-white">Day {dayItem.dayNumber}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          +{idx + 1} Day
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-200">
                        <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dayItem.temperature}</span>
                      </div>
                    </div>

                    {/* Condition Header */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 shrink-0">
                        {CONDITION_ICONS[dayItem.condition]}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold font-mono text-white truncate">{dayItem.title}</h4>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${badgeInfo.colorClass}`}>
                          {badgeInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-3">
                      {dayItem.description}
                    </p>

                    {/* Recommended Action Box */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 border border-white/10 text-[10px] text-sky-200 font-mono space-y-1">
                      <div className="flex items-center gap-1 text-sky-400 font-bold uppercase text-[9px] tracking-wider">
                        <Info className="w-3 h-3" />
                        <span>Preparedness Advice:</span>
                      </div>
                      <p className="leading-snug text-slate-300">{dayItem.recommendedAction}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* City Weather Defense Rating Bar */}
          <div className="bg-slate-950/90 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold font-mono text-white uppercase">City Atmospheric Defense Coverage</h4>
                  <p className="text-[11px] text-slate-400">Percentage of structures shielded or upgraded with resilience weatherproofing</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto font-mono">
                <span className="text-xs text-slate-400">Defense Rating:</span>
                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg border ${
                  defenseRating.defensePercentage >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  defenseRating.defensePercentage >= 40 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {defenseRating.ratingLabel} ({defenseRating.defensePercentage}%)
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-3 border border-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${defenseRating.defensePercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  defenseRating.defensePercentage >= 80 ? 'from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                  defenseRating.defensePercentage >= 40 ? 'from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]' :
                  'from-rose-500 to-red-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                }`}
              />
            </div>

            {/* Breakdown details */}
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-white/5">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 block text-[9px] uppercase">Total Structures</span>
                <strong className="text-white text-xs">{defenseRating.totalBuildings}</strong>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 block text-[9px] uppercase">Shield Forcefield Covered</span>
                <strong className="text-cyan-300 text-xs">{defenseRating.shieldedBuildings}</strong>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5 text-center">
                <span className="text-slate-400 block text-[9px] uppercase">Resilience Tier Upgraded</span>
                <strong className="text-emerald-300 text-xs">{defenseRating.resilientBuildings}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Atmospheric Shields protect buildings within a 4-tile radius.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenCensus && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCensus();
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-purple-400" />
                <span>Census</span>
              </button>
            )}

            {onOpenAdvisorAI && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdvisorAI();
                }}
                className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Emergency AI Officer</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
