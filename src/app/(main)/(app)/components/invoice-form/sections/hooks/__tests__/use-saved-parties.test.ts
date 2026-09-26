// @vitest-environment happy-dom

import * as Sentry from "@sentry/nextjs";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SAVED_CONTACTS_IMPORTED_EVENT } from "@/app/(main)/(app)/components/invoice-form/sections/components/contacts-backup-menu";
import { useSavedParties } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-saved-parties";
import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  buyerSchema,
  sellerSchema,
} from "@/app/schema";

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

const ACME = sellerSchema.parse({
  id: "1",
  name: "Acme",
  address: "1 Main St",
});

const INITECH = sellerSchema.parse({
  id: "2",
  name: "Initech",
  address: "2 Side Rd",
});

const GLOBEX = buyerSchema.parse({
  id: "3",
  name: "Globex",
  address: "3 Other Rd",
});

beforeEach(() => {
  localStorage.clear();
  // The hook logs what it drops; keep the test output readable
  vi.spyOn(console, "error").mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function storeSellers(value: unknown) {
  localStorage.setItem(
    SELLERS_LOCAL_STORAGE_KEY,
    typeof value === "string" ? value : JSON.stringify(value),
  );
}

function readStoredSellers(): unknown {
  return JSON.parse(localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY) ?? "null");
}

interface RenderSavedSellersOptions {
  /** The seller id the invoice currently uses. */
  invoicePartyId?: string;
}

function renderSavedSellers({
  invoicePartyId,
}: RenderSavedSellersOptions = {}) {
  const setSelectedId = vi.fn();

  const hook = renderHook(() => {
    return useSavedParties({
      party: "seller",
      invoicePartyId,
      setSelectedId,
    });
  });

  return { ...hook, setSelectedId };
}

describe("useSavedParties", () => {
  describe("loading", () => {
    it("reads the saved list and selects nothing when the invoice uses none of it", () => {
      storeSellers([ACME, INITECH]);

      const { result, setSelectedId } = renderSavedSellers();

      expect(result.current.savedParties).toStrictEqual([ACME, INITECH]);
      expect(setSelectedId).toHaveBeenLastCalledWith("");
    });

    it("selects the saved party the invoice already uses", () => {
      storeSellers([ACME, INITECH]);

      const { setSelectedId } = renderSavedSellers({ invoicePartyId: "2" });

      expect(setSelectedId).toHaveBeenLastCalledWith("2");
    });

    it("starts empty when nothing is saved", () => {
      const { result, setSelectedId } = renderSavedSellers();

      expect(result.current.savedParties).toStrictEqual([]);
      expect(setSelectedId).toHaveBeenLastCalledWith("");
    });

    it("drops invalid entries, saves the cleaned list back and reports it", () => {
      storeSellers([ACME, { name: "" }, "not a seller"]);

      const { result } = renderSavedSellers();

      expect(result.current.savedParties).toStrictEqual([ACME]);
      expect(readStoredSellers()).toStrictEqual([ACME]);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it("leaves a stored value that is not JSON alone and shows an empty list", () => {
      storeSellers("[{ truncated");

      const { result, setSelectedId } = renderSavedSellers();

      expect(result.current.savedParties).toStrictEqual([]);
      expect(setSelectedId).not.toHaveBeenCalled();
      expect(localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY)).toBe(
        "[{ truncated",
      );
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it("reads the buyers list for buyers", () => {
      storeSellers([ACME]);
      localStorage.setItem(BUYERS_LOCAL_STORAGE_KEY, JSON.stringify([GLOBEX]));

      const { result } = renderHook(() => {
        return useSavedParties({
          party: "buyer",
          invoicePartyId: undefined,
          setSelectedId: vi.fn(),
        });
      });

      expect(result.current.savedParties).toStrictEqual([GLOBEX]);
    });
  });

  it("does not loop when given a new setSelectedId on every render", () => {
    storeSellers([ACME]);

    const { result } = renderHook(() => {
      return useSavedParties({
        party: "seller",
        invoicePartyId: "1",
        // A fresh function per render, as an inline callback would be
        setSelectedId: vi.fn(),
      });
    });

    expect(result.current.savedParties).toStrictEqual([ACME]);
  });

  describe("after a backup import", () => {
    it("reloads the list", () => {
      storeSellers([ACME]);

      const { result } = renderSavedSellers();

      storeSellers([ACME, INITECH]);

      act(() => {
        window.dispatchEvent(new Event(SAVED_CONTACTS_IMPORTED_EVENT));
      });

      expect(result.current.savedParties).toStrictEqual([ACME, INITECH]);
    });

    it("stops listening once unmounted", () => {
      const removeEventListener = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderSavedSellers();

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith(
        SAVED_CONTACTS_IMPORTED_EVENT,
        expect.any(Function),
      );
    });
  });

  describe("saveParties", () => {
    it("writes the new list to storage and to state", () => {
      storeSellers([ACME]);

      const { result } = renderSavedSellers();

      let isSaved = false;

      act(() => {
        isSaved = result.current.saveParties([ACME, INITECH]);
      });

      expect(isSaved).toBe(true);
      expect(result.current.savedParties).toStrictEqual([ACME, INITECH]);
      expect(readStoredSellers()).toStrictEqual([ACME, INITECH]);
    });

    it("changes nothing when storage rejects the write", () => {
      storeSellers([ACME]);

      const { result } = renderSavedSellers();

      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

      let isSaved = true;

      act(() => {
        isSaved = result.current.saveParties([ACME, INITECH]);
      });

      expect(isSaved).toBe(false);
      expect(result.current.savedParties).toStrictEqual([ACME]);
    });
  });
});
