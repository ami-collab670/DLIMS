import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/ui/cn";

import {
  fadeUpHidden,
  fadeUpTransition,
  fadeUpVisible,
} from "./marketing-motion";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export function MarketingFadeInView({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={fadeUpHidden}
      whileInView={fadeUpVisible}
      viewport={{ once: true, amount: 0.2 }}
      transition={fadeUpTransition()}
    >
      {children}
    </motion.div>
  );
}
