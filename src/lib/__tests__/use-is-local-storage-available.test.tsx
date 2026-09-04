// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

// Tells React that `act` is safe to use here, the way @testing-library/react would.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const originalDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "localStorage",
);

/** iOS in-app webviews (Telegram, Instagram, Facebook) expose `localStorage` as `null`. */
function makeLocalStorageNull() {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      return null;
    },
  });
}

/**
 * A fresh module graph per test: the probe memoizes its answer, and React must be the
 * same copy for the hook and for the renderer that runs it.
 */
async function importFreshReact() {
  vi.resetModules();

  const [{ act }, { hydrateRoot }, { renderToString }, hookModule] =
    await Promise.all([
      import("react"),
      import("react-dom/client"),
      import("react-dom/server"),
      import("../use-is-local-storage-available"),
    ]);

  function StorageStatus() {
    return hookModule.useIsLocalStorageAvailable() ? (
      <p>available</p>
    ) : (
      <p>unavailable</p>
    );
  }

  return { act, hydrateRoot, renderToString, StorageStatus };
}

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, "localStorage", originalDescriptor);
  }
});

describe("useIsLocalStorageAvailable", () => {
  it("renders optimistically on the server, where storage cannot be probed", async () => {
    const { renderToString, StorageStatus } = await importFreshReact();

    expect(renderToString(<StorageStatus />)).toContain("available");
  });

  it("hydrates the server markup without a mismatch, then reports the real answer", async () => {
    const { act, hydrateRoot, renderToString, StorageStatus } =
      await importFreshReact();

    // The markup the server produced, before the browser was known to be hostile.
    const serverMarkup = renderToString(<StorageStatus />);

    makeLocalStorageNull();

    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    document.body.append(container);

    const consoleError = vi.spyOn(console, "error").mockImplementation(vi.fn());
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <StorageStatus />, { onRecoverableError });
    });

    // A hydration mismatch is reported through both channels; neither fired.
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();

    // Storage really is unusable, so the answer flips right after hydration.
    expect(container.textContent).toBe("unavailable");

    consoleError.mockRestore();
    container.remove();
  });
});
