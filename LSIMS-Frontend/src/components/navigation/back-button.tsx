import { ChevronLeft } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  isStaffDashboardHome,
  useNavigationHistory,
} from "@/providers/navigation-history-provider";

type BackButtonProps = {
  className?: string;
};

export function BackButton({ className }: BackButtonProps) {
  const location = useLocation();
  const { goBack } = useNavigationHistory();

  if (isStaffDashboardHome(location.pathname)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("shrink-0 gap-1 -ml-2", className)}
      aria-label="Go back"
      onClick={goBack}
    >
      <ChevronLeft className="size-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  );
}
