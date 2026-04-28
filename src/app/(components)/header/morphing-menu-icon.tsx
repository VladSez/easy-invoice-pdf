"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, type Transition } from "motion/react";

const lineTransition = {
  type: "tween",
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1],
} as const satisfies Transition;

const closed = {
  line1: { x1: 3, y1: 6, x2: 21, y2: 6, opacity: 1 },
  line2: { x1: 3, y1: 12, x2: 21, y2: 12, opacity: 1 },
  line3: { x1: 3, y1: 18, x2: 21, y2: 18, opacity: 1 },
} as const;

const open = {
  line1: { x1: 5, y1: 5, x2: 19, y2: 19, opacity: 1 },
  line2: { x1: 12, y1: 12, x2: 12, y2: 12, opacity: 0 },
  line3: { x1: 19, y1: 5, x2: 5, y2: 19, opacity: 1 },
} as const;

interface MorphingMenuIconProps {
  isOpen: boolean;
  className?: string;
  "aria-hidden"?: boolean;
}

/**
 * Morphing menu icon that animates between hamburger and X states.
 *
 * **Inspired by:** https://benji.org/morphing-icons-with-claude
 */
export function MorphingMenuIcon({
  isOpen,
  className,
  "aria-hidden": ariaHidden = true,
}: MorphingMenuIconProps) {
  const prefersReducedMotion = useReducedMotion();

  const transition = prefersReducedMotion ? { duration: 0 } : lineTransition;

  const state = isOpen ? open : closed;

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
      initial={false} // prevent animation on mount
    >
      <motion.line
        initial={false} // prevent animation on mount
        animate={{
          x1: state.line1.x1,
          y1: state.line1.y1,
          x2: state.line1.x2,
          y2: state.line1.y2,
          opacity: state.line1.opacity,
        }}
        transition={transition}
      />
      <motion.line
        initial={false} // prevent animation on mount
        animate={{
          x1: state.line2.x1,
          y1: state.line2.y1,
          x2: state.line2.x2,
          y2: state.line2.y2,
          opacity: state.line2.opacity,
        }}
        transition={transition}
      />
      <motion.line
        initial={false} // prevent animation on mount
        animate={{
          x1: state.line3.x1,
          y1: state.line3.y1,
          x2: state.line3.x2,
          y2: state.line3.y2,
          opacity: state.line3.opacity,
        }}
        transition={transition}
      />
    </motion.svg>
  );
}
