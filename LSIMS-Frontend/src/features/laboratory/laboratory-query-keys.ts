export const laboratoryQueryKeys = {
  financialRecords: (params?: Record<string, unknown>) =>
    ["financial-records", params] as const,
  financialRecord: (invoiceNo: string) => ["financial-records", invoiceNo] as const,
  preparationRecords: (params?: Record<string, unknown>) =>
    ["preparation-records", params] as const,
  preparationRecord: (id: string) => ["preparation-records", id] as const,
  analysisResults: (params?: Record<string, unknown>) =>
    ["analysis-results", params] as const,
  analysisResult: (id: string) => ["analysis-results", id] as const,
  calibrationRecords: (params?: Record<string, unknown>) =>
    ["calibration-records", params] as const,
  qcDecisions: (params?: Record<string, unknown>) => ["qc-decisions", params] as const,
  complaints: (params?: Record<string, unknown>) => ["complaints", params] as const,
  complaint: (id: string) => ["complaints", id] as const,
  discountApprovals: (params?: Record<string, unknown>) =>
    ["discount-approvals", params] as const,
  priorityAlerts: () => ["priority-alerts"] as const,
  jobResultSummary: (jobId: string) => ["job-result-summary", jobId] as const,
  departments: (params?: Record<string, unknown>) => ["departments", params] as const,
};
