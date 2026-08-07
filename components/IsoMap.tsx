/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData, HintIndicator, WeatherState, WeatherAlert, MaterialRefinementState } from '../types';
import { calculateTileWeatherPenalty } from '../services/weatherForecastService';
import { GRID_SIZE, BUILDINGS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { SkyBackground } from './SkyBackground';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Constants & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

// Deterministic random based on coordinates
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

// --- 1. Advanced Procedural Buildings ---

const RoofAccessories = ({ hash, color, level }: { hash: number, color: THREE.Color, level: number }) => {
  const accessories = [];
  const variant = Math.floor(hash * 100);
  
  // HVAC Units
  if (variant % 3 === 0) {
    accessories.push(
      <mesh key="hvac" geometry={boxGeo} position={[0.1, 0.05, -0.1]} scale={[0.2, 0.1, 0.2]}>
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
    );
  }
  
  // Satellite Dish
  if (variant % 5 === 0) {
    accessories.push(
        <group key="sat" position={[-0.2, 0.05, 0.2]} rotation={[Math.PI/6, hash * Math.PI, 0]}>
            <mesh geometry={cylinderGeo} scale={[0.15, 0.02, 0.15]} rotation={[Math.PI/2, 0, 0]}>
                <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
            </mesh>
            <mesh geometry={cylinderGeo} scale={[0.02, 0.2, 0.02]} position={[0,0.1,0]}>
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
        </group>
    );
  }

  // Water Tower (for industrial or older residential)
  if (variant % 7 === 0 && level > 1) {
    accessories.push(
        <group key="water" position={[0.2, 0.1, -0.2]}>
            <mesh geometry={boxGeo} scale={[0.1, 0.2, 0.1]} position={[0, -0.1, 0]}>
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            <mesh geometry={cylinderGeo} scale={[0.2, 0.2, 0.2]}>
                <meshStandardMaterial color="#94a3b8" metalness={0.6} />
            </mesh>
        </group>
    );
  }

  // Antenna
  if (variant % 4 === 0) {
    accessories.push(
        <mesh key="ant" geometry={cylinderGeo} position={[0, 0.2, 0]} scale={[0.01, 0.5, 0.01]}>
            <meshStandardMaterial color="#334155" />
        </mesh>
    );
  }

  return <group>{accessories}</group>;
};

// FIX: Wrap component in React.memo to ensure TypeScript recognizes it as a component that accepts a 'key' prop.
const WindowBlock = React.memo(({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.2} roughness={0.1} metalness={0.8} />
  </mesh>
));

const SmokeStack = ({ position, isPaused = false }: { position: [number, number, number]; isPaused?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (isPaused) return;
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.01 + i * 0.005;
        cloud.scale.addScalar(0.005);
        
        const material = cloud.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity -= 0.005;
          if (cloud.position.y > 1.5) {
            cloud.position.y = 0;
            cloud.scale.setScalar(0.1 + Math.random() * 0.1);
            material.opacity = 0.6;
          }
        }
      });
    }
  });

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]}>
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <group ref={ref} position={[0, 1, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[Math.random()*0.1, i*0.4, Math.random()*0.1]} scale={0.2}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.6} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  level?: number;
  opacity?: number;
  transparent?: boolean;
  isNight?: boolean;
  isPaused?: boolean;
}

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, level = 1, opacity = 1, transparent = false, isNight = false, isPaused = false }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  // Animation state for level up
  const groupRef = useRef<THREE.Group>(null);
  const animationValues = useRef({ bounce: 1, glow: 0 });
  const prevLevel = useRef(level);

  useEffect(() => {
    if (level > prevLevel.current) {
      animationValues.current.bounce = 1.4;
      animationValues.current.glow = 2.0; // Strong glow pulse
    }
    prevLevel.current = level;
  }, [level]);

  useFrame((state, delta) => {
    // Decay animations
    if (animationValues.current.bounce > 1) {
      animationValues.current.bounce = MathUtils.lerp(animationValues.current.bounce, 1, delta * 5);
    }
    if (animationValues.current.glow > 0) {
      animationValues.current.glow = MathUtils.lerp(animationValues.current.glow, 0, delta * 3);
    }
    
    if (groupRef.current) {
      const targetScaleY = 1 + (level - 1) * 0.4;
      const targetScaleXZ = 1 + (level - 1) * 0.1;
      
      const b = animationValues.current.bounce;
      groupRef.current.scale.set(
        targetScaleXZ * b, 
        targetScaleY * b, 
        targetScaleXZ * b
      );

      // Apply glow to materials
      const glow = animationValues.current.glow;
      groupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            // Level up glow or night window glow
            if (mat.color.getHex() === 0xbfdbfe) { // Window color
                mat.emissiveIntensity = isNight ? 1.5 : glow;
            } else {
                mat.emissiveIntensity = glow;
            }
          }
        }
      });
    }
  });
  
  // Color variation
  const color = useMemo(() => {
    const c = new THREE.Color(baseColor);
    // Shift hue and lightness slightly based on hash
    c.offsetHSL(hash * 0.1 - 0.05, 0, hash * 0.2 - 0.1);
    return c;
  }, [baseColor, hash]);

  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    emissive: color,
    emissiveIntensity: 0,
    flatShading: true, 
    opacity, 
    transparent, 
    roughness: 0.8 
  }), [color, opacity, transparent]);

  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color).multiplyScalar(0.7), 
    emissive: new THREE.Color(color).multiplyScalar(0.7),
    emissiveIntensity: 0,
    flatShading: true, 
    opacity, 
    transparent 
  }), [color, opacity, transparent]);

  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: new THREE.Color(color).multiplyScalar(0.5).offsetHSL(0,0,-0.1), 
    emissive: new THREE.Color(color).multiplyScalar(0.5).offsetHSL(0,0,-0.1),
    emissiveIntensity: 0,
    flatShading: true, 
    opacity, 
    transparent 
  }), [color, opacity, transparent]);

  const commonProps = { castShadow: true, receiveShadow: true };

  // Buildings are built assuming y=0 is ground level within their group
  // Adjust vertical position to sit on top of ground tile (approx -0.3)
  const yOffset = -0.3;

  return (
    <group ref={groupRef} rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (variant < 10) {
              // Cozy Cottage
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.7, 0.6, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.75, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]} />
                  <WindowBlock position={[0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <WindowBlock position={[-0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.32]} scale={[0.15, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 20) {
              // Modern Boxy
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.1, 0.35, 0]} scale={[0.6, 0.7, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.25, 0.25, 0.1]} scale={[0.4, 0.5, 0.6]} />
                  <WindowBlock position={[-0.1, 0.5, 0.41]} scale={[0.4, 0.2, 0.05]} />
                  <group position={[-0.1, 0.7, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
              );
            } else if (variant < 30) {
              // Townhouse
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.5, 1, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.05, 0]} scale={[0.55, 0.1, 0.65]} />
                  <WindowBlock position={[0, 0.7, 0.31]} scale={[0.3, 0.2, 0.05]} />
                  <WindowBlock position={[0, 0.3, 0.31]} scale={[0.3, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 45) {
              // Apartment Block
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.75, 0]} scale={[0.8, 1.5, 0.7]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.05, 0]} scale={[0.85, 0.1, 0.75]} />
                  {[0.3, 0.6, 0.9, 1.2].map(h => (
                    <group key={h} position={[0, h, 0]}>
                      <WindowBlock position={[-0.2, 0, 0.36]} scale={[0.2, 0.15, 0.05]} />
                      <WindowBlock position={[0.2, 0, 0.36]} scale={[0.2, 0.15, 0.05]} />
                      <WindowBlock position={[-0.2, 0, -0.36]} scale={[0.2, 0.15, 0.05]} />
                      <WindowBlock position={[0.2, 0, -0.36]} scale={[0.2, 0.15, 0.05]} />
                    </group>
                  ))}
                  <group position={[0, 1.5, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
              );
            } else if (variant < 60) {
              // Suburban Duplex
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.22, 0.3, 0]} scale={[0.4, 0.6, 0.7]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.22, 0.3, 0]} scale={[0.4, 0.6, 0.7]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.22, 0.65, 0]} scale={[0.45, 0.1, 0.75]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.22, 0.65, 0]} scale={[0.45, 0.1, 0.75]} />
                  <WindowBlock position={[-0.22, 0.35, 0.36]} scale={[0.2, 0.2, 0.05]} />
                  <WindowBlock position={[0.22, 0.35, 0.36]} scale={[0.2, 0.2, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.25, 0]} scale={[0.05, 0.5, 0.7]} />
                </>
              );
            } else if (variant < 75) {
              // Luxury Villa
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.9, 0.4, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.45, -0.2]} scale={[0.7, 0.3, 0.5]} />
                  <mesh geometry={boxGeo} position={[0, 0.05, 0.3]} scale={[0.6, 0.02, 0.3]}>
                    <meshStandardMaterial color="#60a5fa" roughness={0} metalness={0.8} />
                  </mesh>
                  <WindowBlock position={[0, 0.2, 0.46]} scale={[0.4, 0.15, 0.02]} />
                </>
              );
            } else if (variant < 85) {
              // Art Deco Condo
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0.6, 0]} scale={[0.6, 1.2, 0.6]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.25, 0]} scale={[0.4, 0.3, 0.4]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.45, 0]} scale={[0.2, 0.2, 0.2]} />
                  {[0.3, 0.6, 0.9].map(h => (
                    <WindowBlock key={h} position={[0, h, 0.3]} scale={[0.3, 0.1, 0.05]} />
                  ))}
                </>
              );
            } else if (variant < 93) {
              // Classic Brick Apartment
              const brickMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.9 });
              return (
                <>
                  <mesh {...commonProps} material={brickMat} geometry={boxGeo} position={[0, 0.75, 0]} scale={[0.75, 1.5, 0.75]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.5, 0]} scale={[0.8, 0.1, 0.8]} />
                  <SmokeStack position={[0.2, 1.5, 0.2]} isPaused={isPaused} />
                  {[0.2, 0.5, 0.8, 1.1].map(h => (
                    <group key={h} position={[0, h, 0]}>
                      <WindowBlock position={[0, 0, 0.38]} scale={[0.4, 0.15, 0.02]} />
                    </group>
                  ))}
                </>
              );
            } else {
              // Micro-Apartment Tower
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1, 0]} scale={[0.5, 2, 0.5]} />
                  {Array.from({length: 8}).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.22, 0.26]} scale={[0.3, 0.1, 0.02]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 2.05, 0]} scale={[0.55, 0.1, 0.55]} />
                  <group position={[0, 2.1, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
              );
            }

          case BuildingType.Commercial:
            if (variant < 15) {
              // High-rise
              const height = 1.5 + hash * 1.5;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.7, height, 0.7]} />
                  {Array.from({ length: Math.floor(height * 4) }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.25, 0]} scale={[0.72, 0.12, 0.72]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, height + 0.05, 0]} scale={[0.5, 0.1, 0.5]} />
                  <group position={[0, height + 0.1, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
              );
            } else if (variant < 30) {
              // Shop
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <WindowBlock position={[0, 0.3, 0.41]} scale={[0.8, 0.4, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: hash > 0.5 ? '#ef4444' : '#3b82f6' })} geometry={boxGeo} position={[0, 0.55, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />
                </>
              );
            } else if (variant < 45) {
              // Corner store
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.5, -0.2]} scale={[0.5, 1, 0.5]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.1, 0.3, 0.1]} scale={[0.7, 0.6, 0.7]} />
                  <WindowBlock position={[0.1, 0.3, 0.46]} scale={[0.6, 0.3, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#9ca3af'})} geometry={boxGeo} position={[0.2, 0.65, 0.2]} scale={[0.2, 0.1, 0.2]} />
                </>
               )
            } else if (variant < 60) {
              // Modern Glass Office
              return (
               <>
                 <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.1 })} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.7, 1.2, 0.7]} />
                 <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.05, 0]} scale={[0.8, 0.1, 0.8]} />
                 <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.25, 0]} scale={[0.4, 0.1, 0.4]} />
                 <WindowBlock position={[0, 0.6, 0]} scale={[0.72, 1, 0.72]} />
               </>
              )
            } else if (variant < 75) {
               // Circular Office Plaza
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0, 0.5, 0]} scale={[0.8, 1, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.05, 0]} scale={[0.9, 0.1, 0.9]} />
                  <WindowBlock position={[0, 0.5, 0.4]} scale={[0.2, 0.8, 0.02]} />
                  <WindowBlock position={[0, 0.5, -0.4]} scale={[0.2, 0.8, 0.02]} />
                  <group position={[0, 1, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
               )
            } else if (variant < 88) {
               // Luxury Hotel
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.6, -0.1]} scale={[0.9, 1.2, 0.5]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.3, 0.6, 0.2]} scale={[0.3, 1.2, 0.5]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.3, 0.6, 0.2]} scale={[0.3, 1.2, 0.5]} />
                  {[0.3, 0.6, 0.9].map(h => (
                    <WindowBlock key={h} position={[0, h, 0.16]} scale={[0.7, 0.1, 0.02]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 1.25, 0]} scale={[0.95, 0.05, 0.8]} />
                </>
               )
            } else {
               // Tech Campus
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.3, -0.2]} scale={[0.5, 0.6, 0.5]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.2, 0.3, 0.2]} scale={[0.5, 0.6, 0.5]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.15, 0]} scale={[0.4, 0.3, 0.4]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1})} geometry={boxGeo} position={[0, 0.6, 0]} scale={[1, 0.05, 1]} />
                </>
               )
            }

          case BuildingType.Industrial:
            if (variant < 10) {
              // Factory
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.2, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.2, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <SmokeStack position={[0.3, 0.4, 0.3]} isPaused={isPaused} />
                  <group position={[0, 0.8, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
              );
            } else if (variant < 25) {
              // Warehouse
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.3, 0]} scale={[0.5, 0.6, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4, -0.2]} scale={[0.2, 0.8, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4, 0.25]} scale={[0.2, 0.8, 0.2]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#6b7280'})} geometry={boxGeo} position={[0.25, 0.7, 0]} scale={[0.05, 0.05, 0.5]} />
                </>
              );
            } else if (variant < 40) {
              // Oil Refinery Tanks
              return (
                <>
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.25, 0.3, -0.25]} scale={[0.3, 0.6, 0.3]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.3, 0.25]} scale={[0.3, 0.6, 0.3]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#4b5563'})} geometry={cylinderGeo} position={[0, 0.5, 0]} scale={[0.1, 1, 0.1]} />
                  <SmokeStack position={[0, 0.5, 0]} isPaused={isPaused} />
                </>
              )
            } else if (variant < 55) {
               // Power Station
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.8, 0.4, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.6, 0.2]} scale={[0.2, 0.4, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.3, 0.6, -0.2]} scale={[0.2, 0.4, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[-0.3, 0.6, -0.2]} scale={[0.2, 0.4, 0.2]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#fbbf24', emissive: '#f59e0b', emissiveIntensity: 0.5})} geometry={sphereGeo} position={[0, 0.9, 0.2]} scale={0.1} />
                </>
               )
            } else if (variant < 70) {
               // Chemical Plant
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.6]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.3, 0.5, 0]} scale={[0.2, 1, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[-0.3, 0.4, 0]} scale={[0.15, 0.8, 0.15]} />
                  <mesh geometry={new THREE.TorusGeometry(0.2, 0.05, 8, 16)} position={[0, 0.4, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <meshStandardMaterial color="#4b5563" />
                  </mesh>
                </>
               )
            } else if (variant < 85) {
               // Data Center
               return (
                <>
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#1e293b'})} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.9]} />
                  <mesh material={new THREE.MeshStandardMaterial({color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1})} geometry={boxGeo} position={[0, 0.4, 0.46]} scale={[0.7, 0.6, 0.02]} />
                  <group position={[0, 0.8, 0]}><RoofAccessories hash={hash} color={color} level={level} /></group>
                </>
               )
            } else {
               // Construction Area
               return (
                <>
                  <mesh material={mainMat} geometry={boxGeo} position={[-0.2, 0.1, -0.2]} scale={[0.4, 0.2, 0.4]} />
                  {/* Crane */}
                  <mesh material={new THREE.MeshStandardMaterial({color: '#f59e0b'})} geometry={cylinderGeo} position={[0.3, 0.8, 0.3]} scale={[0.05, 1.6, 0.05]} />
                  <mesh material={new THREE.MeshStandardMaterial({color: '#f59e0b'})} geometry={boxGeo} position={[0.1, 1.6, 0.3]} scale={[0.8, 0.05, 0.1]} />
                </>
               )
            }

          case BuildingType.Park:
            const treeCount = 1 + Math.floor(hash * 3);
            const positions = [[-0.2, -0.2], [0.2, 0.2], [-0.2, 0.2], [0.2, -0.2]];
            
            return (
              <group position={[0, -yOffset - 0.29, 0]}> {/* Adjust park base to sit exactly on top of ground tile */}
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshStandardMaterial color="#86efac" />
                </mesh>
                
                {variant < 30 && (
                    <group position={[0,0.05,0]}>
                        <mesh material={new THREE.MeshStandardMaterial({color: '#cbd5e1'})} geometry={cylinderGeo} scale={[0.4, 0.1, 0.4]} castShadow receiveShadow />
                        <mesh material={new THREE.MeshStandardMaterial({color: '#3b82f6', roughness: 0.1})} geometry={cylinderGeo} position={[0, 0.06, 0]} scale={[0.3, 0.05, 0.3]} />
                    </group>
                )}

                {variant >= 30 && variant < 50 && (
                    <group position={[0,0.05,0]}>
                        <mesh material={new THREE.MeshStandardMaterial({color: '#fde68a'})} geometry={boxGeo} scale={[0.5, 0.05, 0.5]} castShadow receiveShadow />
                        <mesh material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={boxGeo} position={[0.2, 0.1, 0.2]} scale={[0.1, 0.2, 0.1]} />
                        <mesh material={new THREE.MeshStandardMaterial({color: '#3b82f6'})} geometry={boxGeo} position={[-0.2, 0.2, -0.2]} scale={[0.1, 0.4, 0.1]} />
                    </group>
                )}

                {Array.from({length: treeCount}).map((_, i) => {
                    const pos = positions[i % positions.length];
                    const scale = 0.5 + getHash(x+i, y-i) * 0.5;
                    const treeColor = new THREE.Color("#166534").offsetHSL(0, 0, getHash(x,y+i)*0.2);
                    return (
                    <group key={i} position={[pos[0], 0, pos[1]]} scale={scale} rotation={[0, getHash(i,x)*Math.PI, 0]}>
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.65, 0]} scale={[0.3, 0.4, 0.3]} />
                    </group>
                    )
                })}
              </group>
            );
          case BuildingType.Monument:
             if (variant < 33) {
                // The Spire (Original)
                return (
                  <>
                    <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.1, 0]} scale={[1, 0.2, 1]} />
                    <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 1.2, 0]} scale={[0.4, 2.4, 0.4]} />
                    <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#facc15', emissiveIntensity: 1 })} geometry={sphereGeo} position={[0, 2.5, 0]} scale={0.3} />
                    <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.6, 0]} scale={[0.6, 0.1, 0.6]} />
                    <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1.2, 0]} scale={[0.7, 0.1, 0.7]} />
                    <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1.8, 0]} scale={[0.6, 0.1, 0.6]} />
                    <mesh geometry={new THREE.TorusGeometry(0.8, 0.05, 16, 32)} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                       <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={isNight ? 0.5 : 0} />
                    </mesh>
                    <mesh geometry={new THREE.TorusGeometry(0.6, 0.05, 16, 32)} position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                       <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={isNight ? 0.5 : 0} />
                    </mesh>
                  </>
                )
             } else if (variant < 66) {
                // The Great Dome
                return (
                   <>
                     <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.1, 0]} scale={[1, 0.2, 1]} />
                     <mesh {...commonProps} material={accentMat} geometry={sphereGeo} position={[0, 0.3, 0]} scale={[0.8, 0.8, 0.8]} clipShadows />
                     <mesh {...commonProps} material={roofMat} geometry={sphereGeo} position={[0, 0.8, 0]} scale={[0.6, 0.6, 0.6]} />
                     <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#facc15'})} geometry={cylinderGeo} position={[0, 1.4, 0]} scale={[0.05, 0.8, 0.05]} />
                     {Array.from({length: 8}).map((_, i) => (
                        <mesh key={i} material={mainMat} geometry={boxGeo} position={[Math.cos(i*Math.PI/4)*0.6, 0.2, Math.sin(i*Math.PI/4)*0.6]} scale={[0.1, 0.4, 0.1]} />
                     ))}
                   </>
                )
             } else {
                // Triumph Arch
                return (
                   <>
                     <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.35, 0.5, 0]} scale={[0.3, 1, 0.6]} />
                     <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.35, 0.5, 0]} scale={[0.3, 1, 0.6]} />
                     <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1, 0]} scale={[1, 0.2, 0.7]} />
                     <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0, 0.7, 0]} scale={[0.4, 0.1, 0.6]} rotation={[0,0,Math.PI/2]} />
                   </>
                )
             }
          case BuildingType.Road:
             return null;
          default:
            return null;
        }
      })()}
    </group>
  );
});

