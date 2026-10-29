// @vitest-environment happy-dom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { StripeTopLineColorPicker } from "../stripe-top-line-color-picker";

function renderPicker({ value }: { value?: string } = {}) {
  const onChange = vi.fn();

  render(<StripeTopLineColorPicker value={value} onChange={onChange} />);

  return { onChange };
}

describe("StripeTopLineColorPicker", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks the default amber as picked while the invoice has no color", () => {
    renderPicker();

    expect(
      screen.getByRole("button", { name: "Amber (default)" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).not.toBeInTheDocument();
  });

  it("writes a preset's color when it is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    await user.click(screen.getByRole("button", { name: "Indigo" }));

    expect(onChange).toHaveBeenCalledWith("#635bff");
  });

  it("clears the field rather than writing the default color back", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#635bff" });

    await user.click(screen.getByRole("button", { name: "Amber (default)" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("resets a picked color to the default", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#635bff" });

    await user.click(screen.getByRole("button", { name: "Reset to default" }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it.each([
    ["a preset", "#635bff"],
    ["a custom", "#e11d48"],
  ])(
    "keeps the picker closed for %s color until the custom button is clicked",
    async (_kind, value) => {
      const user = userEvent.setup();
      renderPicker({ value });

      const customButton = screen.getByRole("button", { name: "Custom color" });

      expect(customButton).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByLabelText("Hex color")).not.toBeInTheDocument();

      await user.click(customButton);

      expect(customButton).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("dialog", { name: "Custom top line color" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Hex color")).toBeInTheDocument();
    },
  );

  it("closes the picker on Escape", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole("button", { name: "Custom color" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByLabelText("Hex color")).not.toBeInTheDocument();
  });

  it("names a color none of the presets match as custom", () => {
    renderPicker({ value: "#e11d48" });

    expect(screen.getByText("Custom ·", { exact: false })).toBeInTheDocument();
  });

  it("writes a typed hex color once typing settles", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#635bff" });

    await user.click(screen.getByRole("button", { name: "Custom color" }));

    const hexField = screen.getByLabelText("Hex color");
    await user.clear(hexField);
    await user.type(hexField, "E11D48");

    // the caption follows the draft at once, the form does not
    expect(
      screen.getByText("#e11d48", { exact: false, ignore: "input" }),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith("#e11d48");
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("leaves a half-deleted value as typed instead of reading it as a shorthand", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#fbbf24" });

    await user.click(screen.getByRole("button", { name: "Custom color" }));

    const hexField = screen.getByLabelText("Hex color");
    await user.click(hexField);
    await user.keyboard("{End}{Backspace}{Backspace}{Backspace}");

    expect(hexField).toHaveValue("FBB");

    // give a debounced write every chance to land
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });

    expect(hexField).toHaveValue("FBB");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("spells out a shorthand once the field loses focus", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#635bff" });

    await user.click(screen.getByRole("button", { name: "Custom color" }));

    const hexField = screen.getByLabelText("Hex color");
    await user.clear(hexField);
    await user.type(hexField, "fa0");

    expect(hexField).toHaveValue("FA0");

    fireEvent.blur(hexField);

    expect(hexField).toHaveValue("FFAA00");
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith("#ffaa00");
    });
  });

  it("writes the color still waiting when the picker closes", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({ value: "#635bff" });

    await user.click(screen.getByRole("button", { name: "Custom color" }));

    fireEvent.change(screen.getByLabelText("Hex color"), {
      target: { value: "e11d48" },
    });

    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");

    expect(onChange).toHaveBeenCalledWith("#e11d48");
  });
});
