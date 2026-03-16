import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

interface PlayerAvatarProps {
  /** URL to the player's photo */
  src?: string;
  /** Player's full name (used for initials fallback and alt text) */
  name: string;
  /** Avatar size: sm=32px, md=48px, lg=80px */
  size?: AvatarSize;
  /** ISO 3166-1 alpha-2 country code for flag emoji */
  countryFlag?: string;
  /** When true, adds a green border ring to indicate active status */
  isActive?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-xs",
  md: "size-12 text-sm",
  lg: "size-20 text-xl",
};

/** Returns up to 2 uppercase initials from a name string. */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Converts a country code to a flag emoji. */
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e0 - 0x41 + c.charCodeAt(0)))
    .join("");
}

/**
 * Circular player avatar with initials fallback, optional country flag, and active state ring.
 */
export function PlayerAvatar({
  src,
  name,
  size = "md",
  countryFlag,
  isActive = false,
  className,
}: PlayerAvatarProps) {
  return (
    <div className={cn("relative inline-flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-background-elevated flex items-center justify-center font-semibold text-text-primary",
          sizeClasses[size],
          isActive && "ring-2 ring-tennis-green ring-offset-2 ring-offset-background"
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span aria-label={name}>{getInitials(name)}</span>
        )}
      </div>
      {countryFlag && (
        <span className="text-base leading-none" aria-label={`Country: ${countryFlag}`}>
          {countryCodeToFlag(countryFlag)}
        </span>
      )}
    </div>
  );
}
