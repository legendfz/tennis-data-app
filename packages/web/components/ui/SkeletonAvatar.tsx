import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8",
  md: "size-12",
  lg: "size-20",
};

interface SkeletonAvatarProps {
  /** Matches PlayerAvatar sizes: sm=32px, md=48px, lg=80px */
  size?: AvatarSize;
  className?: string;
}

/**
 * Circular animated shimmer placeholder matching PlayerAvatar dimensions.
 * Use while player data is loading.
 */
export function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-background-elevated animate-pulse",
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  );
}
