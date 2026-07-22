export function withQuery(path: string, query?: Record<string, string>): string {
  if (!query || Object.keys(query).length === 0) return path;
  const search = new URLSearchParams(query);
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}
