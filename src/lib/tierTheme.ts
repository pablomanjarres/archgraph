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

/**
 * Visual language for a connection, shared by the layered (2D) and 3D views so
 * a `sync` edge reads the same everywhere. Anchored on the blueprint palette:
 * structural cyan is the confident backbone, amber the deferred/async flow,
 * violet the pub/sub signal, and a pale steel line the quiet data pipe.
 */
export interface EdgeStyle {
  /** Line colour (hex). */
  stroke: string;
  /** Stroke weight (px in 2D, drei lineWidth in 3D). */
  strokeWidth: number;
  /** Render as a dashed line. */
  dashed: boolean;
  /** Carry a travelling flow (marching ants in 2D / a pulse in 3D). */
  animated: boolean;
}

const EDGE_STYLES: Record<string, EdgeStyle> = {
  // Solid cyan backbone — a request/response call.
  sync: { stroke: "#38BDF8", strokeWidth: 2.2, dashed: false, animated: false },
  // Amber, dashed and flowing — a deferred / queued message.
  async: { stroke: "#F5A524", strokeWidth: 2.0, dashed: true, animated: true },
  // Violet, fine dashes and flowing — a fire-and-forget event / pub-sub.
  event: { stroke: "#C084FC", strokeWidth: 1.8, dashed: true, animated: true },
  // Pale steel pipe, solid and heavier — a bulk data / storage link.
  data: { stroke: "#93C5FD", strokeWidth: 2.6, dashed: false, animated: false },
};

const DEFAULT_EDGE_STYLE: EdgeStyle = EDGE_STYLES.sync;

/** Blueprint styling for a connection type (falls back to the `sync` look). */
export function edgeStyle(connType?: string | null): EdgeStyle {
  return (connType && EDGE_STYLES[connType]) || DEFAULT_EDGE_STYLE;
}
