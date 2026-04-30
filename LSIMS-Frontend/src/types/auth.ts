import type { RoleDetail } from "@/types/user";

export type TokenPair = {
  access: string;
  refresh: string;
};

export type AuthUser = {
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
  /** Django superuser; not restricted to the `admin` LSIMS role. */
  is_superuser?: boolean;
  date_joined: string;
};

export type RegisterResponse = TokenPair & {
  user: AuthUser;
};
