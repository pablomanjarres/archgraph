import { create } from "zustand";
import type {
  ArchGraphModel,
  ModelObject,
  Connection,
  Diagram,
} from "../types/model";

interface GraphState {
  model: ArchGraphModel | null;
  error: string | null;
  selectedObjectId: string | null;
  activeDiagramId: string | null;
  showMinimap: boolean;

  setModel: (model: ArchGraphModel) => void;
  setError: (error: string) => void;
  selectObject: (id: string | null) => void;
  setActiveDiagram: (id: string | null) => void;
  toggleMinimap: () => void;
  reset: () => void;

  // Derived helpers
  getObject: (id: string) => ModelObject | undefined;
  getConnectionsFor: (objectId: string) => Connection[];
  getActiveDiagram: () => Diagram | undefined;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  model: null,
  error: null,
  selectedObjectId: null,
  activeDiagramId: null,
  showMinimap: false,

  setModel: (model) =>
    set({
      model,
      activeDiagramId: model.diagrams[0]?.id ?? null,
      error: null,
    }),
  setError: (error) => set({ error }),
  selectObject: (id) => set({ selectedObjectId: id }),
  setActiveDiagram: (id) => set({ activeDiagramId: id }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  reset: () =>
    set({
      model: null,
      error: null,
      selectedObjectId: null,
      activeDiagramId: null,
    }),

  getObject: (id) => get().model?.objects.find((o) => o.id === id),
  getConnectionsFor: (objectId) =>
    get().model?.connections.filter(
      (c) => c.sourceId === objectId || c.targetId === objectId,
    ) ?? [],
  getActiveDiagram: () => {
    const { model, activeDiagramId } = get();
    return model?.diagrams.find((d) => d.id === activeDiagramId);
  },
}));
