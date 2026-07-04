import { Search, ChevronRight, Network, Layers, Boxes } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useGraphStore, type ViewMode } from "../../store/useGraphStore";

const VIEW_MODES: { id: ViewMode; label: string; Icon: typeof Network }[] = [
  { id: "flat", label: "Flat", Icon: Network },
  { id: "layered", label: "Layered", Icon: Layers },
  { id: "3d", label: "3D", Icon: Boxes },
];

export function TopBar() {
  const { projectId } = useParams();
  const model = useGraphStore((s) => s.model);
  const activeDiagramId = useGraphStore((s) => s.activeDiagramId);
  const setActiveDiagram = useGraphStore((s) => s.setActiveDiagram);
  const viewMode = useGraphStore((s) => s.viewMode);
  const setViewMode = useGraphStore((s) => s.setViewMode);

  const diagram = model?.diagrams.find((d) => d.id === activeDiagramId);

  return (
    <div className="h-11 border-b border-[#333] bg-[#1e1e1e] flex items-center px-4 gap-3 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        {projectId && (
          <>
            <Link
              to="/"
              className="text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              archgraph
            </Link>
            <ChevronRight size={14} className="text-neutral-600" />
          </>
        )}
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

      {/* View-mode segmented control */}
      <div className="flex items-center rounded-md border border-[#333] bg-[#262626] p-0.5">
        {VIEW_MODES.map(({ id, label, Icon }) => {
          const active = viewMode === id;
          return (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              aria-pressed={active}
              title={`${label} view`}
              className={
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors " +
                (active
                  ? "bg-[#3a3a3a] text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200")
              }
            >
              <Icon size={13} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

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
