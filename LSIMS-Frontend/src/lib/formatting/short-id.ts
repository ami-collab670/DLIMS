/** Short display for UUIDs (jobs, users, etc.). */
export function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}
