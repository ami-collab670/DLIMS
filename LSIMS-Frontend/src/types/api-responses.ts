/** Standard DRF detail message (deactivate user, change-password, etc.). */
export type ApiDetailResponse = {
  detail: string;
};

/** POST /api/accounts/users/ — UserCreateSerializer shape. */
export type AdminUserCreateResponse = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "internal" | "external";
  role: string | null;
  nationality: string;
  organization_name: string;
  organization_type: string;
};

/** POST /api/laboratory/samples/ — SampleCreateSerializer shape. */
export type SampleCreateResponse = {
  id: string;
  job: string;
  blind_alias_code: string;
  sample_code: string;
  sample_name: string;
  sample_weight: string | null;
  packaging_type: string;
  collection_date: string | null;
  received_by: string | null;
  submitted_by: string;
  assigned_analyst: string | null;
  status_sync_with_job: boolean;
  sample_status: string;
  notes: string;
};
