/** DRF PageNumberPagination response shape */
export type DrfPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type JobOrder = {
  id: string;
  /** Client account email (API accepts email or legacy UUID on write). */
  client: string;
  client_name: string;
  /** Staff user email who registered the job (or self-service client email). */
  submitted_by: string;
  current_status: JobOrderStatus;
  status_reason: string;
  blocked_by_role: string | null;
  is_cancelled: boolean;
  cancellation_reason: string;
  priority: JobPriority;
  description: string;
  sample_count: number;
  created_at: string;
  updated_at: string;
};

export type JobOrderStatus =
  | "draft"
  | "submitted"
  | "pending_finance"
  | "received"
  | "in_prep"
  | "in_analysis"
  | "qc"
  | "finance_hold"
  | "completed";

export type JobPriority = "normal" | "urgent" ;

export type TestCatalogItem = {
  id: string;
  test_name: string;
  test_code: string;
  description: string;
  unit: string;
  price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SampleTestRow = {
  id: string;
  sample: string;
  test: string;
  test_name: string;
  test_code: string;
  created_at: string;
};

/**
 * Staff full sample payload (admin/receptionist) or blind analyst payload.
 * Analyst list/detail omit identity fields; use optional chains in UI.
 */
export type SampleRecord = {
  id: string;
  job?: string;
  job_status?: string;
  blind_alias?: string;
  /** Analyst serializer uses blind_alias_id instead of blind_alias UUID. */
  blind_alias_id?: string;
  blind_alias_code: string;
  sample_code?: string;
  sample_name?: string;
  sample_weight: string | null;
  packaging_type: string;
  collection_date: string | null;
  /** Receptionist email, if physically received; pre-intake samples may omit. */
  received_by: string | null;
  /** Client email. */
  submitted_by?: string;
  /** Analyst email or null. */
  assigned_analyst: string | null;
  assigned_at: string | null;
  reassigned_reason: string;
  /** When true, ``sample_status`` is driven by the parent job (staff change job status to move samples). */
  status_sync_with_job?: boolean;
  sample_status: string;
  notes: string;
  sample_tests: SampleTestRow[];
  created_at: string;
  updated_at: string;
};
