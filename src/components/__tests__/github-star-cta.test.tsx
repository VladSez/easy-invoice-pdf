// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { GITHUB_URL } from "@/config";
import { GitHubStarCTA } from "../github-star-cta";
import { TooltipProvider } from "../ui/tooltip";

vi.mock("@/lib/umami-analytics-track-event", () => ({
  umamiTrackEvent: vi.fn(),
}));

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

function renderGitHubStarCTA(githubStarsCount: number) {
  return render(
    <TooltipProvider delayDuration={0}>
      <GitHubStarCTA githubStarsCount={githubStarsCount} />
    </TooltipProvider>,
  );
}

describe("GitHubStarCTA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render external GitHub link with accessible label", () => {
    renderGitHubStarCTA(100);

    const link = screen.getByTestId("github-star-cta-button");

    expect(link).toHaveAttribute("href", GITHUB_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("aria-label", "Star project on GitHub");
  });

  it("should show lowercase formatted star count when count is greater than 0", () => {
    const githubStarsCount = 1500;

    renderGitHubStarCTA(githubStarsCount);

    const link = screen.getByTestId("github-star-cta-button");

    expect(within(link).getByText("1.5k")).toBeInTheDocument();

    expect(within(link).queryByText("Star on GitHub")).not.toBeInTheDocument();
  });

  it("should show two-decimal compact star count for values like 2350", () => {
    const githubStarsCount = 2350;

    renderGitHubStarCTA(githubStarsCount);

    const link = screen.getByTestId("github-star-cta-button");

    expect(within(link).getByText("2.35k")).toBeInTheDocument();

    expect(within(link).queryByText("Star on GitHub")).not.toBeInTheDocument();
  });

  it("should show unabbreviated star count for three-digit values", () => {
    const githubStarsCount = 969;

    renderGitHubStarCTA(githubStarsCount);

    const link = screen.getByTestId("github-star-cta-button");

    expect(within(link).getByText("969")).toBeInTheDocument();

    expect(within(link).queryByText("Star on GitHub")).not.toBeInTheDocument();
  });

  it("should show lowercase formatted star count when count is over 10k", () => {
    const githubStarsCount = 15000;

    renderGitHubStarCTA(githubStarsCount);

    const link = screen.getByTestId("github-star-cta-button");

    expect(within(link).getByText("15k")).toBeInTheDocument();

    expect(within(link).queryByText("Star on GitHub")).not.toBeInTheDocument();
  });

  it("should show Star on GitHub label in button when count is 0", () => {
    renderGitHubStarCTA(0);

    const link = screen.getByTestId("github-star-cta-button");

    expect(within(link).getByText("Star on GitHub")).toBeInTheDocument();
  });

  it("should track github_star_cta_clicked on click", async () => {
    const user = userEvent.setup();

    renderGitHubStarCTA(42);

    await user.click(screen.getByTestId("github-star-cta-button"));

    expect(umamiTrackEvent).toHaveBeenCalledWith("github_star_cta_clicked");
    expect(umamiTrackEvent).toHaveBeenCalledTimes(1);
  });

  it("should show Star on GitHub tooltip on hover", async () => {
    const user = userEvent.setup();

    renderGitHubStarCTA(250);

    await user.hover(screen.getByTestId("github-star-cta-button"));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Star on GitHub",
    );
  });
});
