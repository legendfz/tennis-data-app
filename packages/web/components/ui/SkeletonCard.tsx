import { cn } from "@/lib/cn";

interface SkeletonCardProps {
  className?: string;
}

/**
 * Card-shaped animated shimmer placeholder.
 * Mirrors the StatCard layout — use while stat data is loading.
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn("rounded-card bg-background-surface p-4", className)}
      aria-hidden="true"
    >
      {/* Label row */}
      <div className="h-3 w-1/3 rounded bg-background-elevated animate-pulse" />
      {/* Value row */}
      <div className="mt-3 h-7 w-1/2 rounded bg-background-elevated animate-pulse" />
      {/* Trend row */}
      <div className="mt-2 h-3 w-1/4 rounded bg-background-elevated animate-pulse" />
    </div>
  );
}
