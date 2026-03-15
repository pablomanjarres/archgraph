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

  // Build flat list first
  const elkChildren = nodes.map((node) => ({
    id: node.id,
    width: node.data.isGroup ? undefined : (node.width ?? DEFAULT_NODE_WIDTH),
    height: node.data.isGroup
      ? undefined
      : (node.height ?? DEFAULT_NODE_HEIGHT),
    ...(parentIds.has(node.id)
      ? {
          layoutOptions: {
            "elk.padding": `[top=${GROUP_PADDING},left=40,bottom=20,right=40]`,
          },
        }
      : {}),
    _parentId: node.parentId,
  }));

  // Build hierarchy: group children under parents
  const childMap = new Map<string, any[]>();
  for (const child of elkChildren) {
    if (child._parentId) {
      if (!childMap.has(child._parentId)) childMap.set(child._parentId, []);
      childMap.get(child._parentId)!.push(child);
    }
  }

  const topLevel = elkChildren.filter((c) => !c._parentId);
  for (const node of elkChildren) {
    const kids = childMap.get(node.id);
    if (kids) {
      (node as any).children = kids;
    }
  }

  const elkGraph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "80",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.padding": `[top=${GROUP_PADDING},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
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
