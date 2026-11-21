// @vitest-environment happy-dom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { StrictMode } from "react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_SAVE_DELAY_MS, SignaturePad } from "../signature-pad";

/** Makes the main pointer a finger (`pointer: coarse`) or a mouse. */
function mockPointer(kind: "touch" | "mouse") {
  vi.spyOn(window, "matchMedia").mockImplementation((query: string) => {
    // only what the pad reads
    return {
      matches: kind === "touch" && query === "(pointer: coarse)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
  });
}

function renderPad() {
  const onChange = vi.fn();

  render(<SignaturePad value="" onChange={onChange} label="Issued by" />);

  return {
    onChange,
    pad: screen.getByRole("img", { name: "Issued by signature pad" }),
  };
}

const SAVED_SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

/** Images that load only when a test says so, so a load can land after a change. */
function mockSlowImages() {
  const images: FakeImage[] = [];

  class FakeImage {
    width = 120;
    height = 40;
    src = "";
    private onLoad: (() => void) | null = null;

    constructor() {
      images.push(this);
    }

    addEventListener(type: string, listener: () => void) {
      if (type === "load") this.onLoad = listener;
    }

    finishLoading() {
      this.onLoad?.();
    }
  }

  vi.stubGlobal("Image", FakeImage);

  // a 2D context that records what gets drawn
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
    return new Proxy(
      { drawImage },
      {
        get(target, property) {
          return property in target
            ? target[property as keyof typeof target]
            : vi.fn();
        },
      },
    ) as unknown as CanvasRenderingContext2D;
  });

  return {
    images,
    /** Whether the saved signature's image was drawn onto a canvas. */
    wasImageDrawn: () => {
      return drawImage.mock.calls.some(([source]) => {
        return source instanceof FakeImage;
      });
    },
  };
}

/** One short mouse stroke across the pad. */
function drawStroke(pad: HTMLElement) {
  fireEvent.pointerDown(pad, {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: 10,
    clientY: 10,
  });
  fireEvent.pointerMove(pad, {
    pointerId: 1,
    pointerType: "mouse",
    clientX: 40,
    clientY: 20,
  });
  fireEvent.pointerUp(pad, {
    pointerId: 1,
    pointerType: "mouse",
    clientX: 40,
    clientY: 20,
  });
}

/** The pad's Clear button, there once it holds ink. */
function clearButton() {
  return screen.queryByRole("button", { name: "Clear Issued by signature" });
}

