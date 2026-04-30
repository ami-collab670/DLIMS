import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth-store";

function apiDocsHref(): string {
  const base = env.apiBaseUrl?.replace(/\/$/, "") ?? "";
  return base ? `${base}/api/docs/` : "/api/docs/";
}

/**
 * Staff-only: theme, session, and API docs. Backend has no separate settings resource.
 */
export function ProfileStaffWorkspaceCard() {
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="workspace-heading"
    >
      <h3 id="workspace-heading" className="text-sm font-medium">
        Workspace
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Preferences below are outside the profile API: theme is stored in this app only;
        sign out clears JWT tokens locally.
      </p>
      <ul className="mt-4 space-y-4 text-sm">
        <li className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Appearance</p>
            <p className="text-xs text-muted-foreground">
              Not persisted to the LSIMS backend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggler />
          </div>
        </li>
        <li className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Session</p>
            <p className="text-xs text-muted-foreground">
              Tokens from <code className="rounded bg-muted px-1">/api/auth/token/</code>.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => clearSession()}>
            Sign out
          </Button>
        </li>
        <li className="border-t border-border pt-4">
          <p className="font-medium">API documentation</p>
          <p className="mt-1 text-xs text-muted-foreground">
            OpenAPI/Swagger served by the backend.
          </p>
          <Button type="button" variant="link" className="mt-2 h-auto px-0" asChild>
            <a href={apiDocsHref()} target="_blank" rel="noreferrer">
              Open API docs
            </a>
          </Button>
        </li>
      </ul>
    </section>
  );
}
