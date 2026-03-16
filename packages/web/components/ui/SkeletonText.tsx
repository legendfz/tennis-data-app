import { cn } from "@/lib/cn";

const widthClasses = {
  full: "w-full",
  "3/4": "w-3/4",
  "1/2": "w-1/2",
  "1/4": "w-1/4",
} as const;

interface SkeletonTextProps {
  /** Number of placeholder lines to render */
  lines?: number;
  /** Width of the skeleton lines */
  width?: keyof typeof widthClasses;
  className?: string;
}

/**
 * Animated shimmer placeholder for text content.
 * Use while loading text data to preserve layout and reduce CLS.
 */
export function SkeletonText({ lines = 1, width = "full", className }: SkeletonTextProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded bg-background-elevated animate-pulse",
            widthClasses[width]
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
