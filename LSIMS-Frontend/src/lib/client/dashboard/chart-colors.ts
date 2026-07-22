import type { ClientProgressStep } from "@/lib/client/progress";
import type { JobOrderStatus, JobPriority, PaymentStatus } from "@/types/laboratory";

/** Semantic chart fills aligned with client progress/badge tones. */
export const CLIENT_CHART_COLORS = {
  completed: "hsl(142 76% 36%)",
  inProgress: "hsl(221 83% 53%)",
  pendingFinance: "hsl(38 92% 50%)",
  attention: "hsl(0 84% 60%)",
  pending: "hsl(220 9% 46%)",
  muted: "hsl(220 9% 64%)",
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
} as const;

const STATUS_CHART_COLOR: Partial<Record<JobOrderStatus, string>> = {
  completed: CLIENT_CHART_COLORS.completed,
  pending_finance: CLIENT_CHART_COLORS.pendingFinance,
  finance_hold: CLIENT_CHART_COLORS.attention,
  submitted: CLIENT_CHART_COLORS.pending,
  draft: CLIENT_CHART_COLORS.muted,
  received: CLIENT_CHART_COLORS.inProgress,
  in_prep: CLIENT_CHART_COLORS.inProgress,
  in_analysis: CLIENT_CHART_COLORS.inProgress,
  qc: CLIENT_CHART_COLORS.inProgress,
};

const PROGRESS_CHART_COLOR: Record<ClientProgressStep, string> = {
  pending_finance: CLIENT_CHART_COLORS.pendingFinance,
  in_progress: CLIENT_CHART_COLORS.inProgress,
  result_ready: CLIENT_CHART_COLORS.completed,
};

const PRIORITY_CHART_COLOR: Record<JobPriority, string> = {
  normal: CLIENT_CHART_COLORS.muted,
  urgent: CLIENT_CHART_COLORS.attention,
};

const PAYMENT_CHART_COLOR: Record<PaymentStatus, string> = {
  paid: CLIENT_CHART_COLORS.completed,
  pending: CLIENT_CHART_COLORS.pendingFinance,
  partial: CLIENT_CHART_COLORS.inProgress,
};

export function chartColorForJobStatus(status: JobOrderStatus): string {
  return STATUS_CHART_COLOR[status] ?? CLIENT_CHART_COLORS.chart3;
}

export function chartColorForProgressStep(step: ClientProgressStep): string {
  return PROGRESS_CHART_COLOR[step];
}

export function chartColorForPriority(priority: JobPriority): string {
  return PRIORITY_CHART_COLOR[priority] ?? CLIENT_CHART_COLORS.muted;
}

export function chartColorForPaymentStatus(status: PaymentStatus): string {
  return PAYMENT_CHART_COLOR[status];
}
