/**
 * Generate a UI Avatars URL for a player
 */
export function getAvatarUrl(name: string, size: number = 200): string {
  const encodedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=16a34a&color=fff&bold=true`;
}
