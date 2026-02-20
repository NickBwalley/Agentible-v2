/**
 * Cold outreach template utilities: allowed placeholders and safe fill.
 * Use only allowlisted keys to avoid injection.
 */

export const ALLOWED_PLACEHOLDERS = [
  "firstName",
  "org_name",
  "yourName",
] as const;

export type PlaceholderMap = {
  firstName?: string;
  org_name?: string;
  yourName?: string;
};

/**
 * Derives first name from full_name (first word). Fallback "there" if missing.
 */
export function getFirstNameFromFullName(fullName: string | null): string {
  if (fullName == null || fullName.trim() === "") return "there";
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

/**
 * Fills a template with only allowlisted placeholders. Unknown {{key}} are left as-is.
 */
export function fillTemplate(
  template: string,
  values: PlaceholderMap
): string {
  let result = template;
  for (const key of ALLOWED_PLACEHOLDERS) {
    const value = values[key] ?? "";
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}
