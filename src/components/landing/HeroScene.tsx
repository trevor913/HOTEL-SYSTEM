"use client";
/**
 * Night-market vignette (§9.7): jiko with flickering coals, sufuria with steam sprites,
 * hovering phone showing the app, vibanda + string lights, orbital drift and ±3° parallax.
 * Primitives only, no downloaded GLBs. `lite` lowers particles/DPR for phones.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function useSoftTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,0.85)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

function Steam({ count }: { count: number }) {
  const tex = useSoftTexture();
  const refs = useRef<THREE.Sprite[]>([]);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ off: i / count, x: (((i * 37) % 10) / 10 - 0.5) * 0.7, z: (((i * 53) % 10) / 10 - 0.5) * 0.5, s: 0.45 + ((i * 17) % 10) / 20 })), [count]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    seeds.forEach((sd, i) => {
      const sp = refs.current[i]; if (!sp) return;
      const p = (t * 0.16 + sd.off) % 1;
      sp.position.set(sd.x + Math.sin(t * 0.7 + i) * 0.22 * p, 1.4 + p * 2.4, sd.z);
      const sc = sd.s * (0.5 + p * 1.6); sp.scale.set(sc, sc, sc);
      (sp.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * 0.28;
    });
  });
  return <>{seeds.map((_, i) => (
    <sprite key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
      <spriteMaterial map={tex} transparent depthWrite={false} color="#f5f0ea" opacity={0} />
    </sprite>
  ))}</>;
}

function Jiko() {
  const light = useRef<THREE.PointLight>(null);
  const coal = useRef<THREE.MeshStandardMaterial>(null);
  const door = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 0.82 + Math.sin(t * 13) * 0.05 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 23.1) * 0.04;
    if (light.current) light.current.intensity = 7 * f;
    if (coal.current) coal.current.emissiveIntensity = 2.4 * f;
    if (door.current) door.current.emissiveIntensity = 1.8 * f;
  });
  return (
    <group>
      <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.75, 0.55, 0.7, 10]} /><meshStandardMaterial color="#3a302a" roughness={0.75} metalness={0.45} flatShading /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.6, 0.7, 0.06, 10]} /><meshStandardMaterial color="#241e1a" flatShading /></mesh>
      <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.66, 0.66, 0.06, 10]} /><meshStandardMaterial ref={coal} color="#ff6b2c" emissive="#ff5a1a" emissiveIntensity={2.4} flatShading /></mesh>
      <mesh position={[0, 0.28, 0.66]} rotation={[0.26, 0, 0]}><planeGeometry args={[0.36, 0.2]} /><meshStandardMaterial ref={door} color="#ff8f4d" emissive="#ff6b2c" emissiveIntensity={1.8} side={THREE.DoubleSide} /></mesh>
      <pointLight ref={light} position={[0, 0.95, 0.4]} color="#ff7a33" intensity={7} distance={8} decay={1.5} />
      {/* sufuria of pilau */}
      <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.72, 0.62, 0.62, 16, 1, true]} /><meshStandardMaterial color="#9a948d" metalness={0.85} roughness={0.32} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1.36, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.72, 0.035, 6, 24]} /><meshStandardMaterial color="#b8b2aa" metalness={0.9} roughness={0.25} /></mesh>
      <mesh position={[0, 1.28, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.69, 16]} /><meshStandardMaterial color="#b98a4e" roughness={0.95} flatShading /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.8, 1.22, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.09, 0.025, 6, 10, Math.PI]} /><meshStandardMaterial color="#8a847d" metalness={0.8} roughness={0.35} /></mesh>)}
    </group>
  );
}

function Kibanda({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.8, 1.1, 1.1]} /><meshStandardMaterial color="#2a211b" roughness={0.9} flatShading /></mesh>
      <mesh position={[0, 0.95, 0.56]}><planeGeometry args={[1.5, 0.35]} /><meshStandardMaterial color="#ffb26b" emissive="#ff8f4d" emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, 1.42, 0.15]} rotation={[0.35, 0, 0]}><boxGeometry args={[2.1, 0.04, 1.6]} /><meshStandardMaterial color="#5b4f45" metalness={0.5} roughness={0.6} flatShading /></mesh>
      {[-0.85, 0.85].map((x) => <mesh key={x} position={[x, 0.7, 0.62]}><cylinderGeometry args={[0.03, 0.03, 1.4, 5]} /><meshStandardMaterial color="#3d3129" /></mesh>)}
      <pointLight position={[0, 1.1, 0.9]} color="#ffad5c" intensity={1.4} distance={3} />
    </group>
  );
}

