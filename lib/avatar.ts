/**
 * Returns the URL to use for a user's avatar.
 * Uses profile.avatar_url (Supabase storage path) or app default.
 */
export function getAvatarUrl(avatarPath: string | null): string {
  if (avatarPath) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (base) {
      return `${base.replace(/\/$/, "")}/storage/v1/object/public/avatars/${avatarPath.replace(/^\//, "")}`;
    }
  }
  return "/avatar/default.png";
}

/** Get initials from full name or email (e.g. "Nick Bwalley" -> "NB") */
export function getInitials(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0];
  return local.slice(0, 2).toUpperCase();
}
