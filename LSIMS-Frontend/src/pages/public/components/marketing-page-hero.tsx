import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
  usePrefersReducedMotion,
} from "@/pages/public/components/motion";

export function MarketingPageHero({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: fadeUpHidden,
        animate: fadeUpVisible,
      };

  return (
    <div className="relative flex min-h-[35vh] w-full items-center justify-center overflow-hidden bg-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center">
        {Icon ? (
          <motion.span
            {...motionProps}
            transition={fadeUpTransition(0)}
            className="flex size-[72px] items-center justify-center rounded-xl border border-background/20 bg-background/10 text-background"
          >
            <Icon className="size-8" aria-hidden />
          </motion.span>
        ) : null}
        <motion.h1
          {...motionProps}
          transition={fadeUpTransition(Icon ? 0.06 : 0)}
          className="max-w-3xl text-2xl font-semibold tracking-tight text-background sm:text-4xl lg:text-5xl"
        >
          {title}
        </motion.h1>
        <motion.p
          {...motionProps}
          transition={fadeUpTransition(Icon ? 0.12 : 0.06)}
          className="max-w-2xl text-sm text-background/85 sm:text-lg"
        >
          {subtitle}
        </motion.p>
      </div>
    </div>
  );
}
