import { Building2, Home, LayoutDashboard, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getDashboardPath, ROUTES } from "@/lib/routing";
import { cn } from "@/lib/ui";
import { useAuthStore } from "@/stores/auth-store";

export type NotFoundVariant = "public" | "client" | "staff";

type NotFoundContentProps = {
  variant: NotFoundVariant;
};

const PORTAL_LABEL: Record<NotFoundVariant, string> = {
  public: "LSIMS Public Portal",
  client: "LSIMS Client Portal",
  staff: "LSIMS Staff Workspace",
};

const PORTAL_MESSAGE: Record<NotFoundVariant, string> = {
  public:
    "The address you entered is not part of this public site. Verify the URL or use the options below to continue.",
  client:
    "This client portal address is not registered in the system. Verify the link or return to your dashboard.",
  staff:
    "This staff workspace address is not registered in the system. Verify the link or return to your dashboard.",
};

const DASHBOARD_HREF: Record<"client" | "staff", string> = {
  client: "/client",
  staff: "/staff",
};

export function NotFoundContent({ variant }: NotFoundContentProps) {
  const { user, ready } = useAuthStore();
  const isPublic = variant === "public";

  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="mb-6 flex size-14 items-center justify-center rounded-full bg-muted/50 text-primary"
        aria-hidden
      >
        <Building2 className="size-7 stroke-[1.5]" />
      </div>

      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {PORTAL_LABEL[variant]}
      </p>

      <p
        className="mt-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
        aria-label="Error code 404"
      >
        Error 404
      </p>

      <p
        className="mt-2 text-6xl font-bold tabular-nums tracking-tight text-foreground/90 sm:text-7xl"
        aria-hidden
      >
        404
      </p>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {PORTAL_MESSAGE[variant]}
      </p>

      <div className="mt-8 w-full max-w-sm pt-8">
        {isPublic ? (
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Button type="button" className="gap-2" asChild>
              <Link to="/">
                <Home className="size-4" aria-hidden />
                Return to home
              </Link>
            </Button>
            {ready && user ? (
              <Button type="button" variant="outline" className="gap-2" asChild>
                <Link to={getDashboardPath(user)}>
                  <LayoutDashboard className="size-4" aria-hidden />
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" className="gap-2" asChild>
                <Link to={ROUTES.login}>
                  <LogIn className="size-4" aria-hidden />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            className={cn("w-full gap-2 sm:w-auto")}
            asChild
          >
            <Link to={DASHBOARD_HREF[variant]}>
              <LayoutDashboard className="size-4" aria-hidden />
              Return to dashboard
            </Link>
          </Button>
        )}
      </div>

      <p className="mt-8 max-w-sm text-xs leading-relaxed text-muted-foreground">
        If you believe this is a system error, contact your LSIMS administrator
        with the page address you attempted to open.
      </p>
    </div>
  );
}
