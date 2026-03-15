import { Search, ChevronRight } from "lucide-react";
import { useGraphStore } from "../../store/useGraphStore";

export function TopBar() {
  const model = useGraphStore((s) => s.model);
  const activeDiagramId = useGraphStore((s) => s.activeDiagramId);
  const setActiveDiagram = useGraphStore((s) => s.setActiveDiagram);

  const diagram = model?.diagrams.find((d) => d.id === activeDiagramId);

  return (
    <div className="h-11 border-b border-[#333] bg-[#1e1e1e] flex items-center px-4 gap-3 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-neutral-400">
          {model?.metadata.projectName ?? "archgraph"}
        </span>
        <ChevronRight size={14} className="text-neutral-600" />
        {/* Diagram selector */}
        {model && model.diagrams.length > 1 ? (
          <select
            value={activeDiagramId ?? ""}
            onChange={(e) => setActiveDiagram(e.target.value)}
            className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer"
          >
            {model.diagrams.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#262626]">
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-white font-medium">
            {diagram?.name ?? "Diagram"}
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Search placeholder */}
      <button className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#262626] border border-[#333] text-neutral-500 text-xs hover:border-neutral-500 transition-colors">
        <Search size={12} />
        <span>Search</span>
        <kbd className="text-[10px] px-1 py-0.5 rounded bg-neutral-700 text-neutral-400 ml-2">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
