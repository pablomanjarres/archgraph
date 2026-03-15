import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
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

export function Canvas() {
  const model = useGraphStore((s) => s.model);
  const error = useGraphStore((s) => s.error);
  const activeDiagramId = useGraphStore((s) => s.activeDiagramId);
  const selectObject = useGraphStore((s) => s.selectObject);
  const showMinimap = useGraphStore((s) => s.showMinimap);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDone, setLayoutDone] = useState(false);

  const diagram = useMemo(
    () => model?.diagrams.find((d) => d.id === activeDiagramId),
    [model, activeDiagramId],
  );

  useEffect(() => {
    if (!model) return;

    const { nodes: rawNodes, edges: rawEdges } = modelToReactFlow(
      model,
      diagram,
    );

    const hasPositions =
      diagram?.positions &&
      Object.keys(diagram.positions).length > 0;

    if (hasPositions) {
      setNodes(rawNodes);
      setEdges(rawEdges);
      setLayoutDone(true);
    } else {
      layoutGraph(rawNodes, rawEdges).then((layoutedNodes) => {
        setNodes(layoutedNodes);
        setEdges(rawEdges);
        setLayoutDone(true);
      });
    }
  }, [model, diagram, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!node.data.isGroup) {
        selectObject(node.id);
      }
    },
    [selectObject],
  );

  const onPaneClick = useCallback(() => {
    selectObject(null);
  }, [selectObject]);

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!model) {
    return <EmptyState message="Loading model..." />;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView={layoutDone}
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="#333"
      />
      <Controls position="bottom-left" />
      {showMinimap && (
        <MiniMap
          position="bottom-right"
          nodeColor="#444"
          maskColor="rgba(0,0,0,0.6)"
        />
      )}
    </ReactFlow>
  );
}
