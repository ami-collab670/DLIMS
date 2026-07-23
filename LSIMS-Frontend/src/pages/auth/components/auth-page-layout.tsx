import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { ThemeToggler } from "@/components/ThemeToggler";
import { APP_NAME_FALLBACK } from "@/features/cms/defaults";
import { useSiteSettings } from "@/features/cms/hooks";
import { ROUTES } from "@/lib/routing";
import { cn } from "@/lib/ui/cn";
import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "@/pages/public/components/motion/marketing-motion";
import { usePrefersReducedMotion } from "@/pages/public/components/motion/use-prefers-reduced-motion";

import { AuthBrandPanel, type AuthBrandVariant } from "./auth-brand-panel";

type AuthPageLayoutProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant: AuthBrandVariant;
  maxWidth?: "md" | "lg";
  headerExtra?: ReactNode;
};

export function AuthPageLayout({
  title,
  description,
  children,
  footer,
  variant,
  maxWidth = "md",
  headerExtra,
}: AuthPageLayoutProps) {
  const { data: siteSettings } = useSiteSettings();
  const siteName = siteSettings?.siteName ?? APP_NAME_FALLBACK;
  const prefersReducedMotion = usePrefersReducedMotion();

  const content = (
    <div
      className={cn(
        "w-full space-y-6",
        maxWidth === "lg" ? "max-w-lg" : "max-w-md",
      )}
    >
      <div className="space-y-2">
        {headerExtra ? <div>{headerExtra}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        {children}
      </div>

      {footer ? <div>{footer}</div> : null}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden">
      <AuthBrandPanel variant={variant} />

      <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 sm:px-6">
          <Link
            to={ROUTES.home}
            className="text-lg font-semibold tracking-tight hover:opacity-90"
          >
            {siteName}
          </Link>
          <ThemeToggler />
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto flex min-h-min w-full justify-center lg:min-h-full lg:items-center">
            {prefersReducedMotion ? (
              content
            ) : (
              <motion.div
                initial={fadeUpHidden}
                animate={fadeUpVisible}
                transition={fadeUpTransition()}
                className="flex w-full justify-center"
              >
                {content}
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
