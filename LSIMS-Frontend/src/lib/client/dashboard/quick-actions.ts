import { Bell, FilePlus2, MessageSquare, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ClientPathKey } from "@/lib/routing/app-routes";

export const CLIENT_QUICK_ACTION_ITEMS: {
  routeKey: ClientPathKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}[] = [
  {
    routeKey: "requests",
    title: "New request",
    subtitle: "Submit samples and select tests",
    icon: FilePlus2,
  },
  {
    routeKey: "results",
    title: "Track progress",
    subtitle: "Sample intake and test workflow",
    icon: TrendingUp,
  },
  {
    routeKey: "complaints",
    title: "Raise complaint",
    subtitle: "Payment, sample, or result issues",
    icon: MessageSquare,
  },
  {
    routeKey: "notifications",
    title: "Notifications",
    subtitle: "Job updates and lab messages",
    icon: Bell,
  },
];