// --- 2. Dynamic Systems (Traffic, Citizens, Environment) ---

const carColors = ['#ef4444', '#3b82f6', '#eab308', '#ffffff', '#1f2937', '#f97316'];

const TrafficSystem = ({ grid, isPaused = false }: { grid: Grid; isPaused?: boolean }) => {
  const roadTiles = useMemo(() => {
    const roads: {x: number, y: number}[] = [];
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) roads.push({x: tile.x, y: tile.y});
    }));
    return roads;
  }, [grid]);

  const carCount = Math.min(roadTiles.length, 30);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(0), []);

  useEffect(() => {
    if (roadTiles.length < 2) return;
    carsState.current = new Float32Array(carCount * 6);
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[i*6 + 0] = startNode.x;
      carsState.current[i*6 + 1] = startNode.y;
      carsState.current[i*6 + 2] = startNode.x;
      carsState.current[i*6 + 3] = startNode.y;
      carsState.current[i*6 + 4] = 1; // force pick new target
      carsState.current[i*6 + 5] = getRandomRange(0.01, 0.03); // speed

      const color = new THREE.Color(carColors[Math.floor(Math.random() * carColors.length)]);
      newColors[i*3] = color.r; newColors[i*3+1] = color.g; newColors[i*3+2] = color.b;
    }

    if (carsRef.current) {
        carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
  }, [roadTiles, carCount]);

  useFrame(() => {
    if (isPaused || !carsRef.current || roadTiles.length < 2 || carsState.current.length === 0) return;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 6;
      let curX = carsState.current[idx];
      let curY = carsState.current[idx+1];
      let tarX = carsState.current[idx+2];
      let tarY = carsState.current[idx+3];
      let progress = carsState.current[idx+4];
      const speed = carsState.current[idx+5];

      progress += speed;

      if (progress >= 1) {
        curX = tarX;
        curY = tarY;
        progress = 0;
        
        const neighbors = roadTiles.filter(t => 
          (Math.abs(t.x - curX) === 1 && t.y === curY) || 
          (Math.abs(t.y - curY) === 1 && t.x === curX)
        );

        if (neighbors.length > 0) {
            // Simple pathfinding: avoid going back immediately
            const valid = neighbors.length > 1 
                ? neighbors.filter(n => Math.abs(n.x - carsState.current[idx]) > 0.1 || Math.abs(n.y - carsState.current[idx+1]) > 0.1)
                : neighbors;
            
            const next = valid.length > 0 
                ? valid[Math.floor(Math.random() * valid.length)]
                : neighbors[0];
            
            tarX = next.x;
            tarY = next.y;
        } else {
            const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
            curX = rnd.x; curY = rnd.y; tarX = rnd.x; tarY = rnd.y;
        }
      }

      carsState.current[idx] = curX;
      carsState.current[idx+1] = curY;
      carsState.current[idx+2] = tarX;
      carsState.current[idx+3] = tarY;
      carsState.current[idx+4] = progress;

      // Interpolate position
      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);

      // Determine driving side offset
      const dx = tarX - curX;
      const dy = tarY - curY;
      const angle = Math.atan2(dy, dx);
      
      // Offset to right side relative to movement
      const offsetAmt = 0.15;
      // Normals: (-dy, dx)
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      const offX = (-dy/len) * offsetAmt;
      const offY = (dx/len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Road surface is approx -0.3. Car height 0.15.
      dummy.position.set(wx, -0.3 + 0.075, wz);
      dummy.rotation.set(0, -angle, 0);
      // Car dimensions (Length(X), Height(Y), Width(Z) assuming 0 rotation aligns with X)
      dummy.scale.set(0.5, 0.15, 0.3); 
      
      dummy.updateMatrix();
      carsRef.current.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
  });

  if (roadTiles.length < 2) return null;

  return (
    <instancedMesh ref={carsRef} args={[boxGeo, undefined, carCount]} castShadow>
      <meshStandardMaterial roughness={0.5} metalness={0.3} />
    </instancedMesh>
  );
};

const clothesColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];

const PopulationSystem = ({ population, grid, isPaused = false }: { population: number, grid: Grid, isPaused?: boolean }) => {
    const agentCount = Math.min(Math.floor(population / 2), 300); 
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Find tiles where people can walk (Roads, Parks, empty ground)
    const walkableTiles = useMemo(() => {
        const tiles: {x: number, y: number}[] = [];
        grid.forEach(row => row.forEach(tile => {
          if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.None) {
            tiles.push({x: tile.x, y: tile.y});
          }
        }));
        return tiles;
    }, [grid]);
    
    const agentsState = useRef<Float32Array>(new Float32Array(0));
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    useEffect(() => {
        if (agentCount === 0 || walkableTiles.length === 0) return;
        agentsState.current = new Float32Array(agentCount * 6);
        const newColors = new Float32Array(agentCount * 3);

        for(let i=0; i<agentCount; i++) {
            const t = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            // Spawn with random offset in tile
            const x = t.x + getRandomRange(-0.4, 0.4);
            const y = t.y + getRandomRange(-0.4, 0.4);

            agentsState.current[i*6+0] = x;
            agentsState.current[i*6+1] = y;
            
            // Initial target
            const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
            agentsState.current[i*6+2] = tt.x + getRandomRange(-0.4, 0.4);
            agentsState.current[i*6+3] = tt.y + getRandomRange(-0.4, 0.4);
            
            agentsState.current[i*6+4] = getRandomRange(0.005, 0.015); // speed
            agentsState.current[i*6+5] = Math.random() * Math.PI * 2; // anim

            const c = new THREE.Color(clothesColors[Math.floor(Math.random() * clothesColors.length)]);
            newColors[i*3] = c.r; newColors[i*3+1] = c.g; newColors[i*3+2] = c.b;
        }

        if (meshRef.current) {
            meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
        }
    }, [agentCount, walkableTiles]);

    useFrame((state) => {
        if (isPaused || !meshRef.current || agentCount === 0 || agentsState.current.length === 0) return;
        const time = state.clock.elapsedTime;

        for(let i=0; i<agentCount; i++) {
            const idx = i*6;
            let x = agentsState.current[idx];
            let y = agentsState.current[idx+1];
            let tx = agentsState.current[idx+2];
            let ty = agentsState.current[idx+3];
            const speed = agentsState.current[idx+4];
            const animOffset = agentsState.current[idx+5];

            const dx = tx - x;
            const dy = ty - y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 0.1) {
                // Pick new random target from walkable
                if (walkableTiles.length > 0) {
                    const tt = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
                    tx = tt.x + getRandomRange(-0.4, 0.4);
                    ty = tt.y + getRandomRange(-0.4, 0.4);
                    agentsState.current[idx+2] = tx;
                    agentsState.current[idx+3] = ty;
                }
            } else {
                x += (dx/dist) * speed;
                y += (dy/dist) * speed;
                agentsState.current[idx] = x;
                agentsState.current[idx+1] = y;
            }

            const [wx, _, wz] = gridToWorld(x, y);

            // Walking bounce
            const bounce = Math.abs(Math.sin(time * 10 + animOffset)) * 0.03;

            // Person dimensions
            const height = 0.2;
            const width = 0.08;
            // Ground level approx -0.3 to -0.4
            const groundY = -0.35; 

            dummy.position.set(wx, groundY + height/2 + bounce, wz);
            dummy.rotation.set(0, -Math.atan2(dy, dx), 0);
            dummy.scale.set(width, height, width);
            
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (agentCount === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[boxGeo, undefined, agentCount]} castShadow>
            <meshStandardMaterial roughness={0.8} />
        </instancedMesh>
    )
};

