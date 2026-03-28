import ELK from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "@xyflow/react";

const elk = new ELK();

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 120;
const GROUP_PADDING = 60;

export async function layoutGraph(
  nodes: Node[],
  edges: Edge[],
): Promise<Node[]> {
  const parentIds = new Set(
    nodes.filter((n) => n.data.isGroup).map((n) => n.id),
  );
  const hasGroups = parentIds.size > 0;
  const nodeCount = nodes.filter((n) => !n.data.isGroup).length;

  // Build flat list first
  const elkChildren = nodes.map((node) => {
    const base: Record<string, unknown> = { id: node.id, _parentId: node.parentId };

    if (!node.data.isGroup) {
      base.width = node.width ?? DEFAULT_NODE_WIDTH;
      base.height = node.height ?? DEFAULT_NODE_HEIGHT;
    }

    if (parentIds.has(node.id)) {
      base.layoutOptions = {
        "elk.padding": `[top=${GROUP_PADDING},left=40,bottom=20,right=40]`,
      };
    }

    return base;
  });

  // Build hierarchy: group children under parents
  const childMap = new Map<string, Record<string, unknown>[]>();
  for (const child of elkChildren) {
    const pid = child._parentId as string | undefined;
    if (pid) {
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid)!.push(child);
    }
  }

  const topLevel = elkChildren.filter((c) => !c._parentId);
  for (const node of elkChildren) {
    const kids = childMap.get(node.id as string);
    if (kids) {
      (node as any).children = kids;
    }
  }

  // Pick algorithm based on graph characteristics:
  // - Large flat graphs (>80 nodes, no groups): use stress for compact 2D spread
  // - Hierarchical / smaller graphs: use layered for clean directional flow
  const useStress = nodeCount > 80 && !hasGroups;

  const layoutOptions: Record<string, string> = useStress
    ? {
        "elk.algorithm": "stress",
        "elk.stress.desiredEdgeLength": "200",
        "elk.spacing.nodeNode": "50",
        "elk.separateConnectedComponents": "true",
        "elk.aspectRatio": "1.8",
      }
    : {
        "elk.algorithm": "layered",
        "elk.direction": "RIGHT",
        "elk.spacing.nodeNode": "60",
        "elk.layered.spacing.nodeNodeBetweenLayers": "80",
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",
        "elk.separateConnectedComponents": "true",
        "elk.aspectRatio": "2.5",
      };

  layoutOptions["elk.padding"] =
    `[top=${GROUP_PADDING},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`;

  const elkGraph = {
    id: "root",
    layoutOptions,
    children: topLevel,
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(elkGraph as any);

  // Extract positions — for ReactFlow, children positions are relative to parent
  // ELK already returns positions relative to the parent, which is what ReactFlow expects
  const positionMap = new Map<
    string,
    { x: number; y: number; width?: number; height?: number }
  >();

  function extractPositions(elkNode: any) {
    if (elkNode.children) {
      for (const child of elkNode.children) {
        positionMap.set(child.id, {
          x: child.x ?? 0,
          y: child.y ?? 0,
          width: child.width,
          height: child.height,
        });
        if (child.children) {
          extractPositions(child);
        }
      }
    }
  }

  extractPositions(layout);

  return nodes.map((node) => {
    const pos = positionMap.get(node.id);
    if (pos) {
      const updated: Node = {
        ...node,
        position: { x: pos.x, y: pos.y },
      };
      // Set group dimensions from ELK
      if (node.data.isGroup && pos.width && pos.height) {
        updated.style = {
          ...node.style,
          width: pos.width,
          height: pos.height,
        };
      }
      return updated;
    }
    return node;
  });
}
