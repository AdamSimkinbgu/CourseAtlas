import { describe, it, expect } from "vitest";
import {
  toAbsolute,
  toRelative,
  isValidPosition,
  snapToGrid,
  distance,
  clampPosition,
  addPositions,
  subtractPositions,
} from "../coordinates";

describe("coordinates utilities", () => {
  describe("toAbsolute", () => {
    it("converts relative position to absolute", () => {
      const relative = { x: 50, y: 50 };
      const containerPos = { x: 100, y: 100 };
      const result = toAbsolute(relative, containerPos);
      expect(result).toEqual({ x: 150, y: 150 });
    });

    it("handles zero positions", () => {
      const relative = { x: 0, y: 0 };
      const containerPos = { x: 100, y: 100 };
      const result = toAbsolute(relative, containerPos);
      expect(result).toEqual({ x: 100, y: 100 });
    });

    it("handles negative relative positions", () => {
      const relative = { x: -10, y: -20 };
      const containerPos = { x: 100, y: 100 };
      const result = toAbsolute(relative, containerPos);
      expect(result).toEqual({ x: 90, y: 80 });
    });
  });

  describe("toRelative", () => {
    it("converts absolute position to relative", () => {
      const absolute = { x: 150, y: 150 };
      const containerPos = { x: 100, y: 100 };
      const result = toRelative(absolute, containerPos);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    it("handles positions at container origin", () => {
      const absolute = { x: 100, y: 100 };
      const containerPos = { x: 100, y: 100 };
      const result = toRelative(absolute, containerPos);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it("handles positions before container origin", () => {
      const absolute = { x: 90, y: 80 };
      const containerPos = { x: 100, y: 100 };
      const result = toRelative(absolute, containerPos);
      expect(result).toEqual({ x: -10, y: -20 });
    });
  });

  describe("round-trip conversion", () => {
    it("toRelative and toAbsolute are inverses", () => {
      const original = { x: 150, y: 250 };
      const containerPos = { x: 100, y: 100 };

      const relative = toRelative(original, containerPos);
      const backToAbsolute = toAbsolute(relative, containerPos);

      expect(backToAbsolute).toEqual(original);
    });
  });

  describe("isValidPosition", () => {
    it("returns true for valid positions", () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 100, y: 200 })).toBe(true);
      expect(isValidPosition({ x: 0.5, y: 1.5 })).toBe(true);
    });

    it("returns false for negative positions", () => {
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
      expect(isValidPosition({ x: -1, y: -1 })).toBe(false);
    });

    it("returns false for infinite positions", () => {
      expect(isValidPosition({ x: Infinity, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: -Infinity })).toBe(false);
      expect(isValidPosition({ x: NaN, y: 0 })).toBe(false);
    });
  });

  describe("snapToGrid", () => {
    it("snaps positions to 20px grid by default", () => {
      expect(snapToGrid({ x: 127, y: 243 })).toEqual({ x: 120, y: 240 });
      expect(snapToGrid({ x: 15, y: 18 })).toEqual({ x: 20, y: 20 });
      expect(snapToGrid({ x: 5, y: 8 })).toEqual({ x: 0, y: 0 });
    });

    it("snaps to custom grid size", () => {
      expect(snapToGrid({ x: 127, y: 243 }, 50)).toEqual({ x: 150, y: 250 });
      expect(snapToGrid({ x: 24, y: 26 }, 10)).toEqual({ x: 20, y: 30 });
    });

    it("handles exact grid points", () => {
      expect(snapToGrid({ x: 100, y: 200 }, 20)).toEqual({ x: 100, y: 200 });
      expect(snapToGrid({ x: 0, y: 0 }, 20)).toEqual({ x: 0, y: 0 });
    });
  });

  describe("distance", () => {
    it("calculates distance between two points", () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      expect(distance(pos1, pos2)).toBe(5); // 3-4-5 triangle
    });

    it("returns 0 for identical points", () => {
      const pos = { x: 100, y: 200 };
      expect(distance(pos, pos)).toBe(0);
    });

    it("handles negative coordinates", () => {
      const pos1 = { x: -3, y: -4 };
      const pos2 = { x: 0, y: 0 };
      expect(distance(pos1, pos2)).toBe(5);
    });
  });

  describe("clampPosition", () => {
    const bounds = { minX: 0, minY: 0, maxX: 400, maxY: 600 };

    it("keeps positions within bounds unchanged", () => {
      expect(clampPosition({ x: 100, y: 200 }, bounds)).toEqual({ x: 100, y: 200 });
      expect(clampPosition({ x: 0, y: 0 }, bounds)).toEqual({ x: 0, y: 0 });
      expect(clampPosition({ x: 400, y: 600 }, bounds)).toEqual({ x: 400, y: 600 });
    });

    it("clamps x coordinate to bounds", () => {
      expect(clampPosition({ x: -10, y: 200 }, bounds)).toEqual({ x: 0, y: 200 });
      expect(clampPosition({ x: 500, y: 200 }, bounds)).toEqual({ x: 400, y: 200 });
    });

    it("clamps y coordinate to bounds", () => {
      expect(clampPosition({ x: 100, y: -10 }, bounds)).toEqual({ x: 100, y: 0 });
      expect(clampPosition({ x: 100, y: 700 }, bounds)).toEqual({ x: 100, y: 600 });
    });

    it("clamps both coordinates", () => {
      expect(clampPosition({ x: -10, y: -20 }, bounds)).toEqual({ x: 0, y: 0 });
      expect(clampPosition({ x: 500, y: 700 }, bounds)).toEqual({ x: 400, y: 600 });
    });
  });

  describe("addPositions", () => {
    it("adds two positions", () => {
      const pos1 = { x: 100, y: 200 };
      const pos2 = { x: 50, y: 75 };
      expect(addPositions(pos1, pos2)).toEqual({ x: 150, y: 275 });
    });

    it("handles zero addition", () => {
      const pos = { x: 100, y: 200 };
      expect(addPositions(pos, { x: 0, y: 0 })).toEqual(pos);
    });

    it("handles negative values", () => {
      const pos1 = { x: 100, y: 200 };
      const pos2 = { x: -50, y: -75 };
      expect(addPositions(pos1, pos2)).toEqual({ x: 50, y: 125 });
    });
  });

  describe("subtractPositions", () => {
    it("subtracts two positions", () => {
      const pos1 = { x: 150, y: 275 };
      const pos2 = { x: 50, y: 75 };
      expect(subtractPositions(pos1, pos2)).toEqual({ x: 100, y: 200 });
    });

    it("handles zero subtraction", () => {
      const pos = { x: 100, y: 200 };
      expect(subtractPositions(pos, { x: 0, y: 0 })).toEqual(pos);
    });

    it("can produce negative results", () => {
      const pos1 = { x: 50, y: 75 };
      const pos2 = { x: 100, y: 200 };
      expect(subtractPositions(pos1, pos2)).toEqual({ x: -50, y: -125 });
    });
  });

  describe("real-world scenarios", () => {
    it("handles dragging a child node within a container", () => {
      // Container at (100, 100)
      const containerPos = { x: 100, y: 100 };

      // Child node at relative (50, 50) within container
      const childRelative = { x: 50, y: 50 };

      // Convert to absolute for backend storage
      const childAbsolute = toAbsolute(childRelative, containerPos);
      expect(childAbsolute).toEqual({ x: 150, y: 150 });

      // When container moves to (200, 200), child's absolute position should be (250, 250)
      const newContainerPos = { x: 200, y: 200 };
      const newChildAbsolute = toAbsolute(childRelative, newContainerPos);
      expect(newChildAbsolute).toEqual({ x: 250, y: 250 });
    });

    it("handles reassigning a course from one container to another", () => {
      // Course at absolute (250, 250)
      const courseAbsolute = { x: 250, y: 250 };

      // Moving from container A (100, 100) to container B (300, 300)
      const containerA = { x: 100, y: 100 };
      const containerB = { x: 300, y: 300 };

      // Calculate relative position in container A
      const relativeInA = toRelative(courseAbsolute, containerA);
      expect(relativeInA).toEqual({ x: 150, y: 150 });

      // Calculate relative position in container B (same absolute position)
      const relativeInB = toRelative(courseAbsolute, containerB);
      expect(relativeInB).toEqual({ x: -50, y: -50 });

      // Verify: converting back to absolute should give original position
      expect(toAbsolute(relativeInA, containerA)).toEqual(courseAbsolute);
      expect(toAbsolute(relativeInB, containerB)).toEqual(courseAbsolute);
    });

    it("handles moving course out of container to top-level", () => {
      // Course at relative (50, 50) in container at (100, 100)
      const containerPos = { x: 100, y: 100 };
      const relativePos = { x: 50, y: 50 };

      // Convert to absolute when removing from container
      const absolute = toAbsolute(relativePos, containerPos);
      expect(absolute).toEqual({ x: 150, y: 150 });

      // Snap to grid for top-level node
      const snapped = snapToGrid(absolute, 20);
      expect(snapped).toEqual({ x: 160, y: 160 });
    });
  });
});
