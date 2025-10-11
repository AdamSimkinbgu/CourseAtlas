type FullScreenLoaderProps = {
  message?: string;
};

export function FullScreenLoader({ message = "Loading..." }: FullScreenLoaderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-600">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
