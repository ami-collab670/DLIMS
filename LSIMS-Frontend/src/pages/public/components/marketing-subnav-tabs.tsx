import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { cn } from "@/lib/ui";

import { MOTION_DURATION, MOTION_EASE } from "@/pages/public/components/motion";

export function MarketingSubnavTabs({
  tabs,
}: {
  tabs: ReadonlyArray<{ label: string; href: string }>;
}) {
  const { pathname } = useLocation();

  return (
    <div className="relative -mt-8 z-10 mx-auto w-full max-w-7xl px-4">
      <div className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm md:px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={cn(
                  "relative shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="contact-tab-indicator"
                    className="absolute inset-0 rounded-md bg-primary"
                    transition={{ duration: MOTION_DURATION, ease: MOTION_EASE }}
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
