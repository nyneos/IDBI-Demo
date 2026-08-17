import type { Variants } from 'framer-motion';
import { EASE, MOTION, STAGGER, staggerDelay } from './tokens';

export const panelEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.slow / 1000,
      ease: EASE.enter,
      delay: staggerDelay(i, STAGGER.card, STAGGER.cardCap) / 1000,
    },
  }),
};

export const panelEnterReduced: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION.fast / 1000, ease: EASE.enter },
  },
};

export const rowEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.base / 1000,
      ease: EASE.enter,
      delay: staggerDelay(i, STAGGER.row, STAGGER.rowCap) / 1000,
    },
  }),
};

export const rowEnterReduced: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION.fast / 1000, ease: EASE.enter },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: MOTION.fast / 1000, ease: EASE.enter },
  },
};
