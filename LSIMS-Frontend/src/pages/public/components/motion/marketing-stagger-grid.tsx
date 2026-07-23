import type { ReactNode } from "react";
import { Children } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/ui/cn";

import {
  staggerContainerVariants,
  staggerItemVariants,
} from "./marketing-motion";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export function MarketingStaggerGrid({
  children,
  className,
  itemClassName,
  staggerDelay = 0.05,
}: {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const items = Children.toArray(children);

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {items.map((child, index) => (
        <motion.div
          key={index}
          className={cn(itemClassName)}
          variants={staggerItemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export { staggerContainerVariants, staggerItemVariants };
