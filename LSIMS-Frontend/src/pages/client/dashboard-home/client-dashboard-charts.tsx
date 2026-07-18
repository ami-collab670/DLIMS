import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchAllActiveJobs,
  fetchAllFinancialRecords,
  groupInvoicesByPaymentStatus,
  groupJobsByPriority,
  groupJobsByProgressStep,
  groupJobsByStatus,
} from "@/pages/client/dashboard-home/client-dashboard-metrics";
import {
  chartColorForJobStatus,
  chartColorForPaymentStatus,
  chartColorForPriority,
  chartColorForProgressStep,
} from "@/lib/client-dashboard-chart-colors";

import { clientDashboardKeys } from "./client-dashboard-api-keys";

const CHART_HEIGHT = 220;

function ChartShell({
  title,
  description,
  loading,
  error,
  empty,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  error: boolean;
  empty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h4 className="text-sm font-medium">{title}</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="py-8 text-sm text-destructive">Could not load chart data.</p>
      ) : empty ? (
        <p className="py-8 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="mt-3" style={{ minHeight: CHART_HEIGHT }}>
          {children}
        </div>
      )}
    </div>
  );
}

function CountTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { label: string; count: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md">
      <span className="font-medium">{row.label}</span>: {row.count}
    </div>
  );
}

export function ClientDashboardCharts() {
  const jobsQuery = useQuery({
    queryKey: clientDashboardKeys.allActiveJobs,
    queryFn: fetchAllActiveJobs,
    staleTime: 45_000,
  });

  const financeQuery = useQuery({
    queryKey: clientDashboardKeys.allFinancialRecords,
    queryFn: fetchAllFinancialRecords,
    staleTime: 45_000,
  });

  const jobs = jobsQuery.data ?? [];
  const financeRecords = financeQuery.data ?? [];

  const statusData = groupJobsByStatus(jobs, chartColorForJobStatus);
  const progressData = groupJobsByProgressStep(jobs, chartColorForProgressStep);
  const priorityData = groupJobsByPriority(jobs, chartColorForPriority);
  const invoiceData = groupInvoicesByPaymentStatus(
    financeRecords,
    chartColorForPaymentStatus,
  );

  return (
    <section aria-labelledby="client-charts-heading">
      <h3 id="client-charts-heading" className="mb-3 text-sm font-medium">
        Analytics
      </h3>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartShell
          title="Jobs by status"
          description="Active requests grouped by workflow status."
          loading={jobsQuery.isLoading}
          error={jobsQuery.isError}
          empty={statusData.length === 0}
          emptyMessage="No active requests yet."
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={100}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {statusData.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="Jobs by progress"
          description="Simplified client progress buckets."
          loading={jobsQuery.isLoading}
          error={jobsQuery.isError}
          empty={progressData.length === 0}
          emptyMessage="No active requests yet."
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={progressData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {progressData.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="Jobs by priority"
          description="Urgent vs normal request priority."
          loading={jobsQuery.isLoading}
          error={jobsQuery.isError}
          empty={priorityData.length === 0}
          emptyMessage="No active requests yet."
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={priorityData} margin={{ left: 8, right: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell
          title="Invoice payment status"
          description="Your laboratory invoices by payment state."
          loading={financeQuery.isLoading}
          error={financeQuery.isError}
          empty={invoiceData.length === 0}
          emptyMessage="No invoices yet — submit a request to get started."
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={invoiceData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {invoiceData.map((row) => (
                  <Cell key={row.key} fill={row.fill} />
                ))}
              </Pie>
              <Tooltip content={<CountTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </section>
  );
}
