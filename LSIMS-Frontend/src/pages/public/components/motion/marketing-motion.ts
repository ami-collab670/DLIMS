export const MOTION_EASE = [0.25, 0.1, 0.25, 1] as const;
export const MOTION_DURATION = 0.45;

export const fadeUpTransition = (delay = 0) => ({
  duration: MOTION_DURATION,
  ease: MOTION_EASE,
  delay,
});

export const fadeUpHidden = { opacity: 0, y: 12 };
export const fadeUpVisible = { opacity: 1, y: 0 };

export const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItemVariants = {
  hidden: fadeUpHidden,
  visible: {
    ...fadeUpVisible,
    transition: {
      duration: MOTION_DURATION,
      ease: MOTION_EASE,
    },
  },
};
