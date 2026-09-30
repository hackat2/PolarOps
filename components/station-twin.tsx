"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import * as THREE from "three";

type Focus = "Generator" | "Fuel reserve" | "Communications";

function Block({
  position,
  size,
  color,
  label,
  onFocus,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  label: string;
  onFocus: (name: Focus) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const focusName = label === "DG" ? "Generator" : label === "FUEL" ? "Fuel reserve" : "Communications";
  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(event) => { event.stopPropagation(); onFocus(focusName); }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={hovered ? "#a8edf0" : color} roughness={0.78} />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size[0] * 0.94, size[2] * 0.94]} />
        <meshStandardMaterial color="#d9e9e9" roughness={1} />
      </mesh>
      {hovered && (
        <Html center position={[0, size[1] / 2 + 0.25, 0]} distanceFactor={8}>
          <span className="hotspot-label">{label} · click to inspect</span>
        </Html>
      )}
    </group>
  );
}

function Mast({ onFocus }: { onFocus: (name: Focus) => void }) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#91aeb9" }), []);
  return (
    <group position={[1.16, 0, -0.55]} onClick={() => onFocus("Communications")}>
      <mesh position={[0, 0.74, 0]} material={material}>
        <cylinderGeometry args={[0.018, 0.035, 1.5, 7]} />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#68d7e8" emissive="#226f7c" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function StationModel({ onFocus }: { onFocus: (name: Focus) => void }) {
  return (
    <>
      <ambientLight intensity={1.6} />
      <directionalLight position={[3, 6, 4]} intensity={2} castShadow />
      <group position={[0, -0.55, 0]} rotation={[0, -0.18, 0]}>
        <Block position={[-0.4, 0, 0]} size={[1.25, 0.7, 0.72]} color="#91a9ae" label="LIVING" onFocus={onFocus} />
        <Block position={[-0.07, 0, -0.82]} size={[0.83, 0.55, 0.56]} color="#7d999f" label="LAB" onFocus={onFocus} />
        <Block position={[0.69, -0.13, 0.28]} size={[0.55, 0.46, 0.5]} color="#6f909a" label="DG" onFocus={onFocus} />
        <Block position={[1.05, -0.19, -0.42]} size={[0.48, 0.34, 0.48]} color="#829fa4" label="FUEL" onFocus={onFocus} />
        <Mast onFocus={onFocus} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.57, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#b8d5da" roughness={1} />
      </mesh>
      <OrbitControls enablePan={false} minDistance={4} maxDistance={7} minPolarAngle={0.55} maxPolarAngle={1.4} />
    </>
  );
}

export function StationTwin({ onFocus }: { onFocus: (name: Focus) => void }) {
  return (
    <motion.div className="twin-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <Canvas shadows camera={{ position: [3.1, 2.6, 4.5], fov: 37 }} dpr={[1, 1.5]}>
        <StationModel onFocus={onFocus} />
      </Canvas>
    </motion.div>
  );
}
