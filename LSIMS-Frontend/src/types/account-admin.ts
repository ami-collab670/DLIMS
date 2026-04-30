import type { RoleDetail } from "@/types/user";

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
  nationality: string;
  organization_name: string;
  organization_type: string;
  is_active: boolean;
  date_joined: string;
};

export type RoleRecord = {
  id: string;
  role_name: string;
  display_name: string;
  contact_alias: string;
};
