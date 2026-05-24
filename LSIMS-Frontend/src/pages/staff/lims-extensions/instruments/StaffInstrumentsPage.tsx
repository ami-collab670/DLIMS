import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

/**
 * Backend: no instrument/equipment or calibration endpoints in `/api/laboratory/` or `/api/accounts/`.
 */
export default function StaffInstrumentsPage() {
  return (
    <div className="space-y-8">
      <LimsPageIntro title="Instruments &amp; equipment">
        <p>
          This deployment does not expose device records, calibration due dates, or maintenance
          logs. When those APIs exist, this page can list assets, link methods to instruments,
          and surface QC instrument qualifications.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">Planned capability</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Instrument registry and serial numbers</li>
            <li>Calibration &amp; preventive maintenance scheduling</li>
            <li>Method ↔ instrument linkage for audits</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">What you can do today</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Track analytical work through <strong>samples</strong>, <strong>test catalog</strong>
            , and <strong>job workflow</strong> statuses only — all backed by the current
            laboratory API.
          </p>
        </div>
      </div>
    </div>
  );
}
