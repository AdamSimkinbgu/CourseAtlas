/**
 * Skeleton loader components for loading states
 */

interface SkeletonProps {
  className?: string;
}

/**
 * Generic skeleton rectangle for loading states
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
      aria-label="Loading..."
    />
  );
}

/**
 * Skeleton loader for course nodes in the graph
 */
export function CourseNodeSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Skeleton loader for the graph editor while initial data loads
 */
export function GraphEditorSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-6">
        {/* Main loading spinner */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 dark:border-slate-700 dark:border-t-blue-400" />
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Loading graph...
          </div>
          <Skeleton className="h-3 w-48" />
        </div>

        {/* Preview of what's loading */}
        <div className="mt-4 flex gap-4">
          <CourseNodeSkeleton />
          <CourseNodeSkeleton />
          <CourseNodeSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for the course side panel
 */
export function CourseSidePanelSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        <div>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

/**
 * Inline skeleton for loading text
 */
export function InlineSkeleton({ className = "h-4 w-20" }: SkeletonProps) {
  return <Skeleton className={className} />;
}
