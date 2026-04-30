import { env } from "@/config/env";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

function apiDocsHref(): string {
  const base = env.apiBaseUrl?.replace(/\/$/, "") ?? "";
  return base ? `${base}/api/docs/` : "/api/docs/";
}

/**
 * Backend: `JobOrder.blocked_by_role` and `status_reason` support operational holds; no SOP repository API.
 */
export default function StaffCompliancePage() {
  return (
    <div className="space-y-8">
      <LimsPageIntro title="Documents &amp; compliance context">
        <p>
          Controlled documents (SOPs, policies) are not stored via the LSIMS API. Operational
          traceability for jobs uses <code className="rounded bg-muted px-1">status_reason</code>
          , <code className="rounded bg-muted px-1">blocked_by_role</code>, and audit fields such
          as <code className="rounded bg-muted px-1">submitted_by</code> on job orders (see
          Swagger models).
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-medium">API reference</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Use the schema browser to review serialised fields for jobs, samples, and accounts —
          useful for validation and external audit packages.
        </p>
        <a
          href={apiDocsHref()}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open API docs →
        </a>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Suggestion:</strong> link each future SOP record to
        a <code className="rounded bg-muted px-1">test_code</code> or job template when the
        document service is added — no backend changes are assumed in this UI sprint.
      </div>
    </div>
  );
}
