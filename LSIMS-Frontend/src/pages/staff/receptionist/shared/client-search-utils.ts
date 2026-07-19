/** Minimum query length before showing search-gated tables (receptionist privacy). */
export const CLIENT_SEARCH_MIN_LENGTH = 2;

export type ClientSearchFields = {
  name?: string;
  email?: string;
  phone?: string;
  organization?: string;
};

export function hasClientSearchQuery(query: string): boolean {
  return query.trim().length >= CLIENT_SEARCH_MIN_LENGTH;
}

export function matchesClientSearch(
  query: string,
  fields: ClientSearchFields,
): boolean {
  const q = query.trim().toLowerCase();
  if (q.length < CLIENT_SEARCH_MIN_LENGTH) return false;
  const haystack = [
    fields.organization,
    fields.name,
    fields.email,
    fields.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
