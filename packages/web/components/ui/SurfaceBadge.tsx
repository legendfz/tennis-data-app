import { cn } from "@/lib/cn";

type Surface = "hard" | "clay" | "grass";
type BadgeSize = "sm" | "md";

interface SurfaceBadgeProps {
  /** The court surface type */
  surface: Surface;
  /** Badge size */
  size?: BadgeSize;
  className?: string;
}

const surfaceConfig: Record<Surface, { label: string; classes: string }> = {
  hard: {
    label: "Hard",
    classes: "bg-surface-court-hard text-white",
  },
  clay: {
    label: "Clay",
    classes: "bg-surface-court-clay text-white",
  },
  grass: {
    label: "Grass",
    classes: "bg-surface-court-grass text-white",
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

/**
 * Colored pill badge indicating tennis court surface type.
 */
export function SurfaceBadge({ surface, size = "md", className }: SurfaceBadgeProps) {
  const { label, classes } = surfaceConfig[surface];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip font-medium",
        classes,
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}
