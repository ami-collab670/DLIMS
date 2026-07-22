export {

  CLIENT_CHART_COLORS,

  chartColorForJobStatus,

  chartColorForPaymentStatus,

  chartColorForPriority,

  chartColorForProgressStep,

} from "./dashboard/chart-colors";

export {

  type ChartCountRow,

  type InvoiceDueRow,

  complaintsNeedingFollowUp,

  countInProgressJobs,

  countInvoicesDue,

  countJobsByStatus,

  countUrgentJobs,

  extractClientReferenceLabel,

  groupInvoicesByPaymentStatus,

  groupJobsByPriority,

  groupJobsByProgressStep,

  groupJobsByStatus,

  hasRecentJobActivity,

  invoiceAmountDue,

  invoicesNeedingPayment,

  jobsNeedingAttention,

  sumSampleCount,

  totalOutstandingAmount,

} from "./dashboard/metrics";

export { clientDashboardKeys } from "./dashboard/query-keys";

export {
  CLIENT_GETTING_STARTED_DISMISS_KEY,
  CLIENT_GETTING_STARTED_STEPS,
} from "./dashboard/getting-started";

export { CLIENT_QUICK_ACTION_ITEMS } from "./dashboard/quick-actions";

export { NOTIFICATION_KIND_LABEL } from "./notifications/kind-labels";

export {
  clientJobRequestSchema,
  clientJobSampleSchema,
  type ClientJobRequestValues,
  type ClientJobSampleValues,
} from "./validation/job-request-schema";

export {

  CLIENT_PROGRESS_BADGE_CLASS,

  CLIENT_PROGRESS_STEP_LABEL,

  CLIENT_PROGRESS_STEPS,

  clientProgressStepIndex,

  formatClientDate,

  formatClientDateTime,

  toClientProgressStep,

  type ClientProgressStep,

} from "./progress";

