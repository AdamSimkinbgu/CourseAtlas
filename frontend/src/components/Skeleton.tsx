import clsx from "clsx";

export type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx("animate-pulse rounded-xl bg-slate-200", className)} />;
}
