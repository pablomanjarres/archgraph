import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Box } from "lucide-react";

export function SystemNode({ data }: NodeProps) {
  return (
    <div className="relative w-[220px] rounded-lg bg-[#262626] border border-[#333] shadow-lg hover:border-blue-500/50 transition-colors">
      <div
        className="absolute top-0 left-0 w-full h-0.5 rounded-t-lg"
        style={{ backgroundColor: "#3b82f6" }}
      />
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-md bg-blue-500/20 flex items-center justify-center">
            <Box size={16} className="text-blue-400" />
          </div>
          <span className="font-semibold text-sm text-white truncate">
            {data.name as string}
          </span>
        </div>
        <p className="text-xs text-neutral-400 line-clamp-2">
          {data.description as string}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase tracking-wide font-medium">
            System
          </span>
          {data.scope === "external" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400 uppercase tracking-wide">
              External
            </span>
          )}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2 !h-2 !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2 !h-2 !border-0" />
    </div>
  );
}
