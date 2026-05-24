import type { RoleRecord } from "@/types/account-admin";

/** Backend list serializer may omit `display_name`; fall back to contact alias or role key. */
export function roleOptionLabel(r: RoleRecord): string {
  const extended = r as RoleRecord & { display_name?: string };
  const label = extended.display_name?.trim();
  if (label) return label;
  const alias = r.contact_alias?.trim();
  if (alias) return alias;
  return r.role_name.replace(/_/g, " ");
}
