import { Link as LinkIcon, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function StaffAdminPromoCard() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-5 text-primary" aria-hidden />
          <div>
            <p className="font-medium">User management</p>
            <p className="text-sm text-muted-foreground">
              Create staff and client accounts, assign roles, and deactivate users.
            </p>
          </div>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link to="/staff/users">
            <LinkIcon className="size-4" />
            Open user management
          </Link>
        </Button>
      </div>
    </div>
  );
}
