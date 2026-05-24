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
<<<<<<< HEAD
  is_superuser?: boolean;
=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  date_joined: string;
};

export type RoleRecord = {
  id: string;
  role_name: string;
<<<<<<< HEAD
  /** Present on nested user.role_detail; omitted on GET /api/accounts/roles/. */
  display_name?: string;
  contact_alias: string;
};

export type { AdminUserCreateResponse } from "@/types/api-responses";
=======
  display_name: string;
  contact_alias: string;
};
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
