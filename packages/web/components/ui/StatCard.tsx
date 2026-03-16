import { cn } from "@/lib/cn";

interface StatCardProps {
  /** Label describing the stat */
  label: string;
  /** The primary value to display */
  value: string | number;
  /** Optional trend direction. Use "new" for first-time entries. */
  trend?: "up" | "down" | "neutral" | "new";
  /** Optional formatted trend value (e.g. "+2.3%") */
  trendValue?: string;
  /**
   * Inverts the trend color semantics — useful for rankings where
   * moving down (lower number) is positive.
   * When true: "down" renders green, "up" renders red.
   */
  invertTrend?: boolean;
  className?: string;
}

/**
 * Card for displaying a single statistic with optional trend indicator.
 * Set invertTrend for ranking stats where a lower number is better.
 */
export function StatCard({
  label,
  value,
  trend,
  trendValue,
  invertTrend = false,
  className,
}: StatCardProps) {
  const upColor = invertTrend ? "text-result-loss" : "text-result-win";
  const downColor = invertTrend ? "text-result-win" : "text-result-loss";

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
          {trend === "new" ? (
            <span className="rounded-chip bg-accent-gold/20 px-2 py-0.5 text-xs font-semibold text-accent-gold">
              NEW
            </span>
          ) : (
            <>
              {trend === "up" && (
                <svg
                  className={upColor}
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
                  className={downColor}
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
                    trend === "up" && upColor,
                    trend === "down" && downColor,
                    (!trend || trend === "neutral") && "text-text-secondary"
                  )}
                >
                  {trendValue}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
