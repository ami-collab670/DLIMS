import { useQuery } from "@tanstack/react-query";

import { fetchJobOrders } from "@/features/jobs/api";

import { ClientDashboardAttention } from "./client-dashboard-attention";
import { clientDashboardKeys } from "./client-dashboard-api-keys";
import { ClientDashboardCharts } from "./client-dashboard-charts";
import { ClientGettingStartedCard } from "./client-getting-started-card";
import { ClientDashboardProfileSnapshot } from "./client-dashboard-profile-snapshot";
import { ClientDashboardQuickActions } from "./client-dashboard-quick-actions";
import { ClientDashboardRecentActivity } from "./client-dashboard-recent-activity";
import { ClientDashboardStatCards } from "./client-dashboard-stat-cards";
import { ClientWelcomeHeader } from "./client-welcome-header";

export default function ClientDashboardHome() {
  const { data: activeJobsData } = useQuery({
    queryKey: clientDashboardKeys.activeJobCount,
    queryFn: () => fetchJobOrders({ page: 1, page_size: 1, is_cancelled: false }),
    staleTime: 45_000,
  });

  const activeJobCount = activeJobsData?.count ?? 0;
  const showProminentGettingStarted = activeJobCount === 0;

  return (
    <div className="space-y-8">
      <ClientWelcomeHeader />

      {showProminentGettingStarted ? (
        <ClientGettingStartedCard prominent />
      ) : null}

      <ClientDashboardStatCards />
      <ClientDashboardCharts />
      <ClientDashboardQuickActions />
      <ClientDashboardRecentActivity />
      <ClientDashboardAttention />
      <ClientDashboardProfileSnapshot />

      {!showProminentGettingStarted ? (
        <ClientGettingStartedCard prominent={false} />
      ) : null}
    </div>
  );
}
