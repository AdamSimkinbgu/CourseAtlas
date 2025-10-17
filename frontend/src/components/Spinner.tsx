/**
 * Loading spinner component
 * Displays a rotating spinner with optional text
 */

export interface SpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** Optional text to display below spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

export function Spinner({ size = 24, text, className = "" }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      />
      {text && <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  );
}

/**
 * Inline spinner for buttons
 */
export function InlineSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}
