import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Users,
  Box,
  AppWindow,
  Puzzle,
  Database,
  type LucideIcon,
} from "lucide-react";
import { getTierTheme, tierIndex, TIER_COUNT } from "../../lib/tierTheme";
import { useGraphStore } from "../../store/useGraphStore";

/** Lucide glyph per architectural tier — shared with the tier lanes. */
export const TIER_ICON: Record<string, LucideIcon> = {
  actor: Users,
  system: Box,
  app: AppWindow,
  component: Puzzle,
  store: Database,
};

/** Card footprint — kept in sync with LayeredCanvas band math. */
export const CARD_W = 224;

function alphaHex(a: number): string {
  return Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
}

/**
 * Premium, tier-aware node card for the layered "blueprint" view. Unlike the
 * flat cards, elevation, glow and accent weight scale with the tier depth
 * (people float highest, data stores sit deepest), and the whole card is
 * themed from `tierTheme` so it reads as one system with the 3D view.
 */
export function TierCard({ id, data }: NodeProps) {
  const type = (data.type as string) ?? "component";
  const theme = getTierTheme(type);
  const Icon = TIER_ICON[type] ?? Puzzle;

  const selectedId = useGraphStore((s) => s.selectedObjectId);
  const selected = selectedId === id;

  // 0 at the top of the stack → 1 at the bottom. Higher cards lift more.
  const t = tierIndex(type) / Math.max(1, TIER_COUNT - 1);
  const color = theme.color;
  const glow = theme.glow;

  const barH = 4 - t * 1.5; // accent weight thins as we descend
  const glowBlur = 30 - t * 16;
  const glowLift = 10 - t * 5;
  const glowAlpha = 0.46 - t * 0.26;

  const baseShadow = `0 ${glowLift}px ${glowBlur}px -8px ${glow}${alphaHex(
    glowAlpha,
  )}, 0 2px 6px rgba(2, 8, 18, 0.5)`;
  const boxShadow = selected
    ? `0 0 0 1.5px ${color}, 0 0 26px -2px ${color}b0, ${baseShadow}`
    : baseShadow;

  const scope = data.scope as string | undefined;
  const status = data.status as string | undefined;
  const tech = (data.technologies as { name: string }[] | undefined)?.[0]?.name;

  return (
    <div
      className="relative transition-transform duration-150"
      style={{ width: CARD_W, transform: selected ? "translateY(-2px)" : undefined }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border-0"
        style={{ background: color, opacity: 0.55 }}
      />

      <div
        className="rounded-xl overflow-hidden backdrop-blur-sm"
        style={{
          border: `1px solid ${selected ? color : `${color}3d`}`,
          boxShadow,
          background: `radial-gradient(130% 100% at 0% 0%, ${color}1c, transparent 58%), linear-gradient(158deg, #132539 0%, #0b1a2c 100%)`,
        }}
      >
        {/* Structural accent rail. */}
        <div
          style={{
            height: barH,
            background: `linear-gradient(90deg, ${color} 0%, ${color}66 70%, transparent 100%)`,
          }}
        />

        <div className="flex gap-2.5 p-3 pl-3">
          <div
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: `${color}22`,
              boxShadow: `inset 0 0 0 1px ${color}40`,
            }}
          >
            <Icon size={16} style={{ color }} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-[#E6EEF6]">
                {data.name as string}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
              {data.description as string}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: `${color}1f`, color }}
              >
                {theme.label.replace(/s$/, "")}
              </span>
              {scope === "external" && (
                <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-300">
                  External
                </span>
              )}
              {status === "future" && (
                <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-cyan-300">
                  Planned
                </span>
              )}
              {tech && (
                <span className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[9px] text-slate-300">
                  {tech}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-0"
        style={{ background: color, opacity: 0.55 }}
      />
    </div>
  );
}

/**
 * All object node types resolve to the same tier-aware card; it themes itself
 * from `data.type`, so one component covers every tier.
 */
export const layeredNodeTypes = {
  actorNode: TierCard,
  systemNode: TierCard,
  appNode: TierCard,
  storeNode: TierCard,
  componentNode: TierCard,
};
