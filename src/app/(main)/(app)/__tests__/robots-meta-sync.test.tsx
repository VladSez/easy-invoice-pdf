// @vitest-environment happy-dom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => {
  return {
    useSearchParams: () => {
      return currentSearchParams;
    },
  };
});

import { RobotsMetaSync } from "../robots-meta-sync";

/**
 * Renders the robots meta tags the way `generateMetadata` does on the server, so the
 * component has something to patch.
 *
 * @param content - The `content` value both tags start out with.
 */
function renderServerRobotsMeta(content: string) {
  for (const name of ["robots", "googlebot"]) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.append(meta);
  }
}

function robotsMetaContents() {
  return [...document.head.querySelectorAll("meta[name]")].map((meta) => {
    return [meta.getAttribute("name"), meta.getAttribute("content")];
  });
}

describe("RobotsMetaSync", () => {
  beforeEach(() => {
    currentSearchParams = new URLSearchParams();
    document.head.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("marks a shared invoice as noindex, nofollow", () => {
    renderServerRobotsMeta("index, follow");
    currentSearchParams = new URLSearchParams("template=stripe&data=abc123");

    render(<RobotsMetaSync isIndexableEnvironment={true} />);

    expect(robotsMetaContents()).toEqual([
      ["robots", "noindex, nofollow"],
      ["googlebot", "noindex, nofollow"],
    ]);
  });

  it("leaves the page indexable when there is no shared data", () => {
    renderServerRobotsMeta("index, follow");
    currentSearchParams = new URLSearchParams("template=stripe");

    render(<RobotsMetaSync isIndexableEnvironment={true} />);

    expect(robotsMetaContents()).toEqual([
      ["robots", "index, follow"],
      ["googlebot", "index, follow"],
    ]);
  });

  it("keeps non-production deployments out of the index entirely", () => {
    renderServerRobotsMeta("noindex, nofollow");

    render(<RobotsMetaSync isIndexableEnvironment={false} />);

    expect(robotsMetaContents()).toEqual([
      ["robots", "noindex, nofollow"],
      ["googlebot", "noindex, nofollow"],
    ]);
  });

  it("re-indexes the page when the shared data is dropped from the URL", () => {
    renderServerRobotsMeta("index, follow");
    currentSearchParams = new URLSearchParams("data=abc123");

    const { rerender } = render(
      <RobotsMetaSync isIndexableEnvironment={true} />,
    );

    expect(robotsMetaContents()).toEqual([
      ["robots", "noindex, nofollow"],
      ["googlebot", "noindex, nofollow"],
    ]);

    // the app drops `?data=` in place too (corrupted link, edits to a shared invoice),
    // which leaves the visitor on `/` -- the canonical page we do want indexed
    currentSearchParams = new URLSearchParams();
    rerender(<RobotsMetaSync isIndexableEnvironment={true} />);

    expect(robotsMetaContents()).toEqual([
      ["robots", "index, follow"],
      ["googlebot", "index, follow"],
    ]);
  });

  it("adds the tags when the document was rendered without them", () => {
    currentSearchParams = new URLSearchParams("data=abc123");

    render(<RobotsMetaSync isIndexableEnvironment={true} />);

    expect(robotsMetaContents()).toEqual([
      ["robots", "noindex, nofollow"],
      ["googlebot", "noindex, nofollow"],
    ]);
  });

  it("does not add tags to an indexable page that has none", () => {
    render(<RobotsMetaSync isIndexableEnvironment={true} />);

    expect(robotsMetaContents()).toEqual([]);
  });
});
