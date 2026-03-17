"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// Pattern of one octave (12 notes).
// isBlack: true/false. whiteOffset: incremental x-position of white keys.
const OCTAVE_PATTERN = [
  { isBlack: false, whiteOffset: 0 },   // C
  { isBlack: true, whiteOffset: 0.5 },  // C#
  { isBlack: false, whiteOffset: 1 },   // D
  { isBlack: true, whiteOffset: 1.5 },  // D#
  { isBlack: false, whiteOffset: 2 },   // E
  { isBlack: false, whiteOffset: 3 },   // F
  { isBlack: true, whiteOffset: 3.5 },  // F#
  { isBlack: false, whiteOffset: 4 },   // G
  { isBlack: true, whiteOffset: 4.5 },  // G#
  { isBlack: false, whiteOffset: 5 },   // A
  { isBlack: true, whiteOffset: 5.5 },  // A#
  { isBlack: false, whiteOffset: 6 },   // B
];

// Generates data for `numOctaves` octaves starting from index 0.
function generatePianoKeys(numOctaves: number = 3) {
  const keys = [];
  for (let oct = 0; oct < numOctaves; oct++) {
    for (let i = 0; i < 12; i++) {
        const pattern = OCTAVE_PATTERN[i];
        keys.push({
          index: oct * 12 + i,
          isBlack: pattern.isBlack,
          // 7 white keys per octave, so we shift by 7 units per octave
          xPos: pattern.whiteOffset + (oct * 7)
        });
    }
  }
  return keys;
}

// Single Key Component with spring physics
function PianoKey({ 
    data, 
    isActive, 
    themeColor 
}: { 
    data: { index: number, isBlack: boolean, xPos: number }, 
    isActive: boolean,
    themeColor: string 
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Target values based on state
  const targetY = isActive ? (data.isBlack ? 0.35 : -0.25) : (data.isBlack ? 0.5 : 0);
  const targetRotX = isActive ? 0.05 : 0;
  
  // Use useMemo for geometry shapes instead of declaring inline to avoid recreation
  const dims = data.isBlack ? [0.6, 0.8, 4] : [0.95, 1, 6];
  const color = data.isBlack ? "#111" : "#fff";

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;
    
    // Smooth physical spring lerping
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 15 * delta);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 15 * delta);

    // Color Lerp: if active, blend between base color and theme, otherwise return to base
    const baseColor = new THREE.Color(color);
    const activeColor = new THREE.Color(themeColor);
    
    if (isActive) {
       materialRef.current.color.lerp(activeColor, 10 * delta);
       materialRef.current.emissive.lerp(activeColor.clone().multiplyScalar(0.4), 10 * delta); // Glow
    } else {
       materialRef.current.color.lerp(baseColor, 10 * delta);
       materialRef.current.emissive.lerp(new THREE.Color("#000"), 10 * delta);
    }
  });

  return (
    <mesh 
      ref={meshRef}
      castShadow 
      receiveShadow
      position={[
          data.xPos, 
          data.isBlack ? 0.5 : 0, 
          data.isBlack ? -1 : 0
      ]}
    >
      <boxGeometry args={[dims[0], dims[1], dims[2]]} />
      <meshStandardMaterial 
        ref={materialRef} 
        color={color} 
        roughness={data.isBlack ? 0.2 : 0.1} 
        metalness={0.1}
      />
    </mesh>
  );
}

// Main 3D Presentational Component
export default function Piano3D({ activeKeys, themeColor = "#f59e0b" }: { activeKeys: number[], themeColor?: string }) {
  const keys = useMemo(() => generatePianoKeys(3), []);

  return (
    <div className="w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing rounded-xl overflow-hidden relative" style={{ background: 'radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)' }}>
      
      {/* Etiqueta Flotante Decorativa */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase">Motor de Acordes 3D</p>
      </div>

      <Canvas camera={{ position: [0, 10, 16], fov: 45 }} shadows>
        <ambientLight intensity={0.4} />
        <spotLight position={[0, 20, 12]} intensity={1.5} castShadow penumbra={1} angle={0.6} />
        
        {/* Interactive Camera Controls (Orbital VR Feel) */}
        <PresentationControls 
          global 
          rotation={[0, 0, 0]} 
          polar={[-Math.PI / 2, Math.PI / 2]} 
          azimuth={[-Math.PI, Math.PI]}
          cursor={true}
        >
          <group position={[-10, 0, 0]}> {/* Centro del piano */}
            
            {keys.map((k) => (
               <PianoKey 
                 key={k.index} 
                 data={k} 
                 isActive={activeKeys.includes(k.index)} 
                 themeColor={themeColor} 
               />
            ))}

            {/* Falso cuerpo del teclado (Madera oscura o plástico premium) */}
            <mesh position={[10, -0.6, -1]} receiveShadow castShadow>
               <boxGeometry args={[23, 0.5, 7]} />
               <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
            </mesh>

          </group>
        </PresentationControls>
        
        {/* Entorno de Reflejo para sensación fotorealista (drei) */}
        <Environment preset="forest" />
      </Canvas>
    </div>
  );
}
