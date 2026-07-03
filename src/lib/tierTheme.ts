import type { ObjectType } from "../types/model";

/**
 * Shared theming for the layered (premium 2D) and 3D views.
 *
 * The C4 object types form a natural top-to-bottom stack of architectural
 * tiers. `tier` is the vertical order (0 = top of the stack), and the colours
 * mirror the accent palette already used by the flat ReactFlow nodes so all
 * three views read as one system.
 */
export interface TierTheme {
  /** Vertical order in the stack. 0 = top (people), higher = deeper. */
  tier: number;
  /** Human-readable tier name for legends / floor labels. */
  label: string;
  /** Primary accent (hex). */
  color: string;
  /** Translucent band fill for the layered 2D backdrop. */
  band: string;
  /** Emissive glow colour for the 3D material. */
  glow: string;
}

/** Object types ordered top → bottom of the architectural stack. */
export const TIER_ORDER: ObjectType[] = [
  "actor",
  "system",
  "app",
  "component",
  "store",
];

export const TIER_THEME: Record<ObjectType, TierTheme> = {
  actor: {
    tier: 0,
    label: "People",
    color: "#a855f7",
    band: "rgba(168,85,247,0.12)",
    glow: "#7c3aed",
  },
  system: {
    tier: 1,
    label: "Systems",
    color: "#3b82f6",
    band: "rgba(59,130,246,0.12)",
    glow: "#2563eb",
  },
  app: {
    tier: 2,
    label: "Applications",
    color: "#14b8a6",
    band: "rgba(20,184,166,0.12)",
    glow: "#0d9488",
  },
  component: {
    tier: 3,
    label: "Components",
    color: "#71717a",
    band: "rgba(113,113,122,0.12)",
    glow: "#52525b",
  },
  store: {
    tier: 4,
    label: "Data Stores",
    color: "#f59e0b",
    band: "rgba(245,158,11,0.12)",
    glow: "#d97706",
  },
};

export const TIER_COUNT = TIER_ORDER.length;

/** Theme for an object type, falling back to the neutral "component" tier. */
export function getTierTheme(type: string): TierTheme {
  return TIER_THEME[type as ObjectType] ?? TIER_THEME.component;
}

/** Vertical tier index for an object type (0 = top of the stack). */
export function tierIndex(type: string): number {
  return getTierTheme(type).tier;
}
