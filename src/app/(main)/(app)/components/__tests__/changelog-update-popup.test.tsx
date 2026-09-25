// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ChangelogUpdatePopup } from "../changelog-update-popup";

const RELEASE_SUMMARY =
  "Pick your number format and invoice in Brazilian Portuguese.";

describe("ChangelogUpdatePopup", () => {
  afterEach(() => {
    cleanup();
  });

  it("says a few words about the latest release when its post has a summary", () => {
    render(
      <ChangelogUpdatePopup
        variant="changelog"
        isOpen
        onDismiss={vi.fn()}
        releaseSummary={RELEASE_SUMMARY}
      />,
    );

    const popup = screen.getByTestId("changelog-update-popup");

    expect(popup).toHaveTextContent(RELEASE_SUMMARY);
    expect(popup).not.toHaveTextContent(
      "Check out recent features and improvements.",
    );
  });

  it("falls back to the generic line when the post has no summary", () => {
    render(
      <ChangelogUpdatePopup variant="changelog" isOpen onDismiss={vi.fn()} />,
    );

    expect(screen.getByTestId("changelog-update-popup")).toHaveTextContent(
      "Check out recent features and improvements.",
    );
  });

  it("links to the latest changelog post after the message", () => {
    render(
      <ChangelogUpdatePopup
        variant="changelog"
        isOpen
        onDismiss={vi.fn()}
        releaseSlug="number-format-and-brazilian-portuguese"
      />,
    );

    expect(screen.getByRole("link", { name: "Read more" })).toHaveAttribute(
      "href",
      "/changelog/number-format-and-brazilian-portuguese",
    );
    expect(
      screen.queryByRole("link", { name: "What's new" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the welcome copy for first-time visitors", () => {
    render(
      <ChangelogUpdatePopup
        variant="welcome"
        isOpen
        onDismiss={vi.fn()}
        releaseSummary={RELEASE_SUMMARY}
      />,
    );

    const popup = screen.getByTestId("changelog-update-popup");

    expect(popup).toHaveTextContent(
      "Create professional PDF invoices in your browser.",
    );
    expect(popup).not.toHaveTextContent(RELEASE_SUMMARY);
  });

  describe("dock layout (mobile)", () => {
    it("shows the release summary with a link to the changelog, and no Continue button", () => {
      render(
        <ChangelogUpdatePopup
          variant="changelog"
          isOpen
          onDismiss={vi.fn()}
          releaseSummary={RELEASE_SUMMARY}
          layout="dock"
        />,
      );

      const popup = screen.getByTestId("changelog-update-popup");

      expect(popup).toHaveAttribute("data-layout", "dock");
      expect(popup).toHaveTextContent(`What's new: ${RELEASE_SUMMARY}`);
      expect(
        screen.getByRole("link", { name: "See what's new" }),
      ).toHaveAttribute("href", "/changelog");
      expect(
        screen.queryByRole("button", { name: "Continue" }),
      ).not.toBeInTheDocument();
      // the mascot is desktop-only
      expect(popup.querySelector("img")).toBeNull();
    });

    it("opens How it works from the welcome notice and dismisses it", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onHowItWorksClick = vi.fn();

      render(
        <ChangelogUpdatePopup
          variant="welcome"
          isOpen
          onDismiss={onDismiss}
          onHowItWorksClick={onHowItWorksClick}
          layout="dock"
        />,
      );

      await user.click(screen.getByRole("button", { name: "How it works" }));

      expect(onDismiss).toHaveBeenCalledOnce();
      expect(onHowItWorksClick).toHaveBeenCalledOnce();
    });

    it("dismisses from its close button", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(
        <ChangelogUpdatePopup
          variant="changelog"
          isOpen
          onDismiss={onDismiss}
          layout="dock"
        />,
      );

      await user.click(screen.getByRole("button", { name: "Close" }));

      expect(onDismiss).toHaveBeenCalledOnce();
    });
  });
});
