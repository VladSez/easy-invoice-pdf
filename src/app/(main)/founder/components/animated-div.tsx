"use client";

import { motion, type HTMLMotionProps, type Transition } from "motion/react";

export function blockEnterSpring(delay = 0.05): Transition {
  return {
    type: "spring",
    stiffness: 100,
    damping: 15,
    mass: 1,
    bounce: 0,
    duration: 0.3,
    delay,
  };
}

interface AnimatedDivProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode;
  transition: Transition;
}

export function AnimatedDiv({
  children,
  transition,
  className,
  ...rest
}: AnimatedDivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={transition}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
