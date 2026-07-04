import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { edgeStyle } from "../../lib/tierTheme";

/**
 * Blueprint edge for the layered view: orthogonal smooth-step routing, colour
 * and weight driven by the connection type (`tierTheme.edgeStyle`), a soft glow,
 * an arrowhead, and a travelling flow for async / event links.
 */
export function BlueprintEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const style = edgeStyle(
    (data?.type ?? data?.connectionType) as string | undefined,
  );
  const label = data?.label as string | undefined;

  return (
    <>
      {/* Faint halo underneath for depth / glow. */}
      <path
        d={edgePath}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth + 4}
        strokeLinecap="round"
        style={{ opacity: 0.12 }}
      />
      <path
        id={id}
        className={`react-flow__edge-path${style.animated ? " bp-edge-flow" : ""}`}
        d={edgePath}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeLinecap="round"
        markerEnd={markerEnd}
        style={{
          strokeDasharray:
            style.dashed && !style.animated ? "7 5" : undefined,
          filter: `drop-shadow(0 0 3px ${style.stroke}55)`,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: `${style.stroke}55`,
              background: "rgba(10, 22, 38, 0.85)",
              color: "#cbd5e1",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const layeredEdgeTypes = {
  blueprintEdge: BlueprintEdge,
};
