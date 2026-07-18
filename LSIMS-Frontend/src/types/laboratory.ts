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
  department: string | null;
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
  blind_alias?: string | null;
  /** Analyst serializer uses blind_alias_id instead of blind_alias UUID. */
  blind_alias_id?: string;
  blind_alias_code?: string;
  sample_code?: string | null;
  sample_name?: string;
  sample_weight: string | null;
  packaging_type: string;
  collection_date: string | null;
  /** Receptionist user id (UUID); prefer received_by_email for display. */
  received_by: string | null;
  /** Receptionist email, if physically received; pre-intake samples may omit. */
  received_by_email?: string | null;
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

export type AnalysisResultState = "draft" | "submitted" | "rejected" | "approved";

export type PaymentStatus = "pending" | "partial" | "paid";

export type PreparationStatus = "pending" | "in_progress" | "completed";

export type ComplaintCategory = "payment" | "sample" | "result" | "other";

export type ComplaintStatus = "open" | "in_review" | "resolved" | "rejected";

export type DiscountType = "percentage" | "fixed_amount" | "free_test";

export type DiscountApprovalStatus = "pending" | "approved" | "rejected";

export type QCDecisionValue = "approved" | "rejected";

export type FinancialRecord = {
  invoice_no: string;
  job: string;
  job_client_email?: string;
  job_status?: string;
  amount_expected: string;
  amount_paid: string;
  payment_status: PaymentStatus;
  paid_at: string | null;
  payment_required: boolean;
  waiver_reason: string;
  waiver_approved_by: string | null;
  waiver_approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PreparationRecord = {
  id: string;
  sample: string;
  sample_code: string | null;
  sample_name: string;
  job: string;
  job_status: string;
  reference_code: string;
  technician: string | null;
  technician_email: string | null;
  status: PreparationStatus;
  preparation_data: Record<string, unknown>;
  notes: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};

export type AnalysisResult = {
  id: string;
  sample_test: string;
  sample: string;
  sample_code: string | null;
  test: string;
  test_name: string;
  test_code: string;
  analyst: string | null;
  analyst_email: string | null;
  state: AnalysisResultState;
  value: string;
  unit: string;
  method: string;
  remarks: string;
  revision: number;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CalibrationRecord = {
  id: string;
  analysis_result: string;
  instrument_name: string;
  calibration_reference: string;
  calibration_date: string | null;
  calibration_data: Record<string, unknown>;
  notes: string;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type QCDecision = {
  id: string;
  analysis_result: string;
  decision: QCDecisionValue;
  reason: string;
  decided_by: string | null;
  decided_by_email: string | null;
  decided_at: string;
};

export type ComplaintRecord = {
  id: string;
  client: string;
  client_email?: string;
  job: string | null;
  sample: string | null;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  resolution: string;
  created_by: string | null;
  created_by_email?: string | null;
  resolved_by: string | null;
  resolved_by_email?: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscountApproval = {
  id: string;
  job: string;
  discount_type: DiscountType;
  percentage: string | null;
  amount: string | null;
  reason: string;
  status: DiscountApprovalStatus;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
};

export type PriorityAlert = {
  job: string;
  priority: string;
  current_status: string;
  age_days: number;
  sample_count: number;
  reason: string;
};

export type JobResultSummary = {
  job: string;
  job_status: string;
  total_tests: number;
  draft: number;
  submitted: number;
  rejected: number;
  approved: number;
  results: AnalysisResult[];
};
