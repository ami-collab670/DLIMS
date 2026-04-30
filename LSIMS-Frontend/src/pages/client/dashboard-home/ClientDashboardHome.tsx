import { ClientGettingStartedCard } from "./client-getting-started-card";
import { ClientWelcomeHeader } from "./client-welcome-header";

export default function ClientDashboardHome() {
  return (
    <div className="space-y-6">
      <ClientWelcomeHeader />
      <ClientGettingStartedCard />
    </div>
  );
}
