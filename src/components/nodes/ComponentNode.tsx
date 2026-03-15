import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Puzzle } from "lucide-react";

export function ComponentNode({ data }: NodeProps) {
  return (
    <div className="relative w-[220px] rounded-lg bg-[#262626] border border-[#333] shadow-lg hover:border-zinc-400/50 transition-colors">
      <div
        className="absolute top-0 left-0 w-full h-0.5 rounded-t-lg"
        style={{ backgroundColor: "#71717a" }}
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-md bg-zinc-500/20 flex items-center justify-center">
            <Puzzle size={16} className="text-zinc-400" />
          </div>
          <span className="font-semibold text-sm text-white truncate">
            {data.name as string}
          </span>
        </div>
        <p className="text-xs text-neutral-400 line-clamp-2">
          {data.description as string}
        </p>
        <div className="mt-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-300 uppercase tracking-wide font-medium">
            Component
          </span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-zinc-500 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-zinc-500 !w-2 !h-2 !border-0" />
    </div>
  );
}
