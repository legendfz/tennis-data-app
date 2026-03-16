import { cn } from "@/lib/cn";

interface StatCardProps {
  /** Label describing the stat */
  label: string;
  /** The primary value to display */
  value: string | number;
  /** Optional trend direction */
  trend?: "up" | "down" | "neutral";
  /** Optional formatted trend value (e.g. "+2.3%") */
  trendValue?: string;
  className?: string;
}

/**
 * Card for displaying a single statistic with optional trend indicator.
 */
export function StatCard({ label, value, trend, trendValue, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-card bg-background-surface p-4",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      {(trend || trendValue) && (
        <div className="mt-1 flex items-center gap-1">
          {trend === "up" && (
            <svg
              className="text-result-win"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 2 L10 8 L2 8 Z" />
            </svg>
          )}
          {trend === "down" && (
            <svg
              className="text-result-loss"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 10 L10 4 L2 4 Z" />
            </svg>
          )}
          {trendValue && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-result-win",
                trend === "down" && "text-result-loss",
                (!trend || trend === "neutral") && "text-text-secondary"
              )}
            >
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
