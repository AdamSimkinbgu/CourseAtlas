import { useCallback } from "react";
import type { Node } from "reactflow";

export function useCollisionDetection(_nodes: Node[]): {
  handleNodeDragStart: () => void;
  handleNodeDragStop: () => void;
  handleNodeDrag: (id: string, position: { x: number; y: number }) => void;
} {
  const handleNodeDragStart = useCallback(() => {}, []);
  const handleNodeDragStop = useCallback(() => {}, []);
  const handleNodeDrag = useCallback((_: string, __: { x: number; y: number }) => {}, []);

  return {
    handleNodeDragStart,
    handleNodeDragStop,
    handleNodeDrag,
  };
}
