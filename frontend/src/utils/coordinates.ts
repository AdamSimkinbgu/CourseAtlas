/**
 * Coordinate System Utilities for Graph Editor
 *
 * The graph editor uses TWO coordinate systems:
 *
 * 1. ABSOLUTE coordinates (stored in database):
 *    - Origin: Top-left of canvas
 *    - Used for: Backend storage, top-level nodes
 *    - Example: { x: 250, y: 250 }
 *
 * 2. RELATIVE coordinates (used by React Flow for children):
 *    - Origin: Top-left of parent container
 *    - Used for: Child nodes within containers
 *    - Example: { x: 50, y: 50 } (50px from container's top-left)
 *
 * IMPORTANT: Always use these utilities to convert between systems.
 * Manual conversion is error-prone and causes "jumping" bugs.
 */

/**
 * Position in absolute canvas coordinates (relative to canvas origin)
 * This is what gets stored in the database.
 */
export interface AbsolutePosition {
  x: number;
  y: number;
}

/**
 * Position relative to a parent container
 * This is what React Flow uses for child nodes.
 */
export interface RelativePosition {
  x: number;
  y: number;
}

/**
 * Convert a relative position (child within container) to absolute canvas coordinates
 *
 * @param relative - Position relative to container's top-left corner
 * @param containerPos - Container's absolute position on canvas
 * @returns Absolute position on canvas
 *
 * @example
 * ```typescript
 * const containerPos = { x: 100, y: 100 };
 * const childRelative = { x: 50, y: 50 };
 * const childAbsolute = toAbsolute(childRelative, containerPos);
 * // Result: { x: 150, y: 150 }
 * ```
 */
export function toAbsolute(
  relative: RelativePosition,
  containerPos: AbsolutePosition
): AbsolutePosition {
  return {
    x: relative.x + containerPos.x,
    y: relative.y + containerPos.y,
  };
}

/**
 * Convert an absolute canvas position to relative position within a container
 *
 * @param absolute - Position on canvas (absolute coordinates)
 * @param containerPos - Container's absolute position on canvas
 * @returns Position relative to container's top-left corner
 *
 * @example
 * ```typescript
 * const containerPos = { x: 100, y: 100 };
 * const childAbsolute = { x: 150, y: 150 };
 * const childRelative = toRelative(childAbsolute, containerPos);
 * // Result: { x: 50, y: 50 }
 * ```
 */
export function toRelative(
  absolute: AbsolutePosition,
  containerPos: AbsolutePosition
): RelativePosition {
  return {
    x: absolute.x - containerPos.x,
    y: absolute.y - containerPos.y,
  };
}

/**
 * Check if a position is valid (non-negative, finite numbers)
 *
 * @param position - Position to validate
 * @returns true if position is valid
 */
export function isValidPosition(position: { x: number; y: number }): boolean {
  return (
    Number.isFinite(position.x) && Number.isFinite(position.y) && position.x >= 0 && position.y >= 0
  );
}

/**
 * Snap a position to a grid
 *
 * @param position - Position to snap
 * @param gridSize - Grid cell size (default: 20)
 * @returns Position snapped to nearest grid point
 *
 * @example
 * ```typescript
 * const position = { x: 127, y: 243 };
 * const snapped = snapToGrid(position, 20);
 * // Result: { x: 120, y: 240 }
 * ```
 */
export function snapToGrid(
  position: { x: number; y: number },
  gridSize: number = 20
): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Calculate the distance between two positions
 *
 * @param pos1 - First position
 * @param pos2 - Second position
 * @returns Euclidean distance between positions
 */
export function distance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a position within bounds
 *
 * @param position - Position to clamp
 * @param bounds - Bounds { minX, minY, maxX, maxY }
 * @returns Clamped position
 */
export function clampPosition(
  position: { x: number; y: number },
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
): { x: number; y: number } {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y)),
  };
}

/**
 * Add two positions (vector addition)
 */
export function addPositions(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: pos1.x + pos2.x,
    y: pos1.y + pos2.y,
  };
}

/**
 * Subtract two positions (vector subtraction)
 */
export function subtractPositions(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: pos1.x - pos2.x,
    y: pos1.y - pos2.y,
  };
}
