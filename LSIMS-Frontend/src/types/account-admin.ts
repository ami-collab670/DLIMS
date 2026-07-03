import type { RoleDetail } from "@/types/user";

export type DepartmentRecord = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "internal" | "external";
  role: string | null;
  role_detail: RoleDetail | null;
  department: string | null;
  country?: string;
  nationality: string;
  organization_name: string;
  organization_type: string;
  is_active: boolean;
  is_superuser?: boolean;
  date_joined: string;
};

export type RoleRecord = {
  id: string;
  role_name: string;
  /** Present on nested user.role_detail; omitted on GET /api/accounts/roles/. */
  display_name?: string;
  contact_alias: string;
};

export type { AdminUserCreateResponse } from "@/types/api-responses";
