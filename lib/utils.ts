/** Relative time: "5 minutes ago" or "in 2 hours" */
export function formatDistanceToNow(
  date: Date,
  options?: { addSuffix?: boolean }
): string {
  const now = Date.now();
  const then = date.getTime();
  const diffMs = now - then;
  const addSuffix = options?.addSuffix ?? true;

  const absMs = Math.abs(diffMs);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let text: string;
  if (days >= 1) text = `${days} day${days === 1 ? "" : "s"}`;
  else if (hours >= 1) text = `${hours} hour${hours === 1 ? "" : "s"}`;
  else if (minutes >= 1) text = `${minutes} minute${minutes === 1 ? "" : "s"}`;
  else if (seconds >= 1) text = `${seconds} second${seconds === 1 ? "" : "s"}`;
  else text = "just now";

  if (!addSuffix) return text;
  return diffMs >= 0 ? `${text} ago` : `in ${text}`;
}