// Clouds & Birds
const Cloud = ({ position, scale, speed, isDark = false, isPaused = false }: { position: [number, number, number], scale: number, speed: number, isDark?: boolean, isPaused?: boolean }) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (isPaused) return;
        if (group.current) {
            group.current.position.x += speed * delta;
            if (group.current.position.x > GRID_SIZE * 1.5) group.current.position.x = -GRID_SIZE * 1.5;
        }
    });

    const bubbles = useMemo(() => Array.from({length: 5 + Math.random() * 5}).map(() => ({
        pos: [getRandomRange(-1,1), getRandomRange(-0.5, 0.5), getRandomRange(-1,1)] as [number, number, number],
        scale: getRandomRange(0.5, 1.2)
    })), []);

    return (
        <group ref={group} position={position} scale={scale}>
            {bubbles.map((b, i) => (
                <mesh key={i} geometry={sphereGeo} position={b.pos} scale={b.scale} castShadow>
                    <meshStandardMaterial color={isDark ? "#4b5563" : "white"} flatShading opacity={isDark ? 0.95 : 0.9} transparent />
                </mesh>
            ))}
        </group>
    )
}

const RainEffect = ({ count = 500, isPaused = false }: { count?: number; isPaused?: boolean }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const rainData = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = getRandomRange(-GRID_SIZE, GRID_SIZE); // x
      data[i * 3 + 1] = getRandomRange(0, 15); // y
      data[i * 3 + 2] = getRandomRange(-GRID_SIZE, GRID_SIZE); // z
    }
    return data;
  }, [count]);

  const rainGeometry = useMemo(() => new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), []);
  const rainMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#60a5fa', transparent: true, opacity: 0.6 }), []);

  useFrame((state, delta) => {
    if (isPaused || !meshRef.current) return;
    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        rainData[idx + 1] -= delta * 20; // speed
        if (rainData[idx + 1] < -2) {
            rainData[idx + 1] = 15;
            rainData[idx] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            rainData[idx + 2] = getRandomRange(-GRID_SIZE, GRID_SIZE);
        }
        dummy.position.set(rainData[idx], rainData[idx + 1], rainData[idx + 2]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[rainGeometry, rainMaterial, count]} />
  );
};

