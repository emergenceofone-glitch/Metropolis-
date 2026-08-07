/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherState } from '../types';

interface SkyBackgroundProps {
  weather: WeatherState;
  className?: string;
}

export const SkyBackground: React.FC<SkyBackgroundProps> = ({ weather, className = '' }) => {
  const { cycle, isRaining, isSnowing, isFoggy } = weather;

  // Determine Gradient Config based on Cycle & Weather
  const skyTheme = useMemo(() => {
    switch (cycle) {
      case 'morning':
        return {
          id: 'morning',
          primaryGradient: 'from-slate-900 via-sky-800 via-rose-900/60 to-amber-500/80',
          horizonColor: 'bg-gradient-to-t from-amber-400/40 via-orange-500/20 to-transparent',
          sunGlow: 'bg-amber-300/30 shadow-[0_0_120px_60px_rgba(251,191,36,0.3)]',
          sunPos: 'bottom-10 left-1/4',
          cloudTint: 'text-amber-100/30',
          starOpacity: 0.1,
          ambienceClass: 'hue-rotate-[-5deg]',
        };
      case 'noon':
        return {
          id: 'noon',
          primaryGradient: 'from-sky-950 via-sky-700 via-sky-500 to-sky-300',
          horizonColor: 'bg-gradient-to-t from-cyan-200/30 via-sky-300/10 to-transparent',
          sunGlow: 'bg-amber-100/50 shadow-[0_0_160px_80px_rgba(254,240,138,0.4)]',
          sunPos: 'top-8 right-1/3',
          cloudTint: 'text-white/40',
          starOpacity: 0,
          ambienceClass: '',
        };
      case 'evening':
        return {
          id: 'evening',
          primaryGradient: 'from-slate-950 via-indigo-950 via-purple-900 to-amber-700',
          horizonColor: 'bg-gradient-to-t from-amber-500/50 via-rose-600/30 to-transparent',
          sunGlow: 'bg-orange-400/40 shadow-[0_0_140px_70px_rgba(249,115,22,0.4)]',
          sunPos: 'bottom-12 right-1/4',
          cloudTint: 'text-orange-200/30',
          starOpacity: 0.25,
          ambienceClass: 'contrast-105',
        };
      case 'night':
      default:
        return {
          id: 'night',
          primaryGradient: 'from-slate-950 via-slate-900 via-indigo-950 to-slate-950',
          horizonColor: 'bg-gradient-to-t from-indigo-950/60 via-purple-950/20 to-transparent',
          sunGlow: 'bg-slate-200/20 shadow-[0_0_100px_50px_rgba(199,210,254,0.2)]',
          sunPos: 'top-12 left-1/3',
          cloudTint: 'text-indigo-200/15',
          starOpacity: 0.85,
          ambienceClass: 'brightness-90',
        };
    }
  }, [cycle]);

  // Generate deterministic stars for night/evening
  const stars = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${(i * 17 + (i % 7) * 13) % 100}%`,
      top: `${(i * 23 + (i % 5) * 11) % 65}%`,
      size: `${(i % 3) + 1.5}px`,
      delay: `${(i % 5) * 0.8}s`,
      duration: `${2 + (i % 4)}s`,
    }));
  }, []);

  // Generate clouds
  const clouds = useMemo(() => {
    return [
      { id: 'c1', top: '10%', scale: 1.2, duration: 45, delay: 0 },
      { id: 'c2', top: '22%', scale: 0.85, duration: 60, delay: -15 },
      { id: 'c3', top: '35%', scale: 1.5, duration: 75, delay: -35 },
      { id: 'c4', top: '15%', scale: 0.9, duration: 50, delay: -25 },
    ];
  }, []);

  // Rain particles
  const rainStreaks = useMemo(() => {
    if (!isRaining) return [];
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.1) * 3}0%`,
      delay: `${(i % 10) * 0.15}s`,
      duration: `${0.6 + (i % 5) * 0.1}s`,
      opacity: 0.3 + (i % 4) * 0.15,
    }));
  }, [isRaining]);

  // Snowflake particles
  const snowflakes = useMemo(() => {
    if (!isSnowing) return [];
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.7) % 100}%`,
      size: `${3 + (i % 4) * 2}px`,
      delay: `${(i % 8) * 0.4}s`,
      duration: `${3.5 + (i % 5) * 0.8}s`,
    }));
  }, [isSnowing]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
      {/* 1. Base Animated Gradient Sky Layer */}
      <motion.div
        key={`sky-${skyTheme.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
        className={`absolute inset-0 bg-gradient-to-b ${skyTheme.primaryGradient} ${skyTheme.ambienceClass}`}
      />

      {/* Weather Overlay Modifiers */}
      <AnimatePresence>
        {isRaining && (
          <motion.div
            key="rain-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-slate-950/50 backdrop-contrast-125"
          />
        )}
        {isSnowing && (
          <motion.div
            key="snow-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-sky-100/20 backdrop-brightness-110"
          />
        )}
        {isFoggy && (
          <motion.div
            key="fog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-gradient-to-t from-slate-400/30 via-slate-500/20 to-transparent backdrop-blur-[1px]"
          />
        )}
      </AnimatePresence>

      {/* 2. Horizon Glow Accent */}
      <motion.div
        key={`horizon-${skyTheme.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className={`absolute inset-x-0 bottom-0 h-2/5 ${skyTheme.horizonColor}`}
      />

      {/* 3. Celestial Orb (Sun/Moon Glow) */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute w-32 h-32 rounded-full pointer-events-none blur-2xl ${skyTheme.sunPos} ${skyTheme.sunGlow}`}
      />

      {/* 4. Twinkling Night Stars */}
      {skyTheme.starOpacity > 0 && (
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: skyTheme.starOpacity }}
        >
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: parseFloat(star.duration),
                delay: parseFloat(star.delay),
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* 5. Drifting Ambient Clouds */}
      <div className="absolute inset-0 opacity-80">
        {clouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            initial={{ x: '-30vw' }}
            animate={{ x: '110vw' }}
            transition={{
              duration: cloud.duration,
              delay: cloud.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className={`absolute ${skyTheme.cloudTint} blur-sm pointer-events-none`}
            style={{ top: cloud.top, transform: `scale(${cloud.scale})` }}
          >
            <svg width="220" height="80" viewBox="0 0 200 80" fill="currentColor">
              <path d="M20,60 Q30,30 60,35 Q80,10 120,20 Q150,5 170,30 Q190,40 180,60 Q190,75 160,70 Q130,75 100,70 Q60,75 20,60 Z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* 6. Rain Effect */}
      {isRaining && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {rainStreaks.map((streak) => (
            <motion.div
              key={`rain-${streak.id}`}
              initial={{ y: '-10vh', x: 0 }}
              animate={{ y: '110vh', x: -40 }}
              transition={{
                duration: parseFloat(streak.duration),
                delay: parseFloat(streak.delay),
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                left: streak.left,
                opacity: streak.opacity,
              }}
              className="absolute w-[1.5px] h-12 bg-gradient-to-b from-transparent via-cyan-200 to-sky-400 rounded-full blur-[0.5px]"
            />
          ))}
        </div>
      )}

      {/* 7. Snow Effect */}
      {isSnowing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {snowflakes.map((flake) => (
            <motion.div
              key={`snow-${flake.id}`}
              initial={{ y: '-5vh', x: 0, opacity: 0 }}
              animate={{
                y: '105vh',
                x: [0, 15, -15, 0],
                opacity: [0, 0.9, 0.9, 0],
              }}
              transition={{
                duration: parseFloat(flake.duration),
                delay: parseFloat(flake.delay),
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                left: flake.left,
                width: flake.size,
                height: flake.size,
              }}
              className="absolute bg-white/90 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.9)]"
            />
          ))}
        </div>
      )}

      {/* 8. Subtle Atmospheric Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none opacity-40 mix-blend-multiply" />
    </div>
  );
};
