"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

type Props = {
  number: number;
};

export function CountUpNumber({ number }: Props) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, number, { duration: 2, delay: 0.5 });
    return animation.stop;
  }, [count, number]);

  return (
    <motion.span className="text-sm font-medium tabular-nums text-slate-950">
      {rounded}
    </motion.span>
  );
}
