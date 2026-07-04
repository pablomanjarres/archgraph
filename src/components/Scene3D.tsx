import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas as R3FCanvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Line,
  Billboard,
  Stars,
  Grid,
  RoundedBox,
  Edges,
} from "@react-three/drei";
import * as THREE from "three";
import type { Node, Edge } from "@xyflow/react";
import { useGraphStore } from "../store/useGraphStore";
import { modelToReactFlow } from "../lib/model-to-reactflow";
import { layoutGraph } from "../lib/layout";
import { EmptyState } from "./EmptyState";
import {
  TIER_ORDER,
  TIER_COUNT,
  getTierTheme,
  tierIndex,
  edgeStyle,
} from "../lib/tierTheme";

type Vec3 = [number, number, number];

// World-space tuning.
const NODE_W = 6;
const NODE_H = 2.6;
const NODE_D = 4;
const LAYER_GAP = 14;
const PLANAR_SCALE = 0.11;

const BG = "#0A1626";

interface PlacedNode {
  id: string;
  name: string;
  type: string;
  pos: Vec3;
}

interface Link {
  key: string;
  points: [Vec3, Vec3];
  color: string;
  dashed: boolean;
  animated: boolean;
}

interface Floor {
  type: string;
  label: string;
  color: string;
  y: number;
}

interface SceneData {
  nodes: PlacedNode[];
  links: Link[];
  floors: Floor[];
  extent: number;
  midY: number;
}

/**
 * 3D "blueprint" renderer: the planar layout is lifted into stacked
 * architectural floors (people on top → data stores at the bottom) over a navy
 * void with a faint starfield and drafting grid. Typed connections glow and
 * async / event links carry a travelling pulse. Clicking a node drives the
 * shared selection store.
 */
export function Scene3D() {
  const model = useGraphStore((s) => s.model);
  const error = useGraphStore((s) => s.error);
  const activeDiagramId = useGraphStore((s) => s.activeDiagramId);
  const selectObject = useGraphStore((s) => s.selectObject);
  const selectedObjectId = useGraphStore((s) => s.selectedObjectId);

  const [data, setData] = useState<SceneData | null>(null);

  const diagram = useMemo(
    () => model?.diagrams.find((d) => d.id === activeDiagramId),
    [model, activeDiagramId],
  );

  useEffect(() => {
    if (!model) {
      setData(null);
      return;
    }
    let cancelled = false;

    const { nodes: rawNodes, edges: rawEdges } = modelToReactFlow(
      model,
      diagram,
    );
    // 3D shows objects only; group containers are meaningless as solids.
    const flatNodes = rawNodes
      .filter((n) => !n.data.isGroup)
      .map((n) => ({ ...n, parentId: undefined, extent: undefined }));

    if (flatNodes.length === 0) {
      setData({ nodes: [], links: [], floors: [], extent: 60, midY: 0 });
      return;
    }

    layoutGraph(flatNodes, rawEdges)
      .then((laidOut) => {
        if (!cancelled) setData(buildScene(laidOut, rawEdges));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("3D layout failed, using fallback grid:", err);
        const fallback = flatNodes.map((n, i) => ({
          ...n,
          position: { x: (i % 5) * 260, y: Math.floor(i / 5) * 200 },
        }));
        setData(buildScene(fallback, rawEdges));
      });

    return () => {
      cancelled = true;
    };
  }, [model, diagram]);

  if (error) return <EmptyState message={error} />;
  if (!model || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0A1626] text-sm text-cyan-300/70">
        {model ? "Building 3D scene…" : "Loading model..."}
      </div>
    );
  }

  const { extent, midY } = data;
  const camDist = Math.max(extent, 60);
  const groundY =
    (data.floors.length ? Math.min(...data.floors.map((f) => f.y)) : 0) - 8;

  return (
    <div className="h-full w-full bg-[#0A1626]">
      <R3FCanvas
        camera={{
          position: [camDist * 0.8, midY + camDist * 0.75, camDist * 1.0],
          fov: 50,
          near: 0.1,
          far: camDist * 12,
        }}
        dpr={[1, 2]}
        onPointerMissed={() => selectObject(null)}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, camDist * 2.2, camDist * 6.5]} />

        <hemisphereLight args={["#9ec7ff", BG, 0.4]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[30, 60, 30]} intensity={1.0} />
        <pointLight position={[-40, 30, -30]} intensity={0.5} color="#38BDF8" />
        <pointLight position={[40, 12, 40]} intensity={0.3} color="#F5A524" />

        {/* Atmosphere: faint starfield + an infinite drafting ground grid. */}
        <Stars
          radius={extent * 1.4}
          depth={extent}
          count={2200}
          factor={extent * 0.045}
          saturation={0}
          fade
          speed={0.5}
        />
        <Grid
          position={[0, groundY, 0]}
          args={[extent * 2, extent * 2]}
          cellSize={extent * 0.05}
          cellThickness={0.6}
          cellColor="#123653"
          sectionSize={extent * 0.25}
          sectionThickness={1}
          sectionColor="#38BDF8"
          fadeDistance={extent * 3.2}
          fadeStrength={1.4}
          infiniteGrid
        />

        {data.floors.map((f) => (
          <TierFloor
            key={f.type}
            y={f.y}
            color={f.color}
            label={f.label}
            extent={extent}
          />
        ))}

        {data.links.map((l) => (
          <Edge3D key={l.key} link={l} />
        ))}

        {data.nodes.map((n) => (
          <Node3D
            key={n.id}
            node={n}
            selected={n.id === selectedObjectId}
            onSelect={selectObject}
          />
        ))}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          target={[0, midY, 0]}
          minDistance={10}
          maxDistance={camDist * 6}
        />
      </R3FCanvas>
    </div>
  );
}

