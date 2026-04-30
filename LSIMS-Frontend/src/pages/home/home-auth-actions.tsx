import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getDashboardPath } from "@/lib/dashboard-path";
import type { AuthUser } from "@/types/auth";

export function HomeAuthActions({
  user,
  ready,
}: {
  user: AuthUser | null;
  ready: boolean;
}) {
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
        <Link to="/login">Sign in</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link to="/signup">Create account</Link>
      </Button>
    </div>
  );
}
