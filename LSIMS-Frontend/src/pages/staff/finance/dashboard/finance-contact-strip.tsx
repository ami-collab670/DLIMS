import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, User } from "lucide-react";

import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { fetchRoles } from "@/features/accounts/roles-api";
import type { JobOrder } from "@/types/laboratory";

type Props = {
  job: JobOrder;
  compact?: boolean;
};

export function FinanceContactStrip({ job, compact = false }: Props) {
  const { data: clients = [] } = useQuery({
    queryKey: ["lab-clients-picker"],
    queryFn: fetchLabClients,
    staleTime: 120_000,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 120_000,
  });

  const client = clients.find(
    (c) => c.email.toLowerCase() === job.client.toLowerCase(),
  );
  const receptionRole = roles.find((r) => r.role_name === "receptionist");
  const receptionContact = receptionRole?.contact_alias?.trim() || null;

  return (
    <div
      className={
        compact
          ? "space-y-2 text-sm"
          : "rounded-lg border border-border bg-muted/20 p-3 text-sm"
      }
    >
      {!compact ? (
        <p className="text-xs font-medium text-muted-foreground">
          Contact (use email or phone outside the app — in-app messaging is not enabled for
          Finance)
        </p>
      ) : null}
      <div className={compact ? "space-y-2" : "mt-2 grid gap-3 sm:grid-cols-2"}>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="size-3.5" aria-hidden />
            Client
          </p>
          <p className="mt-0.5 font-medium">
            {client
              ? [client.first_name, client.last_name].filter(Boolean).join(" ") ||
                client.email
              : job.client_name || job.client}
          </p>
          <a
            href={`mailto:${client?.email ?? job.client}`}
            className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Mail className="size-3" aria-hidden />
            {client?.email ?? job.client}
          </a>
          {client?.phone ? (
            <a
              href={`tel:${client.phone}`}
              className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Phone className="size-3" aria-hidden />
              {client.phone}
            </a>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Reception desk</p>
          {receptionContact ? (
            <p className="mt-0.5">{receptionContact}</p>
          ) : (
            <p className="mt-0.5 text-muted-foreground">
              Intake by {job.submitted_by}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            For finance holds, coordinate with reception — job updates require reception desk
            action.
          </p>
        </div>
      </div>
    </div>
  );
}
