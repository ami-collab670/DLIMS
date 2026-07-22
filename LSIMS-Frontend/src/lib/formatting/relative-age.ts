/** Relative age from an ISO timestamp (queue / assignment wait time). */
export function formatRelativeAge(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const hours = Math.floor((Date.now() - t) / (1000 * 60 * 60));
  if (hours < 1) return "< 1 h";
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

/** @deprecated Use {@link formatRelativeAge}. */
export const formatQueueAge = formatRelativeAge;

/** @deprecated Use {@link formatRelativeAge}. */
export const formatAssignedAge = formatRelativeAge;
