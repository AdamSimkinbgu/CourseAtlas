import { useCallback, useState } from "react";

/**
 * Hook to manage loading states for multiple async operations
 *
 * Usage:
 * ```typescript
 * const loading = useLoadingState();
 *
 * const handleCreate = async () => {
 *   loading.start('create-course');
 *   try {
 *     await createMutation.mutateAsync(data);
 *   } finally {
 *     loading.stop('create-course');
 *   }
 * };
 *
 * return (
 *   <button disabled={loading.is('create-course')}>
 *     {loading.is('create-course') ? 'Creating...' : 'Create'}
 *   </button>
 * );
 * ```
 */
export function useLoadingState() {
  const [operations, setOperations] = useState<Set<string>>(new Set());

  /**
   * Mark an operation as loading
   */
  const start = useCallback((operation: string) => {
    setOperations((prev) => {
      const next = new Set(prev);
      next.add(operation);
      return next;
    });
  }, []);

  /**
   * Mark an operation as complete
   */
  const stop = useCallback((operation: string) => {
    setOperations((prev) => {
      const next = new Set(prev);
      next.delete(operation);
      return next;
    });
  }, []);

  /**
   * Check if an operation is loading
   */
  const is = useCallback(
    (operation: string): boolean => {
      return operations.has(operation);
    },
    [operations]
  );

  /**
   * Check if ANY operation is loading
   */
  const isAny = useCallback((): boolean => {
    return operations.size > 0;
  }, [operations]);

  /**
   * Get all currently loading operations
   */
  const all = useCallback((): string[] => {
    return Array.from(operations);
  }, [operations]);

  /**
   * Clear all loading states (useful for cleanup)
   */
  const clear = useCallback(() => {
    setOperations(new Set());
  }, []);

  return {
    start,
    stop,
    is,
    isAny,
    all,
    clear,
  };
}

/**
 * Operation names for consistency
 */
export const LoadingOperations = {
  // Course operations
  CREATE_COURSE: "create-course",
  UPDATE_COURSE: "update-course",
  DELETE_COURSE: "delete-course",

  // Container operations
  CREATE_CONTAINER: "create-container",
  UPDATE_CONTAINER: "update-container",
  DELETE_CONTAINER: "delete-container",

  // Bulk operations
  DELETE_NODES: "delete-nodes",

  // Prerequisites
  ADD_PREREQUISITE: "add-prerequisite",
  REMOVE_PREREQUISITE: "remove-prerequisite",

  // Import/Export
  IMPORT_GRAPH: "import-graph",
  EXPORT_GRAPH: "export-graph",
  LOAD_SAMPLE: "load-sample",

  // Persistence
  SAVE_POSITIONS: "save-positions",
  SAVE_CONTAINERS: "save-containers",
} as const;

export type LoadingOperation = (typeof LoadingOperations)[keyof typeof LoadingOperations];

