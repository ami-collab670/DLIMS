import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { cn } from "@/lib/ui/cn";

import { MARKETING_CARD_CLASS } from "../../marketing-ui";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

type GlowState = {
  x: number;
  y: number;
  active: boolean;
};

export function MarketingGlowCard({
  className,
  children,
  glowRadius = 420,
  to,
}: {
  className?: string;
  children: ReactNode;
  glowRadius?: number;
  to?: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState<GlowState>({ x: 50, y: 50, active: false });

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      setGlow({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
        active: true,
      });
    },
    [prefersReducedMotion],
  );

  const handleMouseLeave = useCallback(() => {
    setGlow((current) => ({ ...current, active: false }));
  }, []);

  const glowStyle = glow.active
    ? {
        background: `radial-gradient(${glowRadius}px circle at ${glow.x}% ${glow.y}%, color-mix(in oklch, var(--primary) 14%, transparent) 0%, transparent 55%)`,
      }
    : undefined;

  const inner = to ? (
    <Link to={to} className="relative z-10 block h-full">
      {children}
    </Link>
  ) : (
    <div className="relative z-10">{children}</div>
  );

  return (
    <motion.div
      ref={ref}
      className={cn(MARKETING_CARD_CLASS, "group relative overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {!prefersReducedMotion ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-200",
            glow.active ? "opacity-100" : "opacity-0",
          )}
          style={glowStyle}
          aria-hidden
        />
      ) : null}
      {inner}
    </motion.div>
  );
}
