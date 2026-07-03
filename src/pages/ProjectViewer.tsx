import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "../components/Canvas";
import { LayeredCanvas } from "../components/LayeredCanvas";
import { Scene3D } from "../components/Scene3D";
import { TopBar } from "../components/bars/TopBar";
import { BottomBar } from "../components/bars/BottomBar";
import { LeftSidebar } from "../components/bars/LeftSidebar";
import { DetailPanel } from "../components/panels/DetailPanel";
import { useGraphStore } from "../store/useGraphStore";
import { loadModel } from "../lib/load-model";
import { useFileWatcher } from "../hooks/useFileWatcher";

export default function ProjectViewer() {
  const { projectId } = useParams<{ projectId: string }>();
  const setModel = useGraphStore((s) => s.setModel);
  const setError = useGraphStore((s) => s.setError);
  const reset = useGraphStore((s) => s.reset);
  const viewMode = useGraphStore((s) => s.viewMode);

  useEffect(() => {
    reset();
    loadModel(projectId)
      .then(setModel)
      .catch((err) => setError(err.message));
  }, [projectId, setModel, setError, reset]);

  useFileWatcher(projectId);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 relative">
            {viewMode === "flat" && <Canvas />}
            {viewMode === "layered" && <LayeredCanvas />}
            {viewMode === "3d" && <Scene3D />}
          </div>
          <DetailPanel />
        </div>
        <BottomBar />
      </div>
    </ReactFlowProvider>
  );
}
