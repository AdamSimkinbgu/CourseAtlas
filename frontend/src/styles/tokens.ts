/**
 * Design tokens shared across the graph editor.
 * These values should be the single source of truth for colours, spacing,
 * typography tweaks, and thresholds used by status + container styling.
 */

export const GRADE_PASS_THRESHOLD = 56;

export type StatusKey = "planned" | "completed" | "failed" | "blocked";

type StatusToken = {
  bg: string;
  text: string;
  border: string;
};

type StatusTokens = Record<StatusKey, StatusToken>;

type ThemeTokens = {
  status: StatusTokens;
  halo: {
    active: string;
    prerequisite: string;
  };
  canvas: {
    background: string;
    grid: string;
  };
};

export const THEME_TOKENS: Record<"light" | "dark", ThemeTokens> = {
  light: {
    status: {
      planned: {
        bg: "#eef2ff",
        text: "#1e3a8a",
        border: "#c7d2fe",
      },
      completed: {
        bg: "#dcfce7",
        text: "#14532d",
        border: "#bbf7d0",
      },
      failed: {
        bg: "#fee2e2",
        text: "#7f1d1d",
        border: "#fecaca",
      },
      blocked: {
        bg: "#f1f5f9",
        text: "#475569",
        border: "#cbd5f5",
      },
    },
    halo: {
      active: "rgba(37, 99, 235, 0.45)",
      prerequisite: "rgba(148, 163, 184, 0.35)",
    },
    canvas: {
      background: "#f8fafc",
      grid: "rgba(148, 163, 184, 0.18)",
    },
  },
  dark: {
    status: {
      planned: {
        bg: "#1e3a8a",
        text: "#e0e7ff",
        border: "#4478ff",
      },
      completed: {
        bg: "#14532d",
        text: "#bbf7d0",
        border: "#22c55e",
      },
      failed: {
        bg: "#7f1d1d",
        text: "#fecaca",
        border: "#f87171",
      },
      blocked: {
        bg: "#1e293b",
        text: "#cbd5f5",
        border: "#334155",
      },
    },
    halo: {
      active: "rgba(96, 165, 250, 0.55)",
      prerequisite: "rgba(148, 163, 184, 0.4)",
    },
    canvas: {
      background: "#0f172a",
      grid: "rgba(30, 41, 59, 0.55)",
    },
  },
};

export type ContainerPaletteColor = {
  id: string;
  label: string;
  light: {
    fill: string;
    border: string;
  };
  dark: {
    fill: string;
    border: string;
  };
};

export const CONTAINER_PALETTE: ContainerPaletteColor[] = [
  {
    id: "indigo",
    label: "Indigo",
    light: { fill: "rgba(79, 70, 229, 0.16)", border: "#6366f1" },
    dark: { fill: "rgba(99, 102, 241, 0.28)", border: "#818cf8" },
  },
  {
    id: "teal",
    label: "Teal",
    light: { fill: "rgba(13, 148, 136, 0.16)", border: "#14b8a6" },
    dark: { fill: "rgba(45, 212, 191, 0.25)", border: "#2dd4bf" },
  },
  {
    id: "amber",
    label: "Amber",
    light: { fill: "rgba(217, 119, 6, 0.18)", border: "#f59e0b" },
    dark: { fill: "rgba(245, 158, 11, 0.26)", border: "#fbbf24" },
  },
  {
    id: "rose",
    label: "Rose",
    light: { fill: "rgba(225, 29, 72, 0.18)", border: "#f43f5e" },
    dark: { fill: "rgba(244, 63, 94, 0.28)", border: "#fb7185" },
  },
  {
    id: "violet",
    label: "Violet",
    light: { fill: "rgba(124, 58, 237, 0.16)", border: "#8b5cf6" },
    dark: { fill: "rgba(139, 92, 246, 0.28)", border: "#a855f7" },
  },
  {
    id: "slate",
    label: "Slate",
    light: { fill: "rgba(100, 116, 139, 0.16)", border: "#64748b" },
    dark: { fill: "rgba(148, 163, 184, 0.26)", border: "#94a3b8" },
  },
];

export const DEFAULT_CONTAINER_PALETTE_IDS = CONTAINER_PALETTE.map((entry) => entry.id);

export const TOOLBAR_ELEVATION = {
  shadow: "0 16px 40px rgba(15, 23, 42, 0.25)",
  border: "rgba(148, 163, 184, 0.22)",
};
