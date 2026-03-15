import { useGraphStore } from "../../store/useGraphStore";

export function BottomBar() {
  const model = useGraphStore((s) => s.model);

  if (!model) return null;

  // Count technologies across all objects
  const techCounts = new Map<string, { name: string; color: string; count: number }>();
  for (const obj of model.objects) {
    for (const tech of obj.technologies ?? []) {
      const existing = techCounts.get(tech.id);
      if (existing) {
        existing.count++;
      } else {
        techCounts.set(tech.id, {
          name: tech.name,
          color: tech.color ?? "#71717a",
          count: 1,
        });
      }
    }
  }

  // Count statuses
  const statusCounts = { live: 0, future: 0, deprecated: 0 };
  for (const obj of model.objects) {
    statusCounts[obj.status]++;
  }

  return (
    <div className="h-9 border-t border-[#333] bg-[#1e1e1e] flex items-center px-4 gap-4 shrink-0 overflow-x-auto">
      {/* Technology pills */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider mr-1">
          Tech
        </span>
        {Array.from(techCounts.values()).map((tech) => (
          <span
            key={tech.name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: `${tech.color}20`,
              color: tech.color,
            }}
          >
            {tech.name}
            <span className="opacity-60">{tech.count}</span>
          </span>
        ))}
      </div>

      <div className="w-px h-4 bg-neutral-700" />

      {/* Status counts */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
          Status
        </span>
        {statusCounts.live > 0 && (
          <span className="text-[10px] text-green-400">
            {statusCounts.live} live
          </span>
        )}
        {statusCounts.future > 0 && (
          <span className="text-[10px] text-blue-400">
            {statusCounts.future} future
          </span>
        )}
        {statusCounts.deprecated > 0 && (
          <span className="text-[10px] text-red-400">
            {statusCounts.deprecated} deprecated
          </span>
        )}
      </div>

      <div className="flex-1" />

      <span className="text-[10px] text-neutral-600">
        {model.objects.length} objects · {model.connections.length} connections
      </span>
    </div>
  );
}
