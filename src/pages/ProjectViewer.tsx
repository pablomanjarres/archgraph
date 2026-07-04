import { lazy, Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "../components/Canvas";
import { LayeredCanvas } from "../components/LayeredCanvas";
import { TopBar } from "../components/bars/TopBar";
import { BottomBar } from "../components/bars/BottomBar";
import { LeftSidebar } from "../components/bars/LeftSidebar";
import { DetailPanel } from "../components/panels/DetailPanel";
import { useGraphStore } from "../store/useGraphStore";
import { loadModel } from "../lib/load-model";
import { useFileWatcher } from "../hooks/useFileWatcher";

// three.js / r3f / drei (~2MB) load only when a user opens the 3D view, keeping
// them out of the main bundle for flat/layered visitors.
const Scene3D = lazy(() => import("../components/Scene3D"));

function Scene3DFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0A1626] text-sm text-cyan-300/70">
      <span className="flex items-center gap-2">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        Loading 3D scene…
      </span>
    </div>
  );
}

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
            {viewMode === "3d" && (
              <Suspense fallback={<Scene3DFallback />}>
                <Scene3D />
              </Suspense>
            )}
          </div>
          <DetailPanel />
        </div>
        <BottomBar />
      </div>
    </ReactFlowProvider>
  );
}
