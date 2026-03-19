/**
 * Generate a DiceBear initials avatar URL
 */
export function getDiceBearUrl(name: string, size: number = 200): string {
  return `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(name)}&backgroundColor=1565C0&size=${size}`;
}

/**
 * Get the best avatar URL for a player
 * Prefers photoUrl > DiceBear > ui-avatars
 */
export function getPlayerAvatarUrl(name: string, photoUrl?: string | null, size: number = 200): string {
  if (photoUrl) return photoUrl;
  return getDiceBearUrl(name, size);
}

/**
 * Generate a UI Avatars URL for a player (legacy fallback)
 */
export function getAvatarUrl(name: string, size: number = 200): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=16a34a&color=fff&bold=true`;
}