function StringLights() {
  const pts = useMemo(() => Array.from({ length: 20 }, (_, i) => { const u = i / 19; return [-5.5 + u * 11, 3.5 - Math.sin(u * Math.PI) * 0.75, -3.2] as [number, number, number]; }), []);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame(({ clock }) => { mats.current.forEach((m, i) => { if (m) m.opacity = 0.75 + Math.sin(clock.elapsedTime * 2 + i * 1.7) * 0.25; }); });
  return <>{pts.map((p, i) => (
    <mesh key={i} position={p}><sphereGeometry args={[0.055, 8, 8]} />
      <meshBasicMaterial ref={(m) => { if (m) mats.current[i] = m; }} transparent color={i % 3 === 0 ? "#ffd29a" : i % 3 === 1 ? "#ff8f4d" : "#e9dcc3"} toneMapped={false} />
    </mesh>
  ))}</>;
}

function drawScreen(): THREE.CanvasTexture {
  const W = 256, H = 532, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0c0a09"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#a69d93"; g.font = "500 13px Inter, system-ui, sans-serif"; g.fillText("Habari za jioni, Mama Mary", 18, 40);
  g.fillStyle = "#a69d93"; g.font = "600 10px Inter, system-ui"; g.fillText("FAIDA · LEO", 18, 78);
  g.fillStyle = "#3e9b4f"; g.font = "700 38px Inter, system-ui"; g.fillText("KSh 4,820", 18, 120);
  const bars = [38, 52, 44, 70, 61, 84, 58];
  bars.forEach((h, i) => { g.fillStyle = i === 5 ? "#ff6b2c" : "#2a2522"; g.beginPath(); g.roundRect(18 + i * 32, 210 - h, 22, h, 5); g.fill(); });
  const rows: [string, string, string][] = [["Otieno · deni", "KSh 250", "#e5484d"], ["M-Pesa · Wanjiku", "+KSh 130", "#3e9b4f"], ["Oda KB-1042", "KSh 360", "#f5f0ea"], ["Gas 13kg", "−KSh 3,200", "#c99a5b"]];
  rows.forEach(([a, b, col], i) => {
    const y = 240 + i * 52;
    g.fillStyle = "#171412"; g.beginPath(); g.roundRect(14, y, W - 28, 44, 12); g.fill();
    g.fillStyle = "#f5f0ea"; g.font = "500 13px Inter, system-ui"; g.fillText(a, 28, y + 27);
    g.fillStyle = col; g.font = "700 13px Inter, system-ui"; g.textAlign = "right"; g.fillText(b, W - 26, y + 27); g.textAlign = "left";
  });
  g.fillStyle = "#ff6b2c"; g.beginPath(); g.roundRect(W - 72, H - 84, 54, 54, 16); g.fill();
  g.fillStyle = "#1a0d06"; g.font = "700 30px Inter, system-ui"; g.fillText("+", W - 54, H - 47);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

function Phone() {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(drawScreen, []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current) { ref.current.position.y = 2.05 + Math.sin(t * 1.1) * 0.09; ref.current.rotation.y = -0.42 + Math.sin(t * 0.5) * 0.07; }
  });
  return (
    <group ref={ref} position={[1.75, 2.05, 0.7]} rotation={[0.02, -0.42, 0.07]}>
      <mesh><boxGeometry args={[0.98, 1.98, 0.08]} /><meshStandardMaterial color="#141110" metalness={0.6} roughness={0.28} /></mesh>
      <mesh position={[0, 0, 0.041]}><planeGeometry args={[0.89, 1.86]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <pointLight position={[0, 0, 0.6]} color="#ffd9b8" intensity={0.6} distance={2} />
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    const ty = Math.sin(t * 0.12) * 0.1 + pointer.x * 0.052; // ±3°
    const tx = pointer.y * 0.035;
    g.current.rotation.y += (ty - g.current.rotation.y) * 0.04;
    g.current.rotation.x += (-tx - g.current.rotation.x) * 0.04;
  });
  return <group ref={g}>{children}</group>;
}

export default function HeroScene({ lite = false, active = true }: { lite?: boolean; active?: boolean }) {
  return (
    <Canvas
      dpr={lite ? [1, 1.25] : [1, 1.75]} frameloop={active ? "always" : "never"}
      camera={{ position: lite ? [0.4, 2.6, 6.4] : [-0.2, 2.4, 5.6], fov: 42 }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      eventSource={typeof document !== "undefined" ? document.body : undefined}
      onCreated={({ camera }) => camera.lookAt(lite ? 0.6 : 0.9, 1.45, 0)}
    >
      <color attach="background" args={["#0c0a09"]} />
      <fog attach="fog" args={["#0c0a09", 6, 14]} />
      <ambientLight intensity={0.18} color="#ffe2c4" />
      <directionalLight position={[-4, 6, 3]} intensity={0.25} color="#c9d4dc" />
      <Rig>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[12, 32]} /><meshStandardMaterial color="#14100e" roughness={1} /></mesh>
        <Jiko />
        <Steam count={lite ? 10 : 22} />
        <Phone />
        <Kibanda position={[-3.4, 0, -2.6]} rot={0.35} />
        <Kibanda position={[3.6, 0, -3]} rot={-0.4} />
        <StringLights />
      </Rig>
    </Canvas>
  );
}