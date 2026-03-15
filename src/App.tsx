import { useEffect } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./components/Canvas";
import { TopBar } from "./components/bars/TopBar";
import { BottomBar } from "./components/bars/BottomBar";
import { LeftSidebar } from "./components/bars/LeftSidebar";
import { DetailPanel } from "./components/panels/DetailPanel";
import { useGraphStore } from "./store/useGraphStore";
import { loadModel } from "./lib/load-model";
import { useFileWatcher } from "./hooks/useFileWatcher";

export default function App() {
  const setModel = useGraphStore((s) => s.setModel);
  const setError = useGraphStore((s) => s.setError);

  useEffect(() => {
    loadModel()
      .then(setModel)
      .catch((err) => setError(err.message));
  }, [setModel, setError]);

  useFileWatcher();

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 relative">
            <Canvas />
          </div>
          <DetailPanel />
        </div>
        <BottomBar />
      </div>
    </ReactFlowProvider>
  );
}
