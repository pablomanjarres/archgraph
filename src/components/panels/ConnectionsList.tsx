import { ArrowRight } from "lucide-react";
import type { Connection, ModelObject } from "../../types/model";

interface Props {
  connections: Connection[];
  objects: ModelObject[];
  currentObjectId: string;
}

export function ConnectionsList({ connections, objects, currentObjectId }: Props) {
  const objectMap = new Map(objects.map((o) => [o.id, o]));

  if (connections.length === 0) {
    return <p className="text-xs text-neutral-500">No connections</p>;
  }

  return (
    <div className="space-y-2">
      {connections.map((conn) => {
        const isSource = conn.sourceId === currentObjectId;
        const otherId = isSource ? conn.targetId : conn.sourceId;
        const other = objectMap.get(otherId);

        return (
          <div
            key={conn.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-neutral-800 text-xs"
          >
            <span className="text-neutral-400 shrink-0">
              {isSource ? "to" : "from"}
            </span>
            <ArrowRight size={12} className="text-neutral-600 shrink-0" />
            <span className="text-white font-medium truncate">
              {other?.name ?? otherId}
            </span>
            <span className="text-neutral-500 ml-auto shrink-0">
              {conn.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
