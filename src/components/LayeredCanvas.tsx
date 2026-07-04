import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { layeredNodeTypes, TIER_ICON } from "./nodes/TierCard";
import { layeredEdgeTypes } from "./edges/BlueprintEdge";
import { useGraphStore } from "../store/useGraphStore";
import { modelToReactFlow } from "../lib/model-to-reactflow";
import { layoutGraph } from "../lib/layout";
import { EmptyState } from "./EmptyState";
import { TIER_ORDER, getTierTheme, tierIndex, edgeStyle } from "../lib/tierTheme";

// Approximate rendered card footprint, matching the ELK layout defaults.
const NODE_W = 224;
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

/** Re-type ELK edges as blueprint edges: coloured arrowheads via edgeStyle. */
function toBlueprintEdges(edges: Edge[]): Edge[] {
  return edges.map((e) => {
    const es = edgeStyle(
      (e.data?.type ?? e.data?.connectionType) as string | undefined,
    );
    return {
      ...e,
      type: "blueprintEdge",
      // Flow is handled by BlueprintEdge's own class, not ReactFlow's dashdraw.
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: es.stroke,
        width: 16,
        height: 16,
      },
    };
  });
}

/**
 * Premium 2D "blueprint" renderer: the flat object set laid out into
 * architectural tiers (people on top → data stores at the bottom) over a navy
 * drafting sheet, with tier-aware cards, typed/animated edges and depth-shaded
 * tier lanes. Selection is shared with the flat and 3D views.
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
    const blueprintEdges = toBlueprintEdges(rawEdges);

    // Tiers replace group containers, so flatten: drop group backdrops and
    // detach any parent relationships before the tiered layout.
    const flatNodes = rawNodes
      .filter((n) => !n.data.isGroup)
      .map((n) => ({ ...n, parentId: undefined, extent: undefined }));

    layoutGraph(flatNodes, rawEdges, { tiered: true })
      .then((laidOut) => {
        if (cancelled) return;
        setNodes(laidOut);
        setEdges(blueprintEdges);
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
        setEdges(blueprintEdges);
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

  const activeTiers = TIER_ORDER.filter((t) => bands.some((b) => b.type === t));

  return (
    <div className="blueprint relative h-full w-full bg-[#0A1626]">
      <TierLanes bands={bands} bounds={bounds} />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={layeredNodeTypes}
        edgeTypes={layeredEdgeTypes}
        proOptions={{ hideAttribution: true }}
        minZoom={0.1}
        maxZoom={2}
        style={{ backgroundColor: "transparent" }}
      >
        {/* Faint cyan drafting grid — minor cells + heavier section lines. */}
        <Background
          id="bp-grid-minor"
          variant={BackgroundVariant.Lines}
          gap={28}
          lineWidth={1}
          color="rgba(56, 189, 248, 0.05)"
        />
        <Background
          id="bp-grid-major"
          variant={BackgroundVariant.Lines}
          gap={140}
          lineWidth={1}
          color="rgba(56, 189, 248, 0.12)"
        />
        <Controls position="bottom-left" />
        {activeTiers.length > 0 && (
          <Panel position="top-left">
            <div className="rounded-lg border border-cyan-400/20 bg-[#0b1a2c]/90 px-3 py-2 shadow-xl backdrop-blur">
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-cyan-300/80">
                <span className="inline-block h-1.5 w-1.5 rounded-sm bg-cyan-400" />
                Architecture tiers
              </div>
              <div className="flex flex-col gap-1">
                {activeTiers.map((t) => {
                  const theme = getTierTheme(t);
                  const Icon = TIER_ICON[t];
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded"
                        style={{ background: `${theme.color}22` }}
                      >
                        {Icon && <Icon size={11} style={{ color: theme.color }} />}
                      </span>
                      <span className="text-xs text-slate-300">
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
      {/* Vignette for drafting-sheet depth. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 38%, transparent 55%, rgba(3, 9, 18, 0.6) 100%)",
        }}
      />
    </div>
  );
}

/** Depth-shaded tier bands + pinned, iconed labels, tracking the viewport. */
function TierLanes({ bands, bounds }: { bands: TierBand[]; bounds: Bounds }) {
  const { x, y, zoom } = useViewport();
  if (bands.length === 0) return null;

  const left = bounds.minX - 4000;
  const width = bounds.maxX - bounds.minX + 8000;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Scaled fills, aligned to the flow coordinate system. */}
      <div
        className="absolute left-0 top-0"
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
              background: `linear-gradient(180deg, ${b.color}16 0%, transparent 24%, transparent 76%, ${b.color}0e 100%), linear-gradient(90deg, ${b.band} 0%, ${b.color}0a 32%, transparent 64%)`,
              borderTop: `1px solid ${b.color}45`,
              boxShadow: `inset 0 1px 0 ${b.color}26`,
            }}
          />
        ))}
      </div>
      {/* Fixed-size labels tracking each band's top edge. */}
      <div className="absolute inset-0">
        {bands.map((b) => {
          const Icon = TIER_ICON[b.type];
          return (
            <div
              key={b.type}
              className="absolute left-3"
              style={{ top: b.yStart * zoom + y + 6 }}
            >
              <span
                className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  color: b.color,
                  backgroundColor: `${b.color}1c`,
                  boxShadow: `inset 0 0 0 1px ${b.color}30`,
                }}
              >
                {Icon && <Icon size={12} />}
                {b.label}
              </span>
            </div>
          );
        })}
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
