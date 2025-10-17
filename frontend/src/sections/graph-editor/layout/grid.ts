const GRID_UNIT = 24;

export const COURSE_SLOT_WIDTH = GRID_UNIT * 12; // 288px
export const COURSE_SLOT_HEIGHT = GRID_UNIT * 7; // 168px
export const COURSE_GAP = GRID_UNIT * 2; // 48px between cards
export const CONTAINER_PADDING = GRID_UNIT * 2; // 48px inner padding
export const CONTAINER_HEADER_HEIGHT = GRID_UNIT * 3; // 72px snapped header
export const SLOT_HORIZONTAL_SPACING = COURSE_SLOT_WIDTH + COURSE_GAP;
export const SLOT_VERTICAL_SPACING = COURSE_SLOT_HEIGHT + COURSE_GAP;

export type GridPoint = { x: number; y: number };
export type GridSize = { width: number; height: number };

export function snap(value: number): number {
  return Math.round(value / GRID_UNIT) * GRID_UNIT;
}

export function snapDown(value: number): number {
  return Math.floor(value / GRID_UNIT) * GRID_UNIT;
}

export function snapUp(value: number): number {
  return Math.ceil(value / GRID_UNIT) * GRID_UNIT;
}

export function snapPoint(point: GridPoint): GridPoint {
  return {
    x: snap(point.x),
    y: snap(point.y),
  };
}

export function snapSize(size: GridSize): GridSize {
  return {
    width: Math.max(GRID_UNIT, snap(size.width)),
    height: Math.max(GRID_UNIT, snap(size.height)),
  };
}

export function gridUnits(value: number): number {
  return value / GRID_UNIT;
}

export const GRID_CONFIG = {
  UNIT: GRID_UNIT,
  COURSE_SLOT_WIDTH,
  COURSE_SLOT_HEIGHT,
  COURSE_GAP,
  CONTAINER_PADDING,
  CONTAINER_HEADER_HEIGHT,
  SLOT_HORIZONTAL_SPACING,
  SLOT_VERTICAL_SPACING,
};
