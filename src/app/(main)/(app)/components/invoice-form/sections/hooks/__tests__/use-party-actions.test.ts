// @vitest-environment happy-dom

import * as Sentry from "@sentry/nextjs";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Party,
  PartyData,
} from "@/app/(main)/(app)/components/invoice-form/sections/hooks/party-config";
import { usePartyActions } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-party-actions";
import { DEFAULT_BUYER_DATA, DEFAULT_SELLER_DATA } from "@/app/constants";
import { sellerSchema } from "@/app/schema";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

vi.mock("sonner", () => {
  return { toast: { success: vi.fn(), error: vi.fn() } };
});

vi.mock("@sentry/nextjs", () => {
  return { captureException: vi.fn() };
});

vi.mock("@/lib/umami-analytics-track-event", () => {
  return { umamiTrackEvent: vi.fn() };
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

const NOW = 1_700_000_000_000;

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  vi.spyOn(console, "error").mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

interface RenderActionsOptions<P extends Party> {
  party?: P;
  savedParties?: PartyData<P>[];
  selectedId?: string;
  /** What `saveParties` reports: `false` stands for a rejected storage write. */
  isSaveSuccessful?: boolean;
}

function renderActions<P extends Party = "seller">({
  party = "seller" as P,
  savedParties = [ACME, INITECH] as PartyData<P>[],
  selectedId = "",
  isSaveSuccessful = true,
}: RenderActionsOptions<P> = {}) {
  const saveParties = vi.fn(() => {
    return isSaveSuccessful;
  });
  const setSelectedId = vi.fn();
  const applyToInvoice = vi.fn();

  const { result } = renderHook(() => {
    return usePartyActions({
      party,
      savedParties,
      saveParties,
      selectedId,
      setSelectedId,
      applyToInvoice,
      isMobile: false,
    });
  });

  return {
    actions: result.current,
    saveParties,
    setSelectedId,
    applyToInvoice,
  };
}

describe("usePartyActions", () => {
  describe("addParty", () => {
    const NEW_SELLER = sellerSchema.parse({
      name: "Umbrella",
      address: "4 Far Rd",
    });

    it("saves the new party with an id and puts it on the invoice when asked to", () => {
      const { actions, saveParties, setSelectedId, applyToInvoice } =
        renderActions();

      let isAdded = false;

      act(() => {
        isAdded = actions.addParty({
          partyData: NEW_SELLER,
          shouldApplyToInvoice: true,
        });
      });

      const savedSeller = { ...NEW_SELLER, id: String(NOW) };

      expect(isAdded).toBe(true);
      expect(saveParties).toHaveBeenCalledWith([ACME, INITECH, savedSeller]);
      expect(applyToInvoice).toHaveBeenCalledWith(savedSeller);
      expect(setSelectedId).toHaveBeenCalledWith(String(NOW));
      expect(toast.success).toHaveBeenCalledWith(
        "Seller added and applied to invoice",
        expect.objectContaining({ id: "add_seller_success_toast" }),
      );
      expect(umamiTrackEvent).toHaveBeenCalledWith("add_seller_success");
    });

    it("only saves the new party when not asked to apply it", () => {
      const { actions, applyToInvoice, setSelectedId } = renderActions();

      act(() => {
        actions.addParty({
          partyData: NEW_SELLER,
          shouldApplyToInvoice: false,
        });
      });

      expect(applyToInvoice).not.toHaveBeenCalled();
      expect(setSelectedId).not.toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Seller added successfully",
        expect.anything(),
      );
    });

    it("tells the user and stops when storage rejects the write", () => {
      const { actions, applyToInvoice } = renderActions({
        isSaveSuccessful: false,
      });

      let isAdded = true;

      act(() => {
        isAdded = actions.addParty({
          partyData: NEW_SELLER,
          shouldApplyToInvoice: true,
        });
      });

      expect(isAdded).toBe(false);
      expect(applyToInvoice).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to add seller",
        expect.objectContaining({ id: "add_seller_error_toast" }),
      );
      // A full or disabled store is not a bug in the app
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("reports an unexpected error and tells the user", () => {
      const { actions, applyToInvoice } = renderActions();

      applyToInvoice.mockImplementation(() => {
        throw new Error("form exploded");
      });

      let isAdded = true;

      act(() => {
        isAdded = actions.addParty({
          partyData: NEW_SELLER,
          shouldApplyToInvoice: true,
        });
      });

      expect(isAdded).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to add seller",
        expect.anything(),
      );
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });

  describe("editParty", () => {
    it("replaces the party with the same id and updates the invoice", () => {
      const { actions, saveParties, applyToInvoice } = renderActions();
      const renamed = { ...INITECH, name: "Initech Inc" };

      let isEdited = false;

      act(() => {
        isEdited = actions.editParty(renamed);
      });

      expect(isEdited).toBe(true);
      expect(saveParties).toHaveBeenCalledWith([ACME, renamed]);
      expect(applyToInvoice).toHaveBeenCalledWith(renamed);
      expect(toast.success).toHaveBeenCalledWith(
        "Seller updated successfully",
        expect.anything(),
      );
      expect(umamiTrackEvent).toHaveBeenCalledWith("edit_seller_success");
    });

    it("keeps the invoice as it is when storage rejects the write", () => {
      const { actions, applyToInvoice } = renderActions({
        isSaveSuccessful: false,
      });

      let isEdited = true;

      act(() => {
        isEdited = actions.editParty({ ...INITECH, name: "Initech Inc" });
      });

      expect(isEdited).toBe(false);
      expect(applyToInvoice).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to edit seller",
        expect.anything(),
      );
    });
  });

  describe("deleteSelectedParty", () => {
    it("removes the selected party and puts the default details back on the invoice", () => {
      const { actions, saveParties, setSelectedId, applyToInvoice } =
        renderActions({ selectedId: "1" });

      let isDeleted = false;

      act(() => {
        isDeleted = actions.deleteSelectedParty();
      });

      expect(isDeleted).toBe(true);
      expect(saveParties).toHaveBeenCalledWith([INITECH]);
      expect(setSelectedId).toHaveBeenCalledWith("");
      expect(applyToInvoice).toHaveBeenCalledWith(DEFAULT_SELLER_DATA);
      expect(toast.success).toHaveBeenCalledWith(
        "Seller deleted successfully",
        expect.anything(),
      );
      expect(umamiTrackEvent).toHaveBeenCalledWith("delete_seller_success");
    });

    it("keeps the selection when storage rejects the write", () => {
      const { actions, setSelectedId } = renderActions({
        selectedId: "1",
        isSaveSuccessful: false,
      });

      act(() => {
        actions.deleteSelectedParty();
      });

      expect(setSelectedId).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to delete seller",
        expect.anything(),
      );
    });
  });

  describe("selectParty", () => {
    it("puts the picked party on the invoice", () => {
      const { actions, setSelectedId, applyToInvoice, saveParties } =
        renderActions();

      act(() => {
        actions.selectParty("2");
      });

      expect(setSelectedId).toHaveBeenCalledWith("2");
      expect(applyToInvoice).toHaveBeenCalledWith(INITECH);
      expect(toast.success).toHaveBeenCalledWith(
        'Seller "Initech" applied to invoice',
        expect.anything(),
      );
      expect(umamiTrackEvent).toHaveBeenCalledWith("change_seller");
      // Picking a party does not change the saved list
      expect(saveParties).not.toHaveBeenCalled();
    });

    it("goes back to the default details for the empty option", () => {
      const { actions, setSelectedId, applyToInvoice } = renderActions({
        selectedId: "2",
      });

      act(() => {
        actions.selectParty("");
      });

      expect(setSelectedId).toHaveBeenCalledWith("");
      expect(applyToInvoice).toHaveBeenCalledWith(DEFAULT_SELLER_DATA);
      expect(toast.success).toHaveBeenCalledWith(
        "Seller restored to default",
        expect.anything(),
      );
    });
  });

  it("words everything for buyers when managing buyers", () => {
    const { actions, applyToInvoice } = renderActions({
      party: "buyer",
      savedParties: [],
      selectedId: "",
    });

    act(() => {
      actions.selectParty("");
    });

    expect(applyToInvoice).toHaveBeenCalledWith(DEFAULT_BUYER_DATA);
    expect(toast.success).toHaveBeenCalledWith(
      "Buyer restored to default",
      expect.objectContaining({ id: "reset_buyer_success_toast" }),
    );
    expect(umamiTrackEvent).toHaveBeenCalledWith("change_buyer");
  });
});
