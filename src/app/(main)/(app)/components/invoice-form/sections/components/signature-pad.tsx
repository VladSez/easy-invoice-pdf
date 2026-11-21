import { PenLine } from "lucide-react";
import { getStroke, type StrokeOptions } from "perfect-freehand";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A pad to draw a signature on with a mouse, trackpad, pen or finger. Strokes are smoothed
 * with perfect-freehand, which also varies their width with speed (or pen pressure), so
 * they read as ink rather than a fixed-width line.
 *
 * The ink is saved as a PNG cropped to it, so the PDF can print it at full size. A saved
 * signature is drawn back onto the pad when the form opens, and further strokes add to it.
 *
 * The save waits for a short pause (`IDLE_SAVE_DELAY_MS` with no new stroke), so a signature
 * reaches the form, and the PDF is rebuilt, once rather than after every stroke, and never in
 * the middle of one: a rebuild blocks the main thread and would freeze the ink. The form
 * skips its own debounce for it, so the PDF follows the pause directly. Anything that ends
 * signing sends it at once: a tap or click outside the pad, a key press, the page hidden.
 */
export function SignaturePad({
  value,
  onChange,
  label,
  testId,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The finished strokes, kept off screen so the stroke in progress can be redrawn on top
  // of them on every move (perfect-freehand reshapes the whole stroke as it grows).
  const inkLayerRef = useRef<HTMLCanvasElement | null>(null);

  // the stroke in progress, as [x, y, pressure] in CSS pixels; null between strokes
  const strokeRef = useRef<StrokePoint[] | null>(null);

  // the pointer drawing that stroke: a second finger or a resting palm neither starts a
  // new stroke over it nor adds points to it
  const activePointerIdRef = useRef<number | null>(null);

  // a pen reports real pressure; a mouse, trackpad or finger gets it simulated from speed
  const simulatePressureRef = useRef(true);

  // where the ink is, in CSS pixels, so a save crops to it without reading the pixels back
  const inkBoundsRef = useRef<InkBounds | null>(null);

  // the value this pad saved last, so its own saves aren't drawn back over the strokes
  const savedValueRef = useRef(value);

  // a restore that a cleanup cut short before its image loaded (Strict Mode's mount, unmount,
  // mount in development, or a value change mid-load); the next run must draw again even
  // though neither the size nor the value differs from what it saw
  const isRestoreInterruptedRef = useRef(false);

  // ink drawn but not yet sent to the form, waiting for the signer to pause
  const pendingValueRef = useRef<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingInk, setHasPendingInk] = useState(false);

  // the latest onChange, for the timer and listeners that outlive a render
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // stable: they touch only refs and a state setter, so effects can list them
  const cancelIdleSave = useCallback(() => {
    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = null;
  }, []);

  /** Sends held ink to the form now. */
  const flushPendingInk = useCallback(() => {
    cancelIdleSave();

    const pending = pendingValueRef.current;

    if (pending === null) return;

    pendingValueRef.current = null;
    setHasPendingInk(false);
    onChangeRef.current(pending);
  }, [cancelIdleSave]);

  /** Forgets held ink: Clear, Remove or a restored invoice replaced it. */
  const discardPendingInk = useCallback(() => {
    cancelIdleSave();
    pendingValueRef.current = null;
    setHasPendingInk(false);
  }, [cancelIdleSave]);

  const [isDrawing, setIsDrawing] = useState(false);
  const hasInk = Boolean(value) || isDrawing || hasPendingInk;

  // On a touch screen a finger also scrolls, so the pad stays out of the way until it's
  // tapped: unarmed, a swipe across it scrolls the page; armed, it draws. A tap anywhere
  // else disarms it. Mouse, trackpad and pen can't scroll by dragging, so they draw at once.
  const isTouchScreen = useIsTouchScreen();
  const [isArmed, setIsArmed] = useState(false);
  const isArmedRef = useRef(false);
  const padRef = useRef<HTMLDivElement>(null);
  const lastPointerTypeRef = useRef("");

  const setArmed = (armed: boolean) => {
    isArmedRef.current = armed;
    setIsArmed(armed);
  };

  useEffect(() => {
    if (!isArmed) return;

    const disarmOnTapElsewhere = (event: PointerEvent) => {
      if (padRef.current?.contains(event.target as Node)) return;

      isArmedRef.current = false;
      setIsArmed(false);
    };

    document.addEventListener("pointerdown", disarmOnTapElsewhere, true);

    return () => {
      document.removeEventListener("pointerdown", disarmOnTapElsewhere, true);
    };
  }, [isArmed]);

  // Held ink goes to the form as soon as signing is over. Every way off the pad (Remove,
  // another field, the template switch, closing the tab) starts with one of these, so the
  // pad drops, not sends, anything still held when it unmounts: sending then would write a
  // signature back after Remove has cleared it.
  useEffect(() => {
    if (!hasPendingInk) return;

    const flushOnPointerElsewhere = (event: PointerEvent) => {
      if (padRef.current?.contains(event.target as Node)) return;

      flushPendingInk();
    };
    const flushOnHidden = () => {
      if (document.visibilityState === "hidden") flushPendingInk();
    };

    document.addEventListener("pointerdown", flushOnPointerElsewhere, true);
    document.addEventListener("keydown", flushPendingInk, true);
    document.addEventListener("visibilitychange", flushOnHidden);
    window.addEventListener("pagehide", flushPendingInk);

    return () => {
      document.removeEventListener(
        "pointerdown",
        flushOnPointerElsewhere,
        true,
      );
      document.removeEventListener("keydown", flushPendingInk, true);
      document.removeEventListener("visibilitychange", flushOnHidden);
      window.removeEventListener("pagehide", flushPendingInk);
    };
  }, [hasPendingInk, flushPendingInk]);

  useEffect(() => {
    return () => {
      cancelIdleSave();
    };
  }, [cancelIdleSave]);

  // Size the bitmap to the pad, and redraw the saved signature whenever that size changes or
  // the value changes from outside (a restored invoice, Remove, Clear).
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    inkLayerRef.current ??= document.createElement("canvas");
    const inkLayer = inkLayerRef.current;

    // the saved signature loads asynchronously; a load that lands after Clear, Remove or a
    // newer redraw would paint stale ink back, and the next stroke would save it again
    let cancelPendingDraw: (() => void) | null = null;

    function redraw() {
      if (!canvas) return;

      const isResized = sizeCanvasToElement(canvas);
      const isExternalChange = savedValueRef.current !== value;
      const isInterrupted = isRestoreInterruptedRef.current;

      if (!isResized && !isExternalChange && !isInterrupted) return;

      // a value from outside (Clear, Remove, a restored invoice) replaces any held ink
      if (isExternalChange) discardPendingInk();

      isRestoreInterruptedRef.current = false;
      savedValueRef.current = value;
      inkBoundsRef.current = null;
      inkLayer.width = canvas.width;
      inkLayer.height = canvas.height;
      paint({ canvas, inkLayer, stroke: null });

      cancelPendingDraw?.();
      cancelPendingDraw = null;

      if (value) {
        cancelPendingDraw = drawSavedSignature({
          inkLayer,
          dataUrl: value,
          onDrawn: (bounds) => {
            cancelPendingDraw = null;
            inkBoundsRef.current = bounds;
            paint({ canvas, inkLayer, stroke: null });
          },
        });
      }
    }

    redraw();

    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);

    return () => {
      observer.disconnect();

      // still loading: cancel it, so a stale image can't land later, and have the next run
      // draw the current value instead (it always draws `value`, so a Clear stays cleared)
      if (cancelPendingDraw) {
        cancelPendingDraw();
        isRestoreInterruptedRef.current = true;
      }
    };
  }, [value, discardPendingInk]);

  // While armed, iOS would still treat a touch on the pad as a page gesture too: a double
  // tap zooms, a long press selects and opens the loupe, a pinch zooms. React's touch
  // listeners are passive and can't stop that, so cancel those gestures with native,
  // non-passive listeners. Unarmed, touches are left alone, so the page scrolls.
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const preventPageGesture = (event: Event) => {
      if (isArmedRef.current && event.cancelable) event.preventDefault();
    };
    const events = ["touchstart", "touchmove", "touchend", "gesturestart"];

    for (const type of events) {
      canvas.addEventListener(type, preventPageGesture, { passive: false });
    }

    return () => {
      for (const type of events) {
        canvas.removeEventListener(type, preventPageGesture);
      }
    };
  }, []);

  function addPoints(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const stroke = strokeRef.current;

    if (!stroke) return;

    // coalesced events carry the points the browser merged into this one, for a rounder line
    const events = event.nativeEvent.getCoalescedEvents?.() ?? [];

    for (const pointerEvent of events.length > 0
      ? events
      : [event.nativeEvent]) {
      const point = getPoint({ canvas, event: pointerEvent });

      stroke.push(point);
      inkBoundsRef.current = growBounds(inkBoundsRef.current, point);
    }
  }

  function finishStroke(canvas: HTMLCanvasElement) {
    const stroke = strokeRef.current;
    const inkLayer = inkLayerRef.current;

    strokeRef.current = null;
    activePointerIdRef.current = null;
    setIsDrawing(false);

    if (!stroke || !inkLayer) return;

    fillStroke({
      canvas: inkLayer,
      stroke,
      isComplete: true,
      simulatePressure: simulatePressureRef.current,
    });
    paint({ canvas, inkLayer, stroke: null });

    const bounds = inkBoundsRef.current;

    if (!bounds) return;

    const dataUrl = exportInk({ canvas: inkLayer, bounds });

    // held until the signer pauses; a stroke started before then restarts the wait
    savedValueRef.current = dataUrl;
    pendingValueRef.current = dataUrl;
    setHasPendingInk(true);
    cancelIdleSave();
    idleTimerRef.current = setTimeout(flushPendingInk, IDLE_SAVE_DELAY_MS);
  }

  return (
    <div
      ref={padRef}
      className={cn(
        // never selectable or long-pressable, so drawing can't pick up a selection or callout
        "relative h-[140px] select-none overflow-hidden rounded-lg border bg-white [-webkit-touch-callout:none] max-md:h-[180px]",
        hasInk
          ? "border-gray-300"
          : "border-dashed border-slate-300 bg-slate-50",
        isArmed && "border-solid border-indigo-500 ring ring-indigo-200",
      )}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${label} signature pad`}
        data-testid={testId}
        className={cn(
          "absolute inset-0 size-full cursor-crosshair",
          // unarmed, a finger on the pad still scrolls the page
          isArmed || !isTouchScreen ? "touch-none" : "touch-manipulation",
        )}
        onClick={() => {
          // a tap, never the end of a scroll: browsers send no click after one
          if (lastPointerTypeRef.current === "touch" && !isArmedRef.current) {
            setArmed(true);
          }
        }}
        onPointerDown={(event) => {
          lastPointerTypeRef.current = event.pointerType;

          if (event.button !== 0 || !inkLayerRef.current) return;

          // an unarmed pad ignores a finger, which may be scrolling past
          if (event.pointerType === "touch" && !isArmedRef.current) return;

          // one stroke at a time, owned by the pointer that started it
          if (activePointerIdRef.current !== null) return;

          // a drag that starts here draws; it must not start a text selection
          event.preventDefault();

          const canvas = event.currentTarget;

          // keeps the stroke going past the pad's edge; a pointer already gone (iOS can
          // cancel a touch mid-gesture) can't be captured, and the stroke still draws
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch {
            // nothing to capture
          }

          activePointerIdRef.current = event.pointerId;
          // still signing: wait for the next pause before saving
          cancelIdleSave();

          strokeRef.current = [];
          simulatePressureRef.current = event.pointerType !== "pen";
          setIsDrawing(true);
          addPoints(event);
          paint({
            canvas,
            inkLayer: inkLayerRef.current,
            stroke: strokeRef.current,
            simulatePressure: simulatePressureRef.current,
          });
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== activePointerIdRef.current) return;

          if (!strokeRef.current || !inkLayerRef.current) return;

          addPoints(event);
          paint({
            canvas: event.currentTarget,
            inkLayer: inkLayerRef.current,
            stroke: strokeRef.current,
            simulatePressure: simulatePressureRef.current,
          });
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== activePointerIdRef.current) return;

          finishStroke(event.currentTarget);
        }}
        onPointerCancel={(event) => {
          if (event.pointerId !== activePointerIdRef.current) return;

          finishStroke(event.currentTarget);
        }}
      />

      {/* the empty pad's prompt; clicks fall through to the canvas */}
      {hasInk ? null : (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[13px] text-slate-500">
          <PenLine className="size-[18px]" aria-hidden="true" />
          {isTouchScreen && !isArmed ? "Tap to sign" : "Draw signature"}
        </div>
      )}

      {/* on a touch screen, the before and after of arming, in the same spot: a signed pad
          otherwise gives no hint that a tap lets you keep drawing */}
      {isArmed ? (
        <span className="pointer-events-none absolute bottom-1.5 left-2.5 text-xs text-indigo-600">
          Tap outside when done
        </span>
      ) : isTouchScreen && hasInk ? (
        <span className="pointer-events-none absolute bottom-1.5 left-2.5 text-xs text-slate-500">
          Tap to add more
        </span>
      ) : null}

      {value || hasPendingInk ? (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1 h-[26px] bg-white/90 px-2 text-[13px] font-normal text-slate-500 max-md:h-9"
          aria-label={`Clear ${label} signature`}
          onClick={() => {
            discardPendingInk();
            onChange("");
          }}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}

/** Whether the main pointer is a finger, whose drag scrolls the page. */
function useIsTouchScreen() {
  return useSyncExternalStore(
    subscribeToPointerQuery,
    () => {
      return window.matchMedia(COARSE_POINTER_QUERY).matches;
    },
    // the server can't know; the client corrects it right after hydration
    () => {
      return false;
    },
  );
}

function subscribeToPointerQuery(onChange: () => void) {
  const query = window.matchMedia(COARSE_POINTER_QUERY);

  query.addEventListener("change", onChange);

  return () => {
    query.removeEventListener("change", onChange);
  };
}

const COARSE_POINTER_QUERY = "(pointer: coarse)";

/**
 * How long the pad waits after a stroke, with no new one, before saving the signature: long
 * enough to span the quick pauses between a signature's strokes, short enough that the PDF
 * updates right after the signer stops.
 */
export const IDLE_SAVE_DELAY_MS = 500;

const INK_COLOR = "#000000";

/**
 * How perfect-freehand shapes a stroke. `size` is the pen's widest diameter in CSS pixels;
 * `thinning` lets fast movement draw thinner, as a real pen does, and `easing` ramps that
 * change in gently so the width never jumps; `streamline` makes the pen trail the pointer
 * slightly, which irons out a mouse's or finger's jitter, and `smoothing` softens the
 * outline's edges; `start`/`end` taper each stroke so it lifts off like ink.
 */
const STROKE_OPTIONS = {
  size: 3.4,
  thinning: 0.5,
  smoothing: 0.8,
  streamline: 0.65,
  easing: easeOutSine,
  start: { taper: 6, cap: true },
  end: { taper: 10, cap: true },
} as const satisfies StrokeOptions;

function easeOutSine(t: number) {
  return Math.sin((t * Math.PI) / 2);
}

/** Blank space kept around the ink when it's cropped, in CSS pixels. */
const CROP_PADDING = 4;

/**
 * Bitmap pixels per CSS pixel. Capped at 2: sharp enough to print at signature size, and it
 * keeps the saved image (stored in localStorage) small.
 */
function getPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/** Matches the bitmap to the canvas's CSS size; `true` when it had to change. */
function sizeCanvasToElement(canvas: HTMLCanvasElement) {
  const ratio = getPixelRatio();
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);

  if (canvas.width === width && canvas.height === height) return false;

  canvas.width = width;
  canvas.height = height;

  return true;
}

/** The pointer's position on the canvas in CSS pixels, with its pen pressure. */
function getPoint({ canvas, event }: GetPointArgs): StrokePoint {
  const rect = canvas.getBoundingClientRect();

  return [event.clientX - rect.left, event.clientY - rect.top, event.pressure];
}

/** Shows the finished strokes, plus the stroke in progress on top when there is one. */
function paint({ canvas, inkLayer, stroke, simulatePressure }: PaintArgs) {
  const context = canvas.getContext("2d");

  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  if (inkLayer.width > 0 && inkLayer.height > 0) {
    context.drawImage(inkLayer, 0, 0);
  }

  if (stroke) {
    fillStroke({ canvas, stroke, isComplete: false, simulatePressure });
  }
}

/** Fills a stroke's smoothed outline onto a canvas. */
function fillStroke({
  canvas,
  stroke,
  isComplete,
  simulatePressure = true,
}: FillStrokeArgs) {
  const context = canvas.getContext("2d");

  if (!context || stroke.length === 0) return;

  const outline = getStroke(stroke, {
    ...STROKE_OPTIONS,
    simulatePressure,
    last: isComplete,
  });

  const ratio = getPixelRatio();

  context.save();
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.fillStyle = INK_COLOR;
  // oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- a canvas fill, not Array.prototype.fill
  context.fill(new Path2D(getSvgPathFromOutline(outline)));
  context.restore();
}

/**
 * Turns perfect-freehand's outline points into an SVG path, with a quadratic curve through
 * the midpoint of each pair so the edge stays smooth (the library's documented recipe).
 */
function getSvgPathFromOutline(points: number[][]) {
  if (points.length < 4) {
    // too short to curve (a tap): a small dot at the first point
    const [x = 0, y = 0] = points[0] ?? [];
    const radius = STROKE_OPTIONS.size / 2;

    return `M ${x - radius},${y} a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 ${-radius * 2},0`;
  }

  const [[ax, ay], [bx, by], [cx, cy]] = points;
  let path = `M${ax},${ay} Q${bx},${by} ${average(bx, cx)},${average(by, cy)} T`;

  for (let index = 2; index < points.length - 1; index++) {
    const [x0, y0] = points[index];
    const [x1, y1] = points[index + 1];

    path += `${average(x0, x1)},${average(y0, y1)} `;
  }

  return `${path}Z`;
}

function average(a: number, b: number) {
  return (a + b) / 2;
}

function growBounds(bounds: InkBounds | null, [x, y]: StrokePoint): InkBounds {
  if (!bounds) {
    return { left: x, top: y, right: x, bottom: y };
  }

  return {
    left: Math.min(bounds.left, x),
    top: Math.min(bounds.top, y),
    right: Math.max(bounds.right, x),
    bottom: Math.max(bounds.bottom, y),
  };
}

/** Copies the inked part of a canvas into a PNG data URL. */
function exportInk({ canvas, bounds }: ExportInkArgs) {
  const ratio = getPixelRatio();
  const margin = STROKE_OPTIONS.size / 2 + CROP_PADDING;

  const left = Math.max(0, Math.floor((bounds.left - margin) * ratio));
  const top = Math.max(0, Math.floor((bounds.top - margin) * ratio));
  const right = Math.min(
    canvas.width,
    Math.ceil((bounds.right + margin) * ratio),
  );
  const bottom = Math.min(
    canvas.height,
    Math.ceil((bounds.bottom + margin) * ratio),
  );

  const crop = document.createElement("canvas");
  crop.width = Math.max(1, right - left);
  crop.height = Math.max(1, bottom - top);
  crop
    .getContext("2d")
    ?.drawImage(
      canvas,
      left,
      top,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );

  return crop.toDataURL("image/png");
}

/**
 * Draws a saved signature back onto the ink layer, centred, at the size it was drawn (or
 * smaller, if the pad has since become narrower), and reports where it landed. Returns a
 * function that cancels the draw if the image hasn't loaded yet.
 */
function drawSavedSignature({ inkLayer, dataUrl, onDrawn }: DrawSavedArgs) {
  const image = new Image();
  let isCancelled = false;

  image.addEventListener("load", () => {
    if (isCancelled) return;

    const context = inkLayer.getContext("2d");

    if (!context) return;

    const ratio = getPixelRatio();
    const scale = Math.min(
      1,
      inkLayer.width / image.width,
      inkLayer.height / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (inkLayer.width - width) / 2;
    const y = (inkLayer.height - height) / 2;

    context.drawImage(image, x, y, width, height);

    onDrawn({
      left: x / ratio,
      top: y / ratio,
      right: (x + width) / ratio,
      bottom: (y + height) / ratio,
    });
  });

  image.src = dataUrl;

  return () => {
    isCancelled = true;
  };
}

interface SignaturePadProps {
  /** The saved signature as a PNG data URL, or "" for none. */
  value: string;
  /** Receives the new PNG after each stroke, and "" when the pad is cleared. */
  onChange: (dataUrl: string) => void;
  /** Who signs, e.g. "Issued by"; names the pad and its Clear button. */
  label: string;
  testId?: string;
}

/** A point of a stroke: x and y in CSS pixels, and pen pressure from 0 to 1. */
type StrokePoint = [x: number, y: number, pressure: number];

/** A box around the ink, in CSS pixels. */
interface InkBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface GetPointArgs {
  canvas: HTMLCanvasElement;
  event: PointerEvent;
}

interface PaintArgs {
  canvas: HTMLCanvasElement;
  /** The finished strokes. */
  inkLayer: HTMLCanvasElement;
  /** The stroke in progress, or null between strokes. */
  stroke: StrokePoint[] | null;
  /** Fake pressure from speed, for input without a real pressure reading. */
  simulatePressure?: boolean;
}

interface FillStrokeArgs {
  canvas: HTMLCanvasElement;
  stroke: StrokePoint[];
  /** The pointer is up, so the stroke's end is drawn as final rather than still moving. */
  isComplete: boolean;
  simulatePressure?: boolean;
}

interface ExportInkArgs {
  canvas: HTMLCanvasElement;
  bounds: InkBounds;
}

interface DrawSavedArgs {
  inkLayer: HTMLCanvasElement;
  dataUrl: string;
  /** Called with where the signature landed, once it's drawn. */
  onDrawn: (bounds: InkBounds) => void;
}