describe("SignaturePad", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("asks a touch screen to tap first, and lets a finger pass over it until then", () => {
    mockPointer("touch");
    const { pad } = renderPad();

    expect(screen.getByText("Tap to sign")).toBeInTheDocument();
    // unarmed, a finger on the pad still scrolls the page
    expect(pad).toHaveClass("touch-manipulation");

    // a swipe across it doesn't arm it or start drawing
    fireEvent.pointerDown(pad, { pointerType: "touch", button: 0 });
    fireEvent.pointerUp(pad, { pointerType: "touch" });

    expect(screen.queryByText("Tap outside when done")).not.toBeInTheDocument();
  });

  it("arms on a tap, then disarms on a tap elsewhere", () => {
    mockPointer("touch");
    const { pad } = renderPad();

    fireEvent.pointerDown(pad, { pointerType: "touch", button: 0 });
    fireEvent.click(pad);

    expect(screen.getByText("Tap outside when done")).toBeInTheDocument();
    expect(screen.getByText("Draw signature")).toBeInTheDocument();
    expect(pad).toHaveClass("touch-none");

    fireEvent.pointerDown(document.body, { pointerType: "touch" });

    expect(screen.queryByText("Tap outside when done")).not.toBeInTheDocument();
    expect(screen.getByText("Tap to sign")).toBeInTheDocument();
  });

  it("lets a mouse draw straight away", () => {
    mockPointer("mouse");
    const { pad } = renderPad();

    expect(screen.getByText("Draw signature")).toBeInTheDocument();
    expect(pad).toHaveClass("touch-none");

    // a click from a mouse never arms the pad: it doesn't need to be
    fireEvent.pointerDown(pad, { pointerType: "mouse", button: 0 });
    fireEvent.click(pad);

    expect(screen.queryByText("Tap outside when done")).not.toBeInTheDocument();
  });

  it("tells a touch screen that a signed pad can be tapped to add more", () => {
    mockPointer("touch");
    render(
      <SignaturePad
        value="data:image/png;base64,SAVED"
        onChange={vi.fn()}
        label="Issued by"
      />,
    );

    const pad = screen.getByRole("img", { name: "Issued by signature pad" });

    expect(screen.getByText("Tap to add more")).toBeInTheDocument();

    // armed, the same spot says how to finish instead
    fireEvent.pointerDown(pad, { pointerType: "touch", button: 0 });
    fireEvent.click(pad);

    expect(screen.queryByText("Tap to add more")).not.toBeInTheDocument();
    expect(screen.getByText("Tap outside when done")).toBeInTheDocument();
  });

  it("gives a mouse no tap hint on a signed pad: it draws straight away", () => {
    mockPointer("mouse");
    render(
      <SignaturePad
        value="data:image/png;base64,SAVED"
        onChange={vi.fn()}
        label="Issued by"
      />,
    );

    expect(screen.queryByText("Tap to add more")).not.toBeInTheDocument();
  });

  it("keeps a stroke to the pointer that started it", () => {
    mockPointer("touch");
    const { pad } = renderPad();

    // arm the pad with a tap, as on a phone
    fireEvent.pointerDown(pad, {
      pointerId: 9,
      pointerType: "touch",
      button: 0,
    });
    fireEvent.click(pad);

    fireEvent.pointerDown(pad, {
      pointerId: 1,
      pointerType: "touch",
      button: 0,
    });

    // drawing, and no finished stroke yet: no Clear button
    expect(screen.queryByText("Draw signature")).not.toBeInTheDocument();
    expect(clearButton()).not.toBeInTheDocument();

    // a second finger, or a palm, lands and lifts mid-stroke
    fireEvent.pointerDown(pad, {
      pointerId: 2,
      pointerType: "touch",
      button: 0,
    });
    fireEvent.pointerUp(pad, { pointerId: 2, pointerType: "touch" });

    // the stroke is still going: lifting the other finger didn't finish it
    expect(clearButton()).not.toBeInTheDocument();

    fireEvent.pointerUp(pad, { pointerId: 1, pointerType: "touch" });

    expect(clearButton()).toBeInTheDocument();
  });

  describe("saving once the signer pauses", () => {
    const INK = "data:image/png;base64,INK";

    beforeEach(() => {
      vi.useFakeTimers();
      mockPointer("mouse");
      // the test DOM can't encode a canvas; any stroke's export reads back as INK
      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(INK);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("saves once the signer pauses, not when each stroke ends", () => {
      const { pad, onChange } = renderPad();

      drawStroke(pad);
      act(() => {
        vi.advanceTimersByTime(IDLE_SAVE_DELAY_MS - 1);
      });

      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith(INK);
    });

    it("waits again when another stroke starts before the pause is up", () => {
      const { pad, onChange } = renderPad();

      // a second stroke inside the wait, then most of a wait again: still holding
      drawStroke(pad);
      act(() => {
        vi.advanceTimersByTime(IDLE_SAVE_DELAY_MS - 100);
      });
      drawStroke(pad);
      act(() => {
        vi.advanceTimersByTime(IDLE_SAVE_DELAY_MS - 100);
      });

      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onChange).toHaveBeenCalledOnce();
    });

    it("saves at once on a click outside the pad, or a key press", () => {
      const { pad, onChange } = renderPad();

      drawStroke(pad);
      fireEvent.pointerDown(document.body, { pointerType: "mouse" });

      expect(onChange).toHaveBeenCalledWith(INK);

      drawStroke(pad);
      fireEvent.keyDown(document.body, { key: "Tab" });

      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it("drops held ink on Clear, so it can't come back", () => {
      const { pad, onChange } = renderPad();

      drawStroke(pad);
      fireEvent.click(
        screen.getByRole("button", { name: "Clear Issued by signature" }),
      );
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("drops held ink when the pad goes away, so Remove stays removed", () => {
      const { pad, onChange } = renderPad();

      drawStroke(pad);
      cleanup();
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("restoring a saved signature", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("draws the saved signature once its image loads", () => {
      mockPointer("mouse");
      const { images, wasImageDrawn } = mockSlowImages();

      render(
        <SignaturePad
          value={SAVED_SIGNATURE}
          onChange={vi.fn()}
          label="Issued by"
        />,
      );

      for (const image of images) image.finishLoading();

      expect(wasImageDrawn()).toBe(true);
    });

    // development mounts, unmounts and mounts again; the unmount cancels the first load, so
    // the second mount has to start its own, or the pad comes back empty after a reload
    it("draws the saved signature under Strict Mode's double mount", () => {
      mockPointer("mouse");
      const { images, wasImageDrawn } = mockSlowImages();

      render(
        <StrictMode>
          <SignaturePad
            value={SAVED_SIGNATURE}
            onChange={vi.fn()}
            label="Issued by"
          />
        </StrictMode>,
      );

      for (const image of images) image.finishLoading();

      expect(wasImageDrawn()).toBe(true);
    });

    it("doesn't paint a signature back when its image loads after Clear", () => {
      mockPointer("mouse");
      const { images, wasImageDrawn } = mockSlowImages();

      const { rerender } = render(
        <SignaturePad
          value={SAVED_SIGNATURE}
          onChange={vi.fn()}
          label="Issued by"
        />,
      );

      // Clear empties the value before the saved image has loaded
      rerender(<SignaturePad value="" onChange={vi.fn()} label="Issued by" />);

      for (const image of images) image.finishLoading();

      expect(wasImageDrawn()).toBe(false);
    });
  });
});
