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
});
