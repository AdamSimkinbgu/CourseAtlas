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
        bg: "rgba(59, 130, 246, 0.18)",
        text: "#1d4ed8",
        border: "rgba(59, 130, 246, 0.35)",
      },
      completed: {
        bg: "rgba(34, 197, 94, 0.18)",
        text: "#166534",
        border: "rgba(34, 197, 94, 0.35)",
      },
      failed: {
        bg: "rgba(239, 68, 68, 0.12)",
        text: "#b91c1c",
        border: "rgba(239, 68, 68, 0.28)",
      },
      blocked: {
        bg: "rgba(148, 163, 184, 0.14)",
        text: "#475569",
        border: "rgba(148, 163, 184, 0.32)",
      },
    },
    halo: {
      active: "rgba(59, 130, 246, 0.38)",
      prerequisite: "rgba(148, 163, 184, 0.3)",
    },
    canvas: {
      background: "#f5f7fa",
      grid: "rgba(220, 226, 234, 0.7)",
    },
  },
  dark: {
    status: {
      planned: {
        bg: "rgba(148, 163, 184, 0.18)",
        text: "#cfe0ff",
        border: "rgba(59, 130, 246, 0.45)",
      },
      completed: {
        bg: "rgba(34, 197, 94, 0.18)",
        text: "#d7f9e3",
        border: "rgba(53, 196, 107, 0.65)",
      },
      failed: {
        bg: "rgba(239, 68, 68, 0.18)",
        text: "#fecaca",
        border: "rgba(226, 86, 90, 0.6)",
      },
      blocked: {
        bg: "rgba(30, 41, 59, 0.35)",
        text: "#cbd5f5",
        border: "rgba(99, 112, 133, 0.55)",
      },
    },
    halo: {
      active: "rgba(96, 165, 250, 0.5)",
      prerequisite: "rgba(148, 163, 184, 0.38)",
    },
    canvas: {
      background: "#11151c",
      grid: "rgba(42, 51, 68, 0.9)",
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
    light: { fill: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.45)" },
    dark: { fill: "rgba(59, 130, 246, 0.18)", border: "rgba(91, 148, 255, 0.6)" },
  },
  {
    id: "teal",
    label: "Teal",
    light: { fill: "rgba(20, 184, 166, 0.12)", border: "rgba(20, 184, 166, 0.45)" },
    dark: { fill: "rgba(20, 184, 166, 0.2)", border: "rgba(45, 212, 191, 0.6)" },
  },
  {
    id: "amber",
    label: "Amber",
    light: { fill: "rgba(245, 158, 11, 0.14)", border: "rgba(245, 158, 11, 0.45)" },
    dark: { fill: "rgba(245, 158, 11, 0.22)", border: "rgba(251, 191, 36, 0.6)" },
  },
  {
    id: "rose",
    label: "Rose",
    light: { fill: "rgba(244, 63, 94, 0.14)", border: "rgba(244, 63, 94, 0.45)" },
    dark: { fill: "rgba(244, 63, 94, 0.24)", border: "rgba(251, 113, 133, 0.62)" },
  },
  {
    id: "violet",
    label: "Violet",
    light: { fill: "rgba(139, 92, 246, 0.14)", border: "rgba(139, 92, 246, 0.45)" },
    dark: { fill: "rgba(139, 92, 246, 0.24)", border: "rgba(168, 85, 247, 0.6)" },
  },
  {
    id: "slate",
    label: "Slate",
    light: { fill: "rgba(148, 163, 184, 0.14)", border: "rgba(100, 116, 139, 0.42)" },
    dark: { fill: "rgba(148, 163, 184, 0.26)", border: "rgba(148, 163, 184, 0.55)" },
  },
];

export const DEFAULT_CONTAINER_PALETTE_IDS = CONTAINER_PALETTE.map((entry) => entry.id);

export const TOOLBAR_ELEVATION = {
  shadow: "0 16px 40px rgba(15, 23, 42, 0.25)",
  border: "rgba(148, 163, 184, 0.22)",
};
