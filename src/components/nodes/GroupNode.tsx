import type { NodeProps } from "@xyflow/react";

export function GroupNode({ data }: NodeProps) {
  return (
    <div className="w-full h-full min-w-[300px] min-h-[200px] rounded-xl border border-dashed border-neutral-600 bg-neutral-800/30 p-2">
      <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider px-2 py-1">
        {data.label as string}
      </span>
    </div>
  );
}