const SnowEffect = ({ count = 800, isPaused = false }: { count?: number; isPaused?: boolean }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const snowData = useMemo(() => {
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        data[i * 3] = getRandomRange(-GRID_SIZE, GRID_SIZE); // x
        data[i * 3 + 1] = getRandomRange(0, 15); // y
        data[i * 3 + 2] = getRandomRange(-GRID_SIZE, GRID_SIZE); // z
    }
    return data;
  }, [count]);

  const snowGeometry = useMemo(() => new THREE.SphereGeometry(0.04, 4, 4), []);
  const snowMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 'white', transparent: true, opacity: 0.8 }), []);

  useFrame((state, delta) => {
    if (isPaused || !meshRef.current) return;
    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        snowData[idx + 1] -= delta * 2; // slow fall
        snowData[idx] += Math.sin(state.clock.elapsedTime + i) * 0.01; // sway
        if (snowData[idx + 1] < -2) {
            snowData[idx + 1] = 15;
            snowData[idx] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            snowData[idx + 2] = getRandomRange(-GRID_SIZE, GRID_SIZE);
        }
        dummy.position.set(snowData[idx], snowData[idx + 1], snowData[idx + 2]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[snowGeometry, snowMaterial, count]} />
  );
};

const Bird = ({ position, speed, offset, isPaused = false }: { position: [number, number, number], speed: number, offset: number, isPaused?: boolean }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (isPaused) return;
        if (ref.current) {
            const time = state.clock.elapsedTime + offset;
            ref.current.position.x = position[0] + Math.sin(time * speed) * GRID_SIZE;
            ref.current.position.z = position[1] + Math.cos(time * speed) * GRID_SIZE/2;
            ref.current.rotation.y = -time * speed + Math.PI;
            ref.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
        }
    });

    return (
        <group ref={ref} position={[position[0], position[2], position[1]]}>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[0.1,0,0]} rotation={[0, Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[-0.1,0,0]} rotation={[0, -Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
        </group>
    )
}

const EnvironmentEffects = ({ isRaining, isSnowing, isPaused = false }: { isRaining: boolean, isSnowing: boolean, isPaused?: boolean }) => {
    return (
        <group raycast={() => null}>
             {/* Clouds */}
            <Cloud position={[-12, 8, 4]} scale={1.5} speed={0.3} isDark={isRaining || isSnowing} isPaused={isPaused} />
            <Cloud position={[5, 9, -8]} scale={1.2} speed={0.5} isDark={isRaining || isSnowing} isPaused={isPaused} />
            <Cloud position={[15, 7, 10]} scale={1.8} speed={0.2} isDark={isRaining || isSnowing} isPaused={isPaused} />
            
            {isRaining && <RainEffect isPaused={isPaused} />}
            {isSnowing && <SnowEffect isPaused={isPaused} />}

            {/* Birds */}
            {!isRaining && !isSnowing && (
                <group position={[0, 0, 0]} scale={0.8}>
                    <Bird position={[0, 0, 10]} speed={0.6} offset={0} isPaused={isPaused} />
                    <Bird position={[0, 0, 10]} speed={0.6} offset={1.2} isPaused={isPaused} />
                    <Bird position={[0, 0, 10]} speed={0.6} offset={2.5} isPaused={isPaused} />
                </group>
            )}

            {/* Water */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                <planeGeometry args={[GRID_SIZE * 4, GRID_SIZE * 4]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.1} metalness={0.5} opacity={0.8} transparent />
            </mesh>
        </group>
    )
};


// --- 3. Main Map Component ---

const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24' }), []);
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.5), []);

  const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
  const hasDown = y < GRID_SIZE - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
  const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
  const hasRight = x < GRID_SIZE - 1 && grid[y][x + 1].buildingType === BuildingType.Road;

  const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
  
  // Isolated road piece: draw a default line
  if (connections === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]} geometry={lineGeo} material={lineMaterial} />
    );
  }

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
      {/* Center point for junctions to fill the gap, lifted slightly to avoid z-fighting */}
      {(hasUp || hasDown) && (hasLeft || hasRight) && (
        <mesh position={[0, 0, 0.005]} material={lineMaterial}>
           <planeGeometry args={[0.12, 0.12]} />
        </mesh>
      )}

      {hasUp && <mesh position={[0, 0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasDown && <mesh position={[0, -0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasLeft && <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      {hasRight && <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
    </group>
  );
});

interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
}

// Ground Tile: Handles pointer events and forms base terrain
const GroundTile = React.memo(({ type, x, y, grid, onHover, onLeave, onClick }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  let color = '#10b981';
  // Base level for tiles, slightly varying
  let topY = -0.3; 
  let thickness = 0.5;
  
  if (type === BuildingType.None) {
    const noise = getHash(x, y);
    color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
    topY = -0.3 - noise * 0.1; // Slight height variation for grass
  } else if (type === BuildingType.Road) {
    color = '#374151';
    topY = -0.29; // slightly higher
  } else {
    color = '#d1d5db'; // concrete base
    topY = -0.28;
  }

  const centerY = topY - thickness/2;

  return (
    <mesh 
        position={[wx, centerY, wz]} 
        receiveShadow castShadow
        onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
        onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
        onPointerDown={(e) => {
            e.stopPropagation();
            if (e.button === 0) onClick(x, y);
        }}
    >
      <boxGeometry args={[1, thickness, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={1} />
      {type === BuildingType.Road && <RoadMarkings x={x} y={y} grid={grid} yOffset={thickness / 2 + 0.001} />}
    </mesh>
  );
});

// Selection/Hover Cursor
const Cursor = ({ x, y, color }: { x: number, y: number, color: string }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  return (
    <mesh position={[wx, -0.25, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
      <Outlines thickness={0.05} color="white" />
    </mesh>
  );
};

const HintIndicatorItem = ({ hint }: { hint: HintIndicator }) => {
  const [wx, _, wz] = gridToWorld(hint.x, hint.y);
  
  return (
    <Html position={[wx, 1.5, wz]} center pointerEvents="none">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.5 }}
        animate={{ opacity: 1, y: -40, scale: 1 }}
        exit={{ opacity: 0, y: -80, scale: 0.8 }}
        className="whitespace-nowrap px-2 py-0.5 rounded-full font-mono font-bold text-[10px] shadow-lg backdrop-blur-sm border border-white/20 select-none"
        style={{ color: hint.color, backgroundColor: 'rgba(15, 23, 42, 0.4)' }}
      >
        {hint.text}
      </motion.div>
    </Html>
  );
};

const EconomicOverlayTile = ({ tile }: { tile: TileData }) => {
  const ecoOutput = useMemo(() => {
    if (tile.buildingType === BuildingType.Commercial) return BUILDINGS[BuildingType.Commercial].incomeGen * (tile.level || 1);
    if (tile.buildingType === BuildingType.Industrial) return BUILDINGS[BuildingType.Industrial].incomeGen * (tile.level || 1);
    if (tile.buildingType === BuildingType.Residential) return (BUILDINGS[BuildingType.Residential].popGen * (tile.level || 1)) * 2;
    return 0;
  }, [tile]);

  let color = '#ef4444'; // Red for low performing / zero output zones
  if (ecoOutput >= 40) color = '#22d3ee'; // Cyan for high output
  else if (ecoOutput > 0) color = '#facc15'; // Yellow for moderate output

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} side={THREE.DoubleSide} depthTest={false} />
    </mesh>
  );
};

const WeatherOverlayTile = ({ 
  tile, 
  grid, 
  weather, 
  activeAlert 
}: { 
  tile: TileData; 
  grid: Grid; 
  weather: WeatherState; 
  activeAlert: WeatherAlert | null;
}) => {
  const penaltyInfo = useMemo(() => {
    return calculateTileWeatherPenalty(tile, grid, weather, activeAlert);
  }, [tile, grid, weather, activeAlert]);

  if (tile.buildingType === BuildingType.None || tile.buildingType === BuildingType.Road) {
    return null;
  }

  let color = '#10b981';
  let opacity = 0.4;

  if (penaltyInfo.statusCategory === 'shield') {
    color = '#06b6d4';
    opacity = 0.75;
  } else if (penaltyInfo.statusCategory === 'severe') {
    color = '#f43f5e';
    opacity = 0.8;
  } else if (penaltyInfo.statusCategory === 'moderate') {
    color = '#f59e0b';
    opacity = 0.6;
  }

  return (
    <group position={[0, 0.03, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[0.92, 0.92]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthTest={false} />
      </mesh>

      {penaltyInfo.statusCategory === 'severe' && (
        <Html position={[0, 0.6, 0]} center pointerEvents="none">
          <div className="px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-rose-300 font-mono font-bold text-[9px] shadow-lg animate-pulse whitespace-nowrap">
            -{penaltyInfo.penaltyPct}% LOSS
          </div>
        </Html>
      )}

      {penaltyInfo.statusCategory === 'shield' && (
        <Html position={[0, 0.6, 0]} center pointerEvents="none">
          <div className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono font-bold text-[9px] shadow-lg whitespace-nowrap">
            🛡️ DOME
          </div>
        </Html>
      )}

      {penaltyInfo.statusCategory === 'protected' && penaltyInfo.isCoveredByShield && (
        <Html position={[0, 0.6, 0]} center pointerEvents="none">
          <div className="px-1 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[8px] shadow-md whitespace-nowrap opacity-80">
            SAFE
          </div>
        </Html>
      )}
    </group>
  );
};

const BuildingTooltip = ({ 
  x, 
  y, 
  tile, 
  grid,
  weather,
  activeAlert,
  isNight, 
  isEconomicOverlayActive,
  isWeatherOverlayActive
}: { 
  x: number; 
  y: number; 
  tile: TileData; 
  grid: Grid;
  weather: WeatherState;
  activeAlert: WeatherAlert | null;
  isNight: boolean; 
  isEconomicOverlayActive: boolean;
  isWeatherOverlayActive: boolean;
}) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const config = BUILDINGS[tile.buildingType];
  
  const ecoOutput = useMemo(() => {
    if (!tile || tile.buildingType === BuildingType.None) return 0;
    if (tile.buildingType === BuildingType.Commercial) return BUILDINGS[BuildingType.Commercial].incomeGen * (tile.level || 1);
    if (tile.buildingType === BuildingType.Industrial) return BUILDINGS[BuildingType.Industrial].incomeGen * (tile.level || 1);
    if (tile.buildingType === BuildingType.Residential) return (BUILDINGS[BuildingType.Residential].popGen * (tile.level || 1)) * 2;
    return 0;
  }, [tile]);

  const weatherPenaltyInfo = useMemo(() => {
    return calculateTileWeatherPenalty(tile, grid, weather, activeAlert);
  }, [tile, grid, weather, activeAlert]);

  const zoneStatus = ecoOutput >= 40 ? 'High Output' : ecoOutput > 0 ? 'Moderate Output' : 'Low-Performing Zone';
  const statusColor = ecoOutput >= 40 ? 'text-cyan-400' : ecoOutput > 0 ? 'text-yellow-400' : 'text-rose-400';

  return (
    <Html position={[wx, 1.2, wz]} center pointerEvents="none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl flex flex-col gap-1 min-w-[140px] select-none ${
          isNight ? 'bg-slate-950/90' : 'bg-slate-900/80'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-[10px] font-bold text-white tracking-tight uppercase whitespace-nowrap">{config ? config.name : 'Empty Tile'}</span>
          {config && (
            <div className="flex items-center gap-1">
               <div className="w-1 h-1 rounded-full bg-cyan-400" />
               <span className="text-[8px] font-mono text-cyan-400">LVL {tile.level || 1}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono border-t border-white/10 pt-1">
          <span className="text-slate-300">Economic Output:</span>
          <span className="text-emerald-400 font-bold">${ecoOutput}/day</span>
        </div>
        {tile.buildingType === BuildingType.Industrial && (
          <div className="flex items-center justify-between text-[9px] font-mono border-t border-amber-500/20 pt-1 text-amber-300">
            <span>Refinement Supply:</span>
            <span className="font-bold">+{ (tile.level || 1) * 10 } Refined/tick</span>
          </div>
        )}
        {tile.buildingType === BuildingType.Commercial && (tile.level || 1) >= 2 && (
          <div className="flex items-center justify-between text-[9px] font-mono border-t border-cyan-500/20 pt-1 text-cyan-300">
            <span>QoL Synthesis:</span>
            <span className="font-bold">-{ ((tile.level || 1) - 1) * 15 } Refined/tick</span>
          </div>
        )}
        {isEconomicOverlayActive && (
          <div className={`text-[8px] font-mono font-bold uppercase tracking-wider ${statusColor}`}>
            ● {zoneStatus}
          </div>
        )}
        {isWeatherOverlayActive && (
          <div className="border-t border-white/10 pt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-slate-300">Weather Incident:</span>
              <span className={`font-bold ${
                weatherPenaltyInfo.statusCategory === 'severe' ? 'text-rose-400' :
                weatherPenaltyInfo.statusCategory === 'moderate' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {weatherPenaltyInfo.penaltyPct > 0 ? `-${weatherPenaltyInfo.penaltyPct}% Loss` : 'Protected'}
              </span>
            </div>
            <div className="text-[8px] font-mono text-slate-400 leading-tight">
              {weatherPenaltyInfo.statusLabel}
            </div>
            {weatherPenaltyInfo.recommendedAction && (
              <div className="text-[8px] font-mono text-sky-300 bg-sky-500/20 px-1 py-0.5 rounded border border-sky-500/30 mt-0.5">
                💡 {weatherPenaltyInfo.recommendedAction}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </Html>
  );
};

const UpgradeIndicator = ({ x, y }: { x: number, y: number }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  return (
    <Html position={[wx, 2.5, wz]} center pointerEvents="none">
      <motion.div
        animate={{ 
          y: [0, -4, 0],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="flex items-center justify-center p-1 bg-yellow-400/20 backdrop-blur-sm rounded-full border border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]"
      >
        <ChevronUp className="w-3 h-3 text-yellow-400" />
      </motion.div>
    </Html>
  );
};

const OptimalSpotMarker = ({ x, y, isNight }: { x: number, y: number, isNight: boolean }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.015;
    }
  });

  return (
    <group ref={ref} position={[wx, 0.05, wz]} raycast={() => null}>
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]} position={[0, 0.4, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#fbbf24" 
          emissiveIntensity={1.5} 
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 16]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 0.9, 0]} center pointerEvents="none">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full font-sans font-extrabold text-[8px] tracking-wider uppercase whitespace-nowrap border border-amber-300 shadow-lg flex items-center gap-1 shadow-amber-500/20"
        >
          <span>★ OPTIMAL SPOT</span>
        </motion.div>
      </Html>
    </group>
  );
};

const ResilienceBeacon = ({ level = 1, isPaused = false }: { level?: number; isPaused?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (isPaused) return;
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  const color = level >= 3 ? "#10b981" : level === 2 ? "#06b6d4" : "#3b82f6";
  const emissive = level >= 3 ? "#059669" : level === 2 ? "#0284c7" : "#2563eb";

  return (
    <group ref={ref} position={[0, 1.4 + level * 0.2, 0]}>
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.2} roughness={0.2} />
      </mesh>
    </group>
  );
};

const BuildingStatusPulse = ({
  durability = 100,
  efficiency = 100,
  onRepair
}: {
  durability?: number;
  efficiency?: number;
  onRepair?: () => void;
}) => {
  const isCritical = durability < 50 || efficiency < 50;
  const isWarning = durability < 75 || efficiency < 75;

  if (!isCritical && !isWarning) return null;

  const color = isCritical ? "#ef4444" : "#f59e0b";

  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.58, 24]} />
        <meshBasicMaterial color={color} transparent opacity={isCritical ? 0.85 : 0.55} side={THREE.DoubleSide} />
      </mesh>

      <Html position={[0, 1.8, 0]} center pointerEvents="none">
        <motion.div
          animate={{ y: [0, -3, 0], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className={`px-2 py-0.5 rounded-lg font-mono font-black text-[8px] tracking-wider uppercase border shadow-xl flex items-center gap-1 ${
            isCritical
              ? "bg-red-500 text-white border-red-300 shadow-red-500/30"
              : "bg-amber-500 text-amber-950 border-amber-300 shadow-amber-500/20"
          }`}
        >
          <span>{isCritical ? "⚠️ DAMAGED" : "⚡ EFFICIENCY DROP"}</span>
          <span>{durability}%</span>
        </motion.div>
      </Html>
    </group>
  );
};

const InspectionDrone = ({
  dronePos,
  isPaused = false
}: {
  dronePos: { x: number; y: number } | null;
  isPaused?: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (isPaused || !groupRef.current || !dronePos) return;

    const [targetX, _, targetZ] = gridToWorld(dronePos.x, dronePos.y);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 4);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 4);
    groupRef.current.position.y = 3.6 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
  });

  if (!dronePos) return null;
  const initialPos = gridToWorld(dronePos.x, dronePos.y);

  return (
    <group ref={groupRef} position={[initialPos[0], 3.6, initialPos[2]]}>
      {/* Central Drone Chassis */}
      <mesh geometry={boxGeo} scale={[0.45, 0.12, 0.45]}>
        <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh geometry={sphereGeo} scale={[0.16, 0.1, 0.16]} position={[0, 0.08, 0]}>
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
      </mesh>

      {/* LiDAR Scan Light Beam Cone */}
      <mesh position={[0, -1.8, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[1.0, 3.6, 16, 1, true]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {/* Target Laser Ring on Ground */}
      <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.55, 24]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating LiDAR Badge */}
      <Html position={[0, 0.8, 0]} center pointerEvents="none">
        <div className="bg-slate-950/90 text-emerald-300 border border-emerald-400/60 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase shadow-lg shadow-emerald-500/20 whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>INSPECTION DRONE</span>
        </div>
      </Html>
    </group>
  );
};

const AtmosphericShieldDome = ({ x, y, isWeatherActive, isPaused = false }: { x: number; y: number; isWeatherActive: boolean; isPaused?: boolean }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const domeRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (isPaused) return;
    if (domeRef.current) {
      domeRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={domeRef} position={[wx, 0.2, wz]}>
      {/* Translucent Forcefield Hemisphere Bubble */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[4.0, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#22d3ee"
          emissiveIntensity={isWeatherActive ? 0.9 : 0.3}
          transparent
          opacity={isWeatherActive ? 0.28 : 0.12}
          side={THREE.DoubleSide}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      {/* Base Radius Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.9, 4.1, 48]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={isWeatherActive ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

interface RefinementSupplyChainIndicatorProps {
  x: number;
  y: number;
  tile: TileData;
  isPaused?: boolean;
  surgeActive?: boolean;
}

const RefinementSupplyChainIndicator: React.FC<RefinementSupplyChainIndicatorProps> = ({
  x,
  y,
  tile,
  isPaused = false,
  surgeActive = false
}) => {
  const ringRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 5));
    }, 120);
    return () => clearInterval(interval);
  }, [isPaused]);

  useFrame((state, delta) => {
    if (isPaused) return;
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 1.5;
    }
  });

  const isIndustrial = tile.buildingType === BuildingType.Industrial;
  const isCommercialHub = tile.buildingType === BuildingType.Commercial && (tile.level || 1) >= 2;

  if (!isIndustrial && !isCommercialHub) return null;

  const level = tile.level || 1;
  const ringColor = isIndustrial ? "#fbbf24" : "#06b6d4";
  const label = isIndustrial ? `+${level * 10} Refined` : `QoL Synthesis`;

  return (
    <group position={[0, 0.05, 0]}>
      {/* 3D Glowing Ground Aura Ring */}
      <group ref={ringRef} position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={surgeActive ? 0.85 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Floating HTML Progress Bar & Glow Badge */}
      <Html position={[0, 1.8 + level * 0.35, 0]} center pointerEvents="none">
        <div className="flex flex-col items-center gap-1 select-none">
          {/* Badge */}
          <div
            className={`px-2 py-0.5 rounded-full font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-lg border backdrop-blur-md transition-all ${
              isIndustrial
                ? 'bg-amber-950/85 text-amber-300 border-amber-500/60 shadow-amber-500/30'
                : 'bg-cyan-950/85 text-cyan-300 border-cyan-500/60 shadow-cyan-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isIndustrial ? 'bg-amber-400' : 'bg-cyan-400'}`} />
            <span>{label}</span>
            {surgeActive && <span className="text-[8px] bg-amber-500 text-slate-950 px-1 rounded font-extrabold ml-0.5">SURGE</span>}
          </div>

          {/* Animated Supply Chain Progress Bar */}
          <div className="w-16 h-1.5 bg-slate-950/90 border border-white/20 rounded-full overflow-hidden p-0.5 shadow-md flex items-center">
            <motion.div
              className={`h-full rounded-full transition-all duration-150 ${
                isIndustrial
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-300 shadow-[0_0_8px_rgba(6,182,212,0.9)]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  onHoverTile: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
  weather: WeatherState;
  activeAlert?: WeatherAlert | null;
  hints: HintIndicator[];
  money: number;
  optimalSpot?: { x: number; y: number; score: number; explanation: string } | null;
  isEconomicOverlayActive?: boolean;
  isWeatherOverlayActive?: boolean;
  isPaused?: boolean;
  refinementState?: MaterialRefinementState;
  dronePos?: { x: number; y: number } | null;
  isDroneActive?: boolean;
}

const IsoMap: React.FC<IsoMapProps> = ({ 
  grid, 
  onTileClick, 
  onHoverTile, 
  hoveredTool, 
  population, 
  weather, 
  activeAlert = null,
  hints, 
  money, 
  optimalSpot, 
  isEconomicOverlayActive = false, 
  isWeatherOverlayActive = false,
  isPaused = false,
  refinementState,
  dronePos = null,
  isDroneActive = true
}) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);

  const handleHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
    onHoverTile(x, y);
  }, [onHoverTile]);

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
    onHoverTile(-1, -1);
  }, [onHoverTile]);

  // Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewColor = showPreview ? BUILDINGS[hoveredTool].color : 'white';
  const isBulldoze = hoveredTool === BuildingType.None;
  
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0,0,0];

  const isNight = weather.cycle === 'night';
  const isEvening = weather.cycle === 'evening';
  const isMorning = weather.cycle === 'morning';

  const ambientIntensity = isNight ? 0.2 : (weather.isRaining || weather.isSnowing ? 0.3 : 0.5);
  const ambientColor = isNight ? "#1e293b" : (weather.isRaining ? "#94a3b8" : (weather.isSnowing ? "#f8fafc" : (isEvening ? "#ffedd5" : "#cceeff")));
  
  const directionalIntensity = isNight ? 0.1 : (weather.isRaining || weather.isSnowing ? 1 : 2);
  const directionalColor = isNight ? "#334155" : (weather.isRaining ? "#94a3b8" : (weather.isSnowing ? "#f8fafc" : (isEvening ? "#fb923c" : "#fffbeb")));

  return (
    <div className="absolute inset-0 touch-none overflow-hidden">
      {/* Animated Sky Background based on Time of Day & Weather */}
      <SkyBackground weather={weather} />

      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        
        <MapControls 
          enableRotate={true}
          enableZoom={true}
          minZoom={20}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.1}
          target={[0,-0.5,0]}
        />

        <ambientLight intensity={ambientIntensity} color={ambientColor} />
        <directionalLight
          castShadow
          position={isEvening ? [15, 5, 10] : [15, 20, 10]}
          intensity={directionalIntensity}
          color={directionalColor}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15} shadow-camera-right={15}
          shadow-camera-top={15} shadow-camera-bottom={-15}
        >
        </directionalLight>
        {(weather.isFoggy || weather.isSnowing || isNight) && (
            <fog attach="fog" args={[
                isNight ? '#020617' : (weather.isSnowing ? '#f8fafc' : '#475569'), 
                10, 
                80
            ]} />
        )}
        <Environment preset={isNight ? "night" : (weather.isRaining ? "night" : (weather.isSnowing ? "apartment" : (isEvening ? "sunset" : "city")))} />

        <EnvironmentEffects isRaining={weather.isRaining} isSnowing={weather.isSnowing} isPaused={isPaused} />

        <AnimatePresence>
          {hints.map(hint => (
            <HintIndicatorItem key={hint.id} hint={hint} />
          ))}
          {hoveredTile && (
            <BuildingTooltip 
              key={`tooltip-${hoveredTile.x}-${hoveredTile.y}`}
              x={hoveredTile.x} 
              y={hoveredTile.y} 
              tile={grid[hoveredTile.y][hoveredTile.x]} 
              grid={grid}
              weather={weather}
              activeAlert={activeAlert}
              isNight={isNight}
              isEconomicOverlayActive={isEconomicOverlayActive}
              isWeatherOverlayActive={isWeatherOverlayActive}
            />
          )}
        </AnimatePresence>

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              // Calculate world position once per tile
              const [wx, _, wz] = gridToWorld(x, y);
              
              return (
              <React.Fragment key={`${x}-${y}`}>
                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}
                    onHover={handleHover}
                    onLeave={handleLeave}
                    onClick={onTileClick}
                />
                
                {/* Building visual - apply world position to group to align with ground tile */}
                <group position={[wx, 0, wz]} raycast={() => null}>
                    {isEconomicOverlayActive && <EconomicOverlayTile tile={tile} />}
                    {isWeatherOverlayActive && (
                      <WeatherOverlayTile
                        tile={tile}
                        grid={grid}
                        weather={weather}
                        activeAlert={activeAlert}
                      />
                    )}
                    {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                      <>
                        <ProceduralBuilding 
                          type={tile.buildingType} 
                          baseColor={BUILDINGS[tile.buildingType].color} 
                          x={x} y={y} 
                          level={tile.level}
                          isNight={isNight}
                          isPaused={isPaused}
                        />
                        {((tile.resilienceLevel && tile.resilienceLevel > 0) || tile.isResilient) && (
                          <ResilienceBeacon level={tile.resilienceLevel || (tile.isResilient ? 3 : 1)} isPaused={isPaused} />
                        )}
                        <RefinementSupplyChainIndicator 
                          x={x} 
                          y={y} 
                          tile={tile} 
                          isPaused={isPaused} 
                          surgeActive={refinementState?.surgeActive} 
                        />
                        <BuildingStatusPulse 
                          durability={tile.durability} 
                          efficiency={tile.efficiency} 
                        />
                      </>
                    )}
                    {(() => {
                      if (tile.buildingType === BuildingType.None || tile.buildingType === BuildingType.Road) return null;
                      const level = tile.level || 1;
                      const upgradeCost = BUILDINGS[tile.buildingType].cost * (level + 1);
                      if (level < 3 && money >= upgradeCost) {
                        return <UpgradeIndicator x={x} y={y} />;
                      }
                      return null;
                    })()}
                </group>
              </React.Fragment>
            )})
          )}

          {/* Visual Elements - disable pointer events */}
          <group raycast={() => null}>
            <TrafficSystem grid={grid} isPaused={isPaused} />
            <PopulationSystem population={population} grid={grid} isPaused={isPaused} />
            <InspectionDrone dronePos={dronePos} isPaused={isPaused} />

            {/* Optimal Placement assist target */}
            {optimalSpot && (
              <OptimalSpotMarker x={optimalSpot.x} y={optimalSpot.y} isNight={isNight} />
            )}

            {/* Placement Preview */}
            {showPreview && hoveredTile && (
              <group position={[previewPos[0], 0, previewPos[2]]}>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.1} floatingRange={[0, 0.1]}>
                  <ProceduralBuilding 
                    type={hoveredTool} 
                    baseColor={previewColor} 
                    x={hoveredTile.x} 
                    y={hoveredTile.y} 
                    transparent 
                    opacity={0.7} 
                  />
                </Float>
              </group>
            )}

            {/* Highlight */}
            {hoveredTile && (
              <Cursor 
                x={hoveredTile.x} 
                y={hoveredTile.y} 
                color={isBulldoze ? '#ef4444' : (showPreview ? '#ffffff' : '#000000')} 
              />
            )}
          </group>
        </group>
        
        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};

export default IsoMap;