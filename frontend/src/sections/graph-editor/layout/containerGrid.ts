import {
  COURSE_GAP,
  COURSE_SLOT_HEIGHT,
  COURSE_SLOT_WIDTH,
  CONTAINER_HEADER_HEIGHT,
  CONTAINER_PADDING,
  SLOT_HORIZONTAL_SPACING,
  SLOT_VERTICAL_SPACING,
  snap,
  snapPoint,
  snapSize,
  type GridPoint,
  type GridSize,
} from "./grid";

export type Slot = {
  row: number;
  column: number;
};

export type ContainerGridMetrics = {
  columns: number;
  rows: number;
  width: number;
  height: number;
};

export type CourseLayout = {
  id: string;
  slot: Slot;
  position: GridPoint;
};

export function normaliseLayouts(layouts: CourseLayout[]): CourseLayout[] {
  if (layouts.length === 0) return layouts;
  const rowValues = layouts.map((layout) => layout.slot.row);
  const columnValues = layouts.map((layout) => layout.slot.column);
  const minRow = Math.min(...rowValues);
  const minColumn = Math.min(...columnValues);
  if (minRow === 0 && minColumn === 0) return layouts;
  return layouts.map((layout) => ({
    ...layout,
    slot: {
      row: layout.slot.row - minRow,
      column: layout.slot.column - minColumn,
    },
  }));
}

export function slotToPosition(containerPosition: GridPoint, slot: Slot): GridPoint {
  return snapPoint({
    x: containerPosition.x + CONTAINER_PADDING + slot.column * (COURSE_SLOT_WIDTH + COURSE_GAP),
    y:
      containerPosition.y +
      CONTAINER_PADDING +
      CONTAINER_HEADER_HEIGHT +
      slot.row * (COURSE_SLOT_HEIGHT + COURSE_GAP),
  });
}

export function positionToSlot(containerPosition: GridPoint, position: GridPoint): Slot {
  const relativeX = position.x - (containerPosition.x + CONTAINER_PADDING);
  const relativeY =
    position.y - (containerPosition.y + CONTAINER_PADDING + CONTAINER_HEADER_HEIGHT);

  const column = Math.max(0, Math.round(relativeX / (COURSE_SLOT_WIDTH + COURSE_GAP)));
  const row = Math.max(0, Math.round(relativeY / (COURSE_SLOT_HEIGHT + COURSE_GAP)));

  return { column, row };
}

export function containerSizeForGrid(columns: number, rows: number): GridSize {
  const width =
    CONTAINER_PADDING * 2 + columns * COURSE_SLOT_WIDTH + Math.max(0, columns - 1) * COURSE_GAP;
  const height =
    CONTAINER_PADDING * 2 +
    CONTAINER_HEADER_HEIGHT +
    rows * COURSE_SLOT_HEIGHT +
    Math.max(0, rows - 1) * COURSE_GAP;
  return snapSize({ width, height });
}

export function analyseOccupiedSlots(
  courses: { id: string; position: GridPoint }[],
  containerPosition: GridPoint
): CourseLayout[] {
  return courses.map((course) => {
    const slot = positionToSlot(containerPosition, course.position);
    return {
      id: course.id,
      slot,
      position: slotToPosition(containerPosition, slot),
    };
  });
}

export function collectSlotSet(layouts: CourseLayout[]): Set<string> {
  const set = new Set<string>();
  layouts.forEach((layout) => {
    set.add(`${layout.slot.row}:${layout.slot.column}`);
  });
  return set;
}

function clampGridSize(value: number): number {
  return Math.max(1, value);
}

export function deriveMetricsFromSize(size: GridSize): ContainerGridMetrics {
  const innerWidth = Math.max(0, size.width - CONTAINER_PADDING * 2 + COURSE_GAP);
  const innerHeight = Math.max(
    0,
    size.height - (CONTAINER_PADDING * 2 + CONTAINER_HEADER_HEIGHT) + COURSE_GAP
  );
  const columns = clampGridSize(Math.round(innerWidth / (COURSE_SLOT_WIDTH + COURSE_GAP)));
  const rows = clampGridSize(Math.round(innerHeight / (COURSE_SLOT_HEIGHT + COURSE_GAP)));
  const snapped = containerSizeForGrid(columns, rows);
  return {
    columns,
    rows,
    width: snapped.width,
    height: snapped.height,
  };
}

