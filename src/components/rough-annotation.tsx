"use client";

import { useEffect, useRef } from "react";
import { annotate } from "rough-notation";

import { cn } from "@/lib/utils";

/**
 * Draws a hand-drawn rough-notation mark (highlight, underline, box, ...) around its
 * children once they are on screen.
 *
 * rough-notation inserts its SVG as a sibling of the annotated element, so the element
 * it gets is an inner span: the outer span is the one React renders into the page, and
 * the SVG lands inside it instead of between nodes React manages.
 *
 * With `prefers-reduced-motion: reduce` the mark appears at once, without the drawing.
 */
export function RoughAnnotation({
  children,
  type,
  color,
  delayMs = 0,
  animationDuration = 800,
  strokeWidth = 1.5,
  padding = 5,
  iterations = 2,
  className,
}: RoughAnnotationProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const annotation = annotate(element, {
      type,
      color,
      animate: !reduceMotion,
      animationDuration,
      strokeWidth,
      padding,
      iterations,
      // One mark per line when the text wraps; boxes and brackets frame the whole block instead
      multiline: type !== "bracket" && type !== "box",
      brackets: type === "bracket" ? ["left", "right"] : undefined,
    });

    let timeout: number | undefined;

    // Starts the delay only once the element is visible, so marks further down the
    // page still draw in front of the reader instead of finishing off-screen.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        observer.disconnect();
        timeout = window.setTimeout(
          () => {
            annotation.show();
          },
          reduceMotion ? 0 : delayMs,
        );
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
      annotation.remove();
    };
  }, [
    type,
    color,
    delayMs,
    animationDuration,
    strokeWidth,
    padding,
    iterations,
  ]);

  return (
    <span className={cn("relative", className)}>
      <span ref={ref}>{children}</span>
    </span>
  );
}

export type RoughAnnotationType = Parameters<typeof annotate>[1]["type"];

interface RoughAnnotationProps {
  children: React.ReactNode;
  /** The kind of mark; `bracket` draws a bracket on both sides. */
  type: RoughAnnotationType;
  /** Any CSS colour. Highlights sit behind the text, so give them some transparency. */
  color: string;
  /** Wait after the element comes into view before drawing, to sequence several marks. */
  delayMs?: number;
  /** How long the drawing takes, in ms. */
  animationDuration?: number;
  /** Line width of the mark, in px. Ignored by `highlight`. */
  strokeWidth?: number;
  /** Space between the text and the mark, in px. */
  padding?: number;
  /** How many passes the pen makes. 1 is cleaner, 2 looks more hand-drawn. */
  iterations?: number;
  /** Classes for the outer span, e.g. font weight or text colour. */
  className?: string;
}
