import { Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import type { ProcessStep } from "@/features/cms/types";
import {
  MOTION_EASE,
  staggerItemVariants,
} from "./motion/marketing-motion";
import { usePrefersReducedMotion } from "./motion/use-prefers-reduced-motion";

const flowContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const connectorHorizontalVariants = {
  hidden: { opacity: 0, scaleX: 0.6 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.35, ease: MOTION_EASE },
  },
};

const connectorVerticalVariants = {
  hidden: { opacity: 0, scaleY: 0.6 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.35, ease: MOTION_EASE },
  },
};

function ProcessStepCard({
  step,
  index,
}: {
  step: ProcessStep;
  index: number;
}) {
  return (
    <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {index + 1}
      </span>
      <h3 className="mt-4 font-semibold">{step.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
    </div>
  );
}

function ProcessStepConnector() {
  return (
    <>
      <motion.li
        variants={connectorVerticalVariants}
        aria-hidden
        className="flex h-8 shrink-0 items-center justify-center origin-top lg:hidden"
      >
        <ChevronDown className="size-5 text-primary/40" />
      </motion.li>
      <motion.li
        variants={connectorHorizontalVariants}
        aria-hidden
        className="hidden h-auto w-8 shrink-0 origin-left items-center justify-center lg:flex"
      >
        <ChevronRight className="size-5 text-primary/40" />
      </motion.li>
    </>
  );
}

function ProcessStepsStatic({ steps }: { steps: ReadonlyArray<ProcessStep> }) {
  return (
    <ol
      aria-label="Service access process"
      className="flex flex-col lg:flex-row lg:items-stretch"
    >
      {steps.map((step, index) => (
        <Fragment key={step.title}>
          <li className="min-w-0 flex-1">
            <ProcessStepCard step={step} index={index} />
          </li>
          {index < steps.length - 1 ? (
            <li
              aria-hidden
              className="flex h-8 shrink-0 items-center justify-center lg:h-auto lg:w-8"
            >
              <ChevronDown className="size-5 text-primary/40 lg:hidden" />
              <ChevronRight className="hidden size-5 text-primary/40 lg:block" />
            </li>
          ) : null}
        </Fragment>
      ))}
    </ol>
  );
}

export function MarketingProcessSteps({
  steps,
}: {
  steps: ReadonlyArray<ProcessStep>;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <ProcessStepsStatic steps={steps} />;
  }

  return (
    <motion.ol
      aria-label="Service access process"
      className="flex flex-col lg:flex-row lg:items-stretch"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={flowContainerVariants}
    >
      {steps.map((step, index) => (
        <Fragment key={step.title}>
          <motion.li className="min-w-0 flex-1" variants={staggerItemVariants}>
            <ProcessStepCard step={step} index={index} />
          </motion.li>
          {index < steps.length - 1 ? <ProcessStepConnector /> : null}
        </Fragment>
      ))}
    </motion.ol>
  );
}
