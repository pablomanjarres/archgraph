import { Map, Plus, MessageSquare } from "lucide-react";
import { useGraphStore } from "../../store/useGraphStore";

export function LeftSidebar() {
  const toggleMinimap = useGraphStore((s) => s.toggleMinimap);
  const showMinimap = useGraphStore((s) => s.showMinimap);

  return (
    <div className="w-10 border-r border-[#333] bg-[#1e1e1e] flex flex-col items-center py-3 gap-2 shrink-0">
      <SidebarButton icon={Plus} tooltip="Add object" />
      <SidebarButton icon={MessageSquare} tooltip="Comments" />
      <div className="flex-1" />
      <SidebarButton
        icon={Map}
        tooltip="Toggle minimap"
        active={showMinimap}
        onClick={toggleMinimap}
      />
    </div>
  );
}

function SidebarButton({
  icon: Icon,
  tooltip,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tooltip: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
        active
          ? "bg-blue-500/20 text-blue-400"
          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}
