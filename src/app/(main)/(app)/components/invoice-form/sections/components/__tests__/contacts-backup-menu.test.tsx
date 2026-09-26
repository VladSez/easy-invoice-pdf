// @vitest-environment happy-dom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ContactsBackupMenu } from "@/app/(main)/(app)/components/invoice-form/sections/components/contacts-backup-menu";
import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
} from "@/app/schema";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => {
  return {
    toast: {
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn(),
    },
  };
});

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return { umamiTrackEvent: vi.fn() };
});

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

interface ImportBackupOptions {
  sellers?: unknown[];
  buyers?: unknown[];
}

async function importBackup({
  sellers = [],
  buyers = [],
}: ImportBackupOptions) {
  const file = new File(
    [JSON.stringify({ app: "easyinvoicepdf", version: 1, sellers, buyers })],
    "backup.json",
    { type: "application/json" },
  );

  fireEvent.change(screen.getByTestId("contacts-backup-file-input"), {
    target: { files: [file] },
  });

  await vi.waitFor(() => {
    expect(
      vi.mocked(toast.success).mock.calls.length +
        vi.mocked(toast.warning).mock.calls.length +
        vi.mocked(toast.error).mock.calls.length,
    ).toBeGreaterThan(0);
  });
}

function readStoredList(key: string): unknown {
  return JSON.parse(localStorage.getItem(key) ?? "null");
}

describe("ContactsBackupMenu import", () => {
  it("recovers when a saved list is not valid JSON", async () => {
    localStorage.setItem(SELLERS_LOCAL_STORAGE_KEY, "[{ truncated");

    render(<ContactsBackupMenu isMobile={false} />);

    await importBackup({
      sellers: [{ id: "1", name: "Acme", address: "1 Main St" }],
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(readStoredList(SELLERS_LOCAL_STORAGE_KEY)).toMatchObject([
      { id: "1", name: "Acme" },
    ]);
  });

  it("gives entries without an id distinct ids", async () => {
    render(<ContactsBackupMenu isMobile={false} />);

    await importBackup({
      buyers: [
        { name: "Globex", address: "2 Side Rd" },
        { name: "Initech", address: "3 Other Rd" },
      ],
    });

    const buyers = readStoredList(BUYERS_LOCAL_STORAGE_KEY) as {
      id: string;
    }[];

    expect(buyers).toHaveLength(2);
    expect(buyers[0]?.id).toBeTruthy();
    expect(buyers[0]?.id).not.toBe(buyers[1]?.id);
  });
});
