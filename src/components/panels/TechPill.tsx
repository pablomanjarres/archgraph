import type { Technology } from "../../types/model";

export function TechPill({ tech }: { tech: Technology }) {
  const color = tech.color ?? "#71717a";

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      {tech.name}
    </span>
  );
}
