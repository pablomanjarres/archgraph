import type { Node, Edge } from "@xyflow/react";
import type { ArchGraphModel, Diagram, Group, ModelObject } from "../types/model";

const ACCENT_COLORS: Record<string, string> = {
  actor: "#a855f7",
  system: "#3b82f6",
  app: "#14b8a6",
  store: "#f59e0b",
  component: "#71717a",
};

export function modelToReactFlow(
  model: ArchGraphModel,
  diagram?: Diagram,
): { nodes: Node[]; edges: Edge[] } {
  const visibleObjectIds = diagram
    ? new Set(diagram.objectIds)
    : new Set(model.objects.map((o) => o.id));
  const visibleConnectionIds = diagram
    ? new Set(diagram.connectionIds)
    : new Set(model.connections.map((c) => c.id));

  // Find groups that have visible objects
  const activeGroups = model.groups.filter((g) =>
    g.objectIds.some((id) => visibleObjectIds.has(id)),
  );

  // Build group nodes
  const groupNodes: Node[] = activeGroups.map((group) => ({
    id: group.id,
    type: "groupNode",
    position: { x: 0, y: 0 },
    data: {
      label: group.name,
      isGroup: true,
      group,
    },
    style: {
      width: "auto",
      height: "auto",
    },
  }));

  // Map object→group for parenting
  const objectGroupMap = new Map<string, string>();
  for (const group of activeGroups) {
    for (const objId of group.objectIds) {
      if (!objectGroupMap.has(objId)) {
        objectGroupMap.set(objId, group.id);
      }
    }
  }

  // Build object nodes
  const objectNodes: Node[] = model.objects
    .filter((obj) => visibleObjectIds.has(obj.id))
    .map((obj) => {
      const nodeType = `${obj.type}Node`;
      const groupId = objectGroupMap.get(obj.id);
      const pos = diagram?.positions?.[obj.id] ?? { x: 0, y: 0 };

      return {
        id: obj.id,
        type: nodeType,
        position: pos,
        parentId: groupId,
        extent: groupId ? ("parent" as const) : undefined,
        data: {
          ...obj,
          accent: ACCENT_COLORS[obj.type] ?? "#71717a",
        },
      };
    });

  // Build edges
  const edges: Edge[] = model.connections
    .filter((conn) => visibleConnectionIds.has(conn.id))
    .filter(
      (conn) =>
        visibleObjectIds.has(conn.sourceId) &&
        visibleObjectIds.has(conn.targetId),
    )
    .map((conn) => ({
      id: conn.id,
      source: conn.sourceId,
      target: conn.targetId,
      type: "labeledEdge",
      data: {
        label: conn.label,
        connectionType: conn.type,
        status: conn.status,
      },
      animated: conn.type === "async" || conn.type === "event",
    }));

  return {
    nodes: [...groupNodes, ...objectNodes],
    edges,
  };
}
