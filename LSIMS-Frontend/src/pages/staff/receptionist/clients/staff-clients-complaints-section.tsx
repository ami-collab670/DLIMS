import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { StaffComplaintsSection } from "@/pages/staff/lims-extensions/compliance/staff-complaints-section";

export function StaffClientsComplaintsSection() {
  const [searchParams] = useSearchParams();
  const clientEmail = searchParams.get("client")?.trim().toLowerCase() ?? "";

  const { data: clients = [] } = useQuery({
    queryKey: ["staff-lab-clients"],
    queryFn: fetchLabClients,
    staleTime: 60_000,
  });

  const clientIdFilter = useMemo(() => {
    if (!clientEmail) return undefined;
    return clients.find((c) => c.email.trim().toLowerCase() === clientEmail)?.id;
  }, [clientEmail, clients]);

  return (
    <StaffComplaintsSection
      clientIdFilter={clientIdFilter}
      breadcrumbOwnerKey="clients-complaint-detail"
    />
  );
}