export function metricsFromLayouts(layouts: CourseLayout[]): ContainerGridMetrics {
  if (layouts.length === 0) {
    const size = containerSizeForGrid(1, 1);
    return { columns: 1, rows: 1, width: size.width, height: size.height };
  }
  let maxColumn = 0;
  let maxRow = 0;
  layouts.forEach((layout) => {
    maxColumn = Math.max(maxColumn, layout.slot.column);
    maxRow = Math.max(maxRow, layout.slot.row);
  });
  const columns = clampGridSize(maxColumn + 1);
  const rows = clampGridSize(maxRow + 1);
  const size = containerSizeForGrid(columns, rows);
  return { columns, rows, width: size.width, height: size.height };
}

export function slotKey(slot: Slot): string {
  return `${slot.row}:${slot.column}`;
}

export function findFirstAvailableSlot(
  occupied: Set<string>,
  metrics: ContainerGridMetrics
): Slot | null {
  for (let row = 0; row < metrics.rows; row += 1) {
    for (let column = 0; column < metrics.columns; column += 1) {
      const candidate = { row, column };
      if (!occupied.has(slotKey(candidate))) {
        return candidate;
      }
    }
  }
  return null;
}

export function expandGridForSlot(
  occupied: Set<string>,
  initialMetrics: ContainerGridMetrics,
  slot: Slot
): ContainerGridMetrics {
  const columns = Math.max(initialMetrics.columns, slot.column + 1);
  const rows = Math.max(initialMetrics.rows, slot.row + 1);
  const size = containerSizeForGrid(columns, rows);
  return {
    columns,
    rows,
    width: size.width,
    height: size.height,
  };
}

export function neighbourhoodSlots(slot: Slot): Slot[] {
  return [
    { row: slot.row, column: slot.column },
    { row: slot.row, column: slot.column + 1 },
    { row: slot.row, column: Math.max(0, slot.column - 1) },
    { row: slot.row + 1, column: slot.column },
    { row: Math.max(0, slot.row - 1), column: slot.column },
  ];
}

export function pickLeastPopulatedEdge(
  layouts: CourseLayout[],
  metrics: ContainerGridMetrics
): "top" | "bottom" | "left" | "right" {
  const counts = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };

  layouts.forEach((layout) => {
    if (layout.slot.row === 0) counts.top += 1;
    if (layout.slot.column === 0) counts.left += 1;
    if (layout.slot.row === metrics.rows - 1) counts.bottom += 1;
    if (layout.slot.column === metrics.columns - 1) counts.right += 1;
  });

  const edges = Object.entries(counts).sort((a, b) => a[1] - b[1]);
  return (edges[0]?.[0] as "top" | "bottom" | "left" | "right") ?? "bottom";
}

export type ExpansionOutcome = {
  metrics: ContainerGridMetrics;
  containerPosition: GridPoint;
  layouts: CourseLayout[];
  slotForNewCourse: Slot;
};

export function expandContainerLayouts(
  edge: "top" | "bottom" | "left" | "right",
  containerPosition: GridPoint,
  metrics: ContainerGridMetrics,
  layouts: CourseLayout[]
): ExpansionOutcome {
  let { columns, rows } = metrics;
  const newPosition = { ...containerPosition };
  let adjustedLayouts = layouts.map((layout) => ({ ...layout, slot: { ...layout.slot } }));
  let newSlot: Slot;

  switch (edge) {
    case "left":
      columns += 1;
      newPosition.x -= SLOT_HORIZONTAL_SPACING;
      adjustedLayouts = adjustedLayouts.map((layout) => ({
        ...layout,
        slot: { row: layout.slot.row, column: layout.slot.column + 1 },
      }));
      newSlot = { row: 0, column: 0 };
      break;
    case "right":
      columns += 1;
      newSlot = { row: 0, column: columns - 1 };
      break;
    case "top":
      rows += 1;
      newPosition.y -= SLOT_VERTICAL_SPACING;
      adjustedLayouts = adjustedLayouts.map((layout) => ({
        ...layout,
        slot: { row: layout.slot.row + 1, column: layout.slot.column },
      }));
      newSlot = { row: 0, column: 0 };
      break;
    case "bottom":
    default:
      rows += 1;
      newSlot = { row: rows - 1, column: 0 };
      break;
  }

  const size = containerSizeForGrid(columns, rows);
  return {
    metrics: { columns, rows, width: size.width, height: size.height },
    containerPosition: newPosition,
    layouts: adjustedLayouts,
    slotForNewCourse: newSlot!,
  };
}
