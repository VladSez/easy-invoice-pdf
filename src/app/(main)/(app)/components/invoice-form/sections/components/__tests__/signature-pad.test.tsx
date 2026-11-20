// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { SignaturePad } from "../signature-pad";

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

    // drawing: the empty pad's prompt is gone
    expect(screen.queryByText("Draw signature")).not.toBeInTheDocument();

    // a second finger, or a palm, lands and lifts mid-stroke
    fireEvent.pointerDown(pad, {
      pointerId: 2,
      pointerType: "touch",
      button: 0,
    });
    fireEvent.pointerUp(pad, { pointerId: 2, pointerType: "touch" });

    expect(screen.queryByText("Draw signature")).not.toBeInTheDocument();

    fireEvent.pointerUp(pad, { pointerId: 1, pointerType: "touch" });

    expect(screen.getByText("Draw signature")).toBeInTheDocument();
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
