import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges/LabeledEdge";
import { useGraphStore } from "../store/useGraphStore";
import { modelToReactFlow } from "../lib/model-to-reactflow";
import { layoutGraph } from "../lib/layout";
import { EmptyState } from "./EmptyState";
import { TIER_ORDER, getTierTheme, tierIndex } from "../lib/tierTheme";

// Approximate rendered card footprint, matching the ELK layout defaults.
const NODE_W = 220;
const NODE_H = 120;
const BAND_PAD = 44;

interface TierBand {
  type: string;
  label: string;
  color: string;
  band: string;
  yStart: number;
  yEnd: number;
}

interface Bounds {
  minX: number;
  maxX: number;
}

/**
 * Premium 2D renderer: the flat node/edge set laid out into architectural
 * tiers (actors on top → data stores at the bottom) over translucent,
 * viewport-tracked tier lanes.
 */
export function LayeredCanvas() {
  const model = useGraphStore((s) => s.model);
  const error = useGraphStore((s) => s.error);
  const activeDiagramId = useGraphStore((s) => s.activeDiagramId);
  const selectObject = useGraphStore((s) => s.selectObject);
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [bands, setBands] = useState<TierBand[]>([]);
  const [bounds, setBounds] = useState<Bounds>({ minX: 0, maxX: 0 });

  const diagram = useMemo(
    () => model?.diagrams.find((d) => d.id === activeDiagramId),
    [model, activeDiagramId],
  );

  useEffect(() => {
    if (!model) return;
    let cancelled = false;

    const { nodes: rawNodes, edges: rawEdges } = modelToReactFlow(
      model,
      diagram,
    );

    // Tiers replace group containers, so flatten: drop group backdrops and
    // detach any parent relationships before the tiered layout.
    const flatNodes = rawNodes
      .filter((n) => !n.data.isGroup)
      .map((n) => ({ ...n, parentId: undefined, extent: undefined }));

    layoutGraph(flatNodes, rawEdges, { tiered: true })
      .then((laidOut) => {
        if (cancelled) return;
        setNodes(laidOut);
        setEdges(rawEdges);
        setBands(computeBands(laidOut));
        setBounds(computeBounds(laidOut));
        requestAnimationFrame(() => fitView({ padding: 0.2 }));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Tiered layout failed, using fallback:", err);
        // Last-resort fallback: stack tiers vertically, spread within a tier.
        const perTierCount = new Map<number, number>();
        const fallback = flatNodes.map((n) => {
          const t = tierIndex(n.data.type as string);
          const col = perTierCount.get(t) ?? 0;
          perTierCount.set(t, col + 1);
          return { ...n, position: { x: col * 260, y: t * 220 } };
        });
        setNodes(fallback);
        setEdges(rawEdges);
        setBands(computeBands(fallback));
        setBounds(computeBounds(fallback));
        requestAnimationFrame(() => fitView({ padding: 0.2 }));
      });

    return () => {
      cancelled = true;
    };
  }, [model, diagram, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!node.data.isGroup) selectObject(node.id);
    },
    [selectObject],
  );
  const onPaneClick = useCallback(() => selectObject(null), [selectObject]);

  if (error) return <EmptyState message={error} />;
  if (!model) return <EmptyState message="Loading model..." />;

  const activeTiers = TIER_ORDER.filter((t) =>
    bands.some((b) => b.type === t),
  );

  return (
    <div className="relative w-full h-full bg-[#181818]">
      <TierLanes bands={bands} bounds={bounds} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
        style={{ backgroundColor: "transparent" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#2a2a2a"
        />
        <Controls position="bottom-left" />
        {activeTiers.length > 0 && (
          <Panel position="top-left">
            <div className="rounded-lg border border-[#333] bg-[#1e1e1e]/90 backdrop-blur px-3 py-2 shadow-xl">
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1.5">
                Tiers
              </div>
              <div className="flex flex-col gap-1">
                {activeTiers.map((t) => {
                  const theme = getTierTheme(t);
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span className="text-xs text-neutral-300">
                        {theme.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

/** Translucent tier bands + pinned labels, tracking the flow viewport. */
function TierLanes({ bands, bounds }: { bands: TierBand[]; bounds: Bounds }) {
  const { x, y, zoom } = useViewport();
  if (bands.length === 0) return null;

  const left = bounds.minX - 4000;
  const width = bounds.maxX - bounds.minX + 8000;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Scaled fills, aligned to the flow coordinate system. */}
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {bands.map((b) => (
          <div
            key={b.type}
            className="absolute"
            style={{
              left,
              width,
              top: b.yStart,
              height: b.yEnd - b.yStart,
              background: `linear-gradient(90deg, ${b.band} 0%, transparent 55%)`,
              borderTop: `1px solid ${b.color}33`,
            }}
          />
        ))}
      </div>
      {/* Fixed-size labels tracking each band's top edge. */}
      <div className="absolute inset-0">
        {bands.map((b) => (
          <div
            key={b.type}
            className="absolute left-3"
            style={{ top: b.yStart * zoom + y + 6 }}
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ color: b.color, backgroundColor: `${b.color}18` }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeBands(nodes: Node[]): TierBand[] {
  const byTier = new Map<string, { min: number; max: number }>();
  for (const n of nodes) {
    if (n.data.isGroup) continue;
    const type = n.data.type as string;
    const yTop = n.position.y;
    const yBottom = n.position.y + NODE_H;
    const cur = byTier.get(type);
    if (!cur) byTier.set(type, { min: yTop, max: yBottom });
    else {
      cur.min = Math.min(cur.min, yTop);
      cur.max = Math.max(cur.max, yBottom);
    }
  }
  return TIER_ORDER.filter((t) => byTier.has(t)).map((t) => {
    const { min, max } = byTier.get(t)!;
    const theme = getTierTheme(t);
    return {
      type: t,
      label: theme.label,
      color: theme.color,
      band: theme.band,
      yStart: min - BAND_PAD,
      yEnd: max + BAND_PAD,
    };
  });
}

function computeBounds(nodes: Node[]): Bounds {
  const objects = nodes.filter((n) => !n.data.isGroup);
  if (objects.length === 0) return { minX: 0, maxX: 0 };
  let minX = Infinity;
  let maxX = -Infinity;
  for (const n of objects) {
    minX = Math.min(minX, n.position.x);
    maxX = Math.max(maxX, n.position.x + NODE_W);
  }
  return { minX, maxX };
}
