import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNotification } from "@/features/notifications/hooks";
import {
  JOB_PRIORITY_LABEL,
  JOB_STATUS_LABEL,
  shortJobId,
} from "@/lib/laboratory";
import type { AdminUserRow } from "@/types/account-admin";
import type { JobOrder } from "@/types/laboratory";
import type { NotificationKind } from "@/types/notification";

import {
  RECEPTIONIST_MESSAGE_TEMPLATES,
} from "@/lib/staff/receptionist/message-templates";

import { StaffClientComplaintForm } from "./staff-client-complaint-form";

function needsFinanceLink(status: JobOrder["current_status"]): boolean {
  return status === "pending_finance" || status === "finance_hold";
}

type Props = {
  client: AdminUserRow;
  clientJobs: JobOrder[];
  onClose: () => void;
};

export function StaffClientDetailPanel({ client, clientJobs, onClose }: Props) {
  const [showMessage, setShowMessage] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendKind, setSendKind] = useState<NotificationKind>("message");

  const contactName =
    [client.first_name, client.last_name].filter(Boolean).join(" ").trim() ||
    client.email;

  const sendMut = useCreateNotification({
    onSuccess: () => {
      setSendTitle("");
      setSendBody("");
      setShowMessage(false);
    },
  });

  return (
    <div className="flex h-full max-h-[min(80vh,760px)] flex-col overflow-y-auto border-l border-border bg-card shadow-sm lg:rounded-xl lg:border">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-border bg-card p-4">
        <div className="min-w-0">
          <p className="text-xs uppercase text-muted-foreground">Client</p>
          <p className="truncate font-semibold">
            {client.organization_name || contactName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{client.email}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-6 p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Contact</dt>
            <dd>{contactName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd>{client.phone?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Organization type</dt>
            <dd>{client.organization_type?.trim() || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Account status</dt>
            <dd>{client.is_active ? "Active" : "Inactive"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setShowMessage((v) => !v);
              setShowComplaint(false);
            }}
          >
            Message client
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setShowComplaint((v) => !v);
              setShowMessage(false);
            }}
          >
            Log complaint
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link
              to={`/staff/clients?tab=complaints&client=${encodeURIComponent(client.email)}`}
            >
              View complaints
            </Link>
          </Button>
        </div>

        {showMessage ? (
          <form
            className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!sendTitle.trim() || !sendBody.trim()) {
                toast.error("Title and message are required.");
                return;
              }
              sendMut.mutate({
                recipient: client.email,
                title: sendTitle.trim(),
                body: sendBody.trim(),
                kind: sendKind,
              });
            }}
          >
            <p className="text-sm font-medium">Send to {client.email}</p>
            <div className="space-y-1">
              <Label htmlFor="client-msg-template">Message template</Label>
              <select
                id="client-msg-template"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const template = RECEPTIONIST_MESSAGE_TEMPLATES.find(
                    (t) => t.id === e.target.value,
                  );
                  if (template) {
                    setSendTitle(template.title);
                    setSendBody(template.body);
                    setSendKind(template.kind);
                  }
                }}
              >
                <option value="">Choose a preset…</option>
                {RECEPTIONIST_MESSAGE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="client-msg-kind">Type</Label>
              <select
                id="client-msg-kind"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={sendKind}
                onChange={(e) => setSendKind(e.target.value as NotificationKind)}
              >
                <option value="message">Message</option>
                <option value="info">Info</option>
                <option value="job">Job</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="client-msg-title">Title</Label>
              <Input
                id="client-msg-title"
                value={sendTitle}
                onChange={(e) => setSendTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="client-msg-body">Message</Label>
              <Textarea
                id="client-msg-body"
                rows={3}
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={sendMut.isPending}>
                {sendMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : null}
                Send
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowMessage(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {showComplaint ? (
          <StaffClientComplaintForm
            client={client}
            clientJobs={clientJobs}
            onCancel={() => setShowComplaint(false)}
          />
        ) : null}

        <section className="space-y-3">
          <h4 className="text-sm font-medium">
            Job history ({clientJobs.length})
          </h4>
          {!clientJobs.length ? (
            <p className="text-sm text-muted-foreground">
              No job orders linked to this client yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 font-medium">Job</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Priority</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {clientJobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">
                        {shortJobId(job.id)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {JOB_STATUS_LABEL[job.current_status]}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {JOB_PRIORITY_LABEL[job.priority]}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {needsFinanceLink(job.current_status) ? (
                          <Link
                            to={`/staff/finance?job=${job.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Check payment status →
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
