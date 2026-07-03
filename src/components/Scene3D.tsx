import { useEffect, useMemo, useState } from "react";
import { Canvas as R3FCanvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Line, Billboard } from "@react-three/drei";
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
} from "../lib/tierTheme";

type Vec3 = [number, number, number];

// World-space tuning.
const NODE_W = 6;
const NODE_H = 2.6;
const NODE_D = 4;
const LAYER_GAP = 14;
const PLANAR_SCALE = 0.11;

interface PlacedNode {
  id: string;
  name: string;
  type: string;
  pos: Vec3;
}

interface Link {
  key: string;
  points: [Vec3, Vec3];
  dashed: boolean;
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
 * 3D renderer: the planar layout is lifted into stacked architectural floors
 * (actors on top → data stores at the bottom). Connections rise and fall
 * between the layers, and clicking a node drives the shared selection store.
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
          position: { x: (i % 5) * 260, y: (Math.floor(i / 5)) * 200 },
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
      <div className="w-full h-full bg-[#0b0b0f] flex items-center justify-center text-neutral-500 text-sm">
        {model ? "Building 3D scene…" : "Loading model..."}
      </div>
    );
  }

  const { extent, midY } = data;
  const camDist = Math.max(extent, 60);

  return (
    <div className="w-full h-full bg-[#0b0b0f]">
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
        <color attach="background" args={["#0b0b0f"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[30, 60, 30]} intensity={1.1} />
        <pointLight position={[-40, 30, -30]} intensity={0.4} />

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
          <Line
            key={l.key}
            points={l.points}
            color="#52525b"
            lineWidth={1}
            dashed={l.dashed}
            dashSize={1.4}
            gapSize={0.8}
          />
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

  return (
    <group position={node.pos}>
      <mesh
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
        <boxGeometry args={[NODE_W, NODE_H, NODE_D]} />
        <meshStandardMaterial
          color={theme.color}
          emissive={theme.glow}
          emissiveIntensity={selected ? 1.0 : hovered ? 0.6 : 0.25}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>
      <Billboard position={[0, NODE_H / 2 + 1.2, 0]}>
        <Text
          fontSize={0.85}
          color="#f4f4f5"
          anchorX="center"
          anchorY="middle"
          maxWidth={12}
          outlineWidth={0.035}
          outlineColor="#000000"
        >
          {node.name}
        </Text>
      </Billboard>
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
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[extent, extent]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        position={[-extent / 2 + 3, 0.06, -extent / 2 + 5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={3.2}
        color={color}
        anchorX="left"
        anchorY="top"
        fillOpacity={0.5}
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
    const status = (e.data as { status?: string } | undefined)?.status;
    links.push({ key: e.id, points: [a, b], dashed: status === "future" });
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