function Node3D({
  node,
  selected,
  onSelect,
}: {
  node: PlacedNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const theme = getTierTheme(node.type);
  const [hovered, setHovered] = useState(false);
  const scale = selected ? 1.16 : hovered ? 1.08 : 1;
  const emissiveIntensity = selected ? 1.05 : hovered ? 0.7 : 0.32;

  return (
    <group position={node.pos}>
      <RoundedBox
        args={[NODE_W, NODE_H, NODE_D]}
        radius={0.35}
        smoothness={4}
        scale={scale}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={theme.color}
          emissive={theme.glow}
          emissiveIntensity={emissiveIntensity}
          metalness={0.45}
          roughness={0.32}
        />
        <Edges
          threshold={15}
          scale={1.001}
          color={selected ? "#E6EEF6" : theme.color}
        />
      </RoundedBox>

      {selected && <SelectionRing color={theme.color} />}

      <Billboard position={[0, NODE_H / 2 + 1.4, 0]}>
        <Text
          fontSize={0.85}
          color="#E6EEF6"
          anchorX="center"
          anchorY="middle"
          maxWidth={12}
          outlineWidth={0.035}
          outlineColor="#03060c"
        >
          {node.name}
        </Text>
      </Billboard>
    </group>
  );
}

/** Pulsing halo ring on the floor beneath the selected node. */
function SelectionRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const p = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
    ref.current.scale.set(p, p, 1);
  });
  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -NODE_H / 2 - 0.15, 0]}
    >
      <torusGeometry args={[NODE_W * 0.7, 0.12, 12, 60]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}

/** A connection: glowing core + halo, dashed for async/event, with a pulse. */
function Edge3D({ link }: { link: Link }) {
  return (
    <group>
      <Line
        points={link.points}
        color={link.color}
        lineWidth={5}
        transparent
        opacity={0.14}
      />
      <Line
        points={link.points}
        color={link.color}
        lineWidth={2}
        dashed={link.dashed}
        dashScale={1.4}
        dashSize={1.2}
        gapSize={0.9}
        transparent
        opacity={0.92}
        toneMapped={false}
      />
      {link.animated && (
        <FlowPulse a={link.points[0]} b={link.points[1]} color={link.color} />
      )}
    </group>
  );
}

/** A glowing dot travelling source → target, looping. */
function FlowPulse({ a, b, color }: { a: Vec3; b: Vec3; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const start = useMemo(() => new THREE.Vector3(a[0], a[1], a[2]), [a]);
  const end = useMemo(() => new THREE.Vector3(b[0], b[1], b[2]), [b]);
  const offset = useMemo(() => Math.random(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.elapsedTime * 0.32 + offset) % 1;
    ref.current.position.lerpVectors(start, end, t);
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.05, 12, 12]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function TierFloor({
  y,
  color,
  label,
  extent,
}: {
  y: number;
  color: string;
  label: string;
  extent: number;
}) {
  const half = extent / 2;
  const rect = useMemo<Vec3[]>(
    () => [
      [-half, 0, -half],
      [half, 0, -half],
      [half, 0, half],
      [-half, 0, half],
      [-half, 0, -half],
    ],
    [half],
  );

  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={rect} color={color} lineWidth={1} transparent opacity={0.35} />
      <Text
        position={[-half + 3, 0.06, -half + 5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={3.2}
        color={color}
        anchorX="left"
        anchorY="top"
        fillOpacity={0.55}
      >
        {label}
      </Text>
    </group>
  );
}

function buildScene(laidOut: Node[], edges: Edge[]): SceneData {
  const objects = laidOut.filter((n) => !n.data.isGroup);

  // Planar center so the stack is balanced around the origin.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of objects) {
    minX = Math.min(minX, n.position.x);
    maxX = Math.max(maxX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxY = Math.max(maxY, n.position.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const worldY = (type: string) =>
    (TIER_COUNT - 1 - tierIndex(type)) * LAYER_GAP;

  const posMap = new Map<string, Vec3>();
  const nodes: PlacedNode[] = objects.map((n) => {
    const type = n.data.type as string;
    const pos: Vec3 = [
      (n.position.x - cx) * PLANAR_SCALE,
      worldY(type),
      (n.position.y - cy) * PLANAR_SCALE,
    ];
    posMap.set(n.id, pos);
    return { id: n.id, name: (n.data.name as string) ?? n.id, type, pos };
  });

  const links: Link[] = [];
  for (const e of edges) {
    const a = posMap.get(e.source);
    const b = posMap.get(e.target);
    if (!a || !b) continue;
    const es = edgeStyle(
      (e.data?.type ?? e.data?.connectionType) as string | undefined,
    );
    links.push({
      key: e.id,
      points: [a, b],
      color: es.stroke,
      dashed: es.dashed,
      animated: es.animated,
    });
  }

  // Floor extent from the widest planar reach.
  let reach = 30;
  for (const n of nodes) {
    reach = Math.max(reach, Math.abs(n.pos[0]), Math.abs(n.pos[2]));
  }
  const extent = Math.max(60, reach * 2 + 24);

  const present = new Set(nodes.map((n) => n.type));
  const floors: Floor[] = TIER_ORDER.filter((t) => present.has(t)).map((t) => {
    const theme = getTierTheme(t);
    return { type: t, label: theme.label, color: theme.color, y: worldY(t) };
  });

  const midY = ((TIER_COUNT - 1) * LAYER_GAP) / 2;

  return { nodes, links, floors, extent, midY };
}

export default Scene3D;
