import { useEffect, useRef } from "react";
import { loadModel } from "../lib/load-model";
import { useGraphStore } from "../store/useGraphStore";

const POLL_INTERVAL = 2000;

export function useFileWatcher() {
  const setModel = useGraphStore((s) => s.setModel);
  const lastHash = useRef<string>("");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const model = await loadModel();
        const hash = JSON.stringify(model);
        if (hash !== lastHash.current) {
          lastHash.current = hash;
          setModel(model);
        }
      } catch {
        // ignore — model might not exist yet
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [setModel]);
}
