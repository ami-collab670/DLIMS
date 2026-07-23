import { motion } from "framer-motion";

import type { AboutMilestone } from "@/features/cms/types";
import { staggerItemVariants } from "./motion/marketing-motion";
import { usePrefersReducedMotion } from "./motion/use-prefers-reduced-motion";

const timelineContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function TimelineItemContent({
  milestone,
  isLast,
}: {
  milestone: AboutMilestone;
  isLast: boolean;
}) {
  return (
    <>
      {!isLast ? (
        <span
          aria-hidden
          className="absolute left-4 top-10 bottom-0 w-px bg-border md:left-5"
        />
      ) : null}
      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-semibold text-primary md:size-10 md:text-sm">
        {milestone.year.slice(2)}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">
          {milestone.year}
        </p>
        <h3 className="mt-1 text-base font-semibold md:text-lg">{milestone.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {milestone.description}
        </p>
      </div>
    </>
  );
}

export function MarketingTimeline({
  milestones,
}: {
  milestones: ReadonlyArray<AboutMilestone>;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return (
      <ol aria-label="Laboratory milestones" className="max-w-3xl">
        {milestones.map((milestone, index) => (
          <li
            key={milestone.year}
            className="relative flex gap-4 pb-10 last:pb-0 md:gap-6"
          >
            <TimelineItemContent
              milestone={milestone}
              isLast={index === milestones.length - 1}
            />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <motion.ol
      aria-label="Laboratory milestones"
      className="max-w-3xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={timelineContainerVariants}
    >
      {milestones.map((milestone, index) => (
        <motion.li
          key={milestone.year}
          className="relative flex gap-4 pb-10 last:pb-0 md:gap-6"
          variants={staggerItemVariants}
        >
          <TimelineItemContent
            milestone={milestone}
            isLast={index === milestones.length - 1}
          />
        </motion.li>
      ))}
    </motion.ol>
  );
}
