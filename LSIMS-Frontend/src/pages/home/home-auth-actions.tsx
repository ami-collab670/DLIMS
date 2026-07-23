import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useHomePage } from "@/features/cms/hooks";
import { getDashboardPath, ROUTES } from "@/lib/routing";
import type { AuthUser } from "@/types/auth";

export function HomeAuthActions({
  user,
  ready,
}: {
  user: AuthUser | null;
  ready: boolean;
}) {
  const { data: homePage } = useHomePage();
  const primaryLabel = homePage?.heroSlides[0]?.primaryCta?.label ?? "Sign in";
  const secondaryLabel =
    homePage?.heroSlides[0]?.secondaryCta?.label ?? "Create account";

  if (!ready) return null;

  if (user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to={getDashboardPath(user)}>Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link to={ROUTES.login}>{primaryLabel}</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link to={ROUTES.signup}>{secondaryLabel}</Link>
      </Button>
    </div>
  );
}
