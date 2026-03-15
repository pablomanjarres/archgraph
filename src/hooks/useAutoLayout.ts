import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { layoutGraph } from "../lib/layout";

export function useAutoLayout() {
  const { getNodes, getEdges, setNodes } = useReactFlow();

  const runLayout = useCallback(async () => {
    const nodes = getNodes();
    const edges = getEdges();
    const layoutedNodes = await layoutGraph(nodes, edges);
    setNodes(layoutedNodes);
  }, [getNodes, getEdges, setNodes]);

  return { runLayout };
}
