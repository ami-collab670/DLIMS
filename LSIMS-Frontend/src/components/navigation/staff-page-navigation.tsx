import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { BackButton } from "@/components/navigation/back-button";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { useMergedBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { getStaffRouteBreadcrumbs } from "@/lib/staff-route-breadcrumbs";
import { useAuthStore } from "@/stores/auth-store";

export function StaffPageNavigation() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const routeSegments = useMemo(() => {
    return getStaffRouteBreadcrumbs(location.pathname, user).map((segment) => ({
      label: segment.label,
      href: segment.href,
    }));
  }, [location.pathname, user]);

  const segments = useMergedBreadcrumbSegments(routeSegments);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <BackButton />
      <Breadcrumb segments={segments} />
    </div>
  );
}
