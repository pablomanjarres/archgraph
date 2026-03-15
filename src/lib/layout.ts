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
    children: nodes.map((node) => ({
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
      ...(node.parentId ? { parent: node.parentId } : {}),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  // Build hierarchy: assign children to parent nodes
  const childMap = new Map<string, typeof elkGraph.children>();
  for (const child of elkGraph.children) {
    if ("parent" in child && child.parent) {
      if (!childMap.has(child.parent)) childMap.set(child.parent, []);
      childMap.get(child.parent)!.push(child);
    }
  }

  // Restructure: move children inside parent nodes
  const topLevel = elkGraph.children.filter(
    (c) => !("parent" in c) || !c.parent,
  );
  for (const node of elkGraph.children) {
    const kids = childMap.get(node.id);
    if (kids) {
      (node as any).children = kids;
    }
  }
  elkGraph.children = topLevel;

  const layout = await elk.layout(elkGraph as any);

  const positionMap = new Map<string, { x: number; y: number }>();

  function extractPositions(
    elkNode: any,
    offsetX = 0,
    offsetY = 0,
  ) {
    if (elkNode.children) {
      for (const child of elkNode.children) {
        const x = (child.x ?? 0) + offsetX;
        const y = (child.y ?? 0) + offsetY;
        positionMap.set(child.id, { x, y });
        if (child.children) {
          extractPositions(child, x, y);
        }
      }
    }
  }

  extractPositions(layout);

  return nodes.map((node) => {
    const pos = positionMap.get(node.id);
    if (pos) {
      return { ...node, position: pos };
    }
    return node;
  });
}
