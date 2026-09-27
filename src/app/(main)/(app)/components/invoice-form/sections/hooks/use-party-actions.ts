import * as Sentry from "@sentry/nextjs";
import { toast } from "sonner";

import {
  PARTY_CONFIG,
  type Party,
  type PartyData,
} from "@/app/(main)/(app)/components/invoice-form/sections/hooks/party-config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

interface UsePartyActionsOptions<P extends Party> {
  /** Which list the actions work on: the saved sellers or the saved buyers. */
  party: P;
  /** The saved list, from `useSavedParties`. */
  savedParties: PartyData<P>[];
  /** Persists a new version of the saved list, from `useSavedParties`. */
  saveParties: (parties: PartyData<P>[]) => boolean;
  /** The id of the party selected in the dropdown; `""` when none is. */
  selectedId: string;
  /** Selects a saved party in the dropdown by id; `""` selects none. */
  setSelectedId: (id: string) => void;
  /** Puts a party's details on the invoice (the seller or buyer section of the form). */
  applyToInvoice: (partyData: PartyData<P>) => void;
  /** Mobile shows toasts at the top, desktop at the bottom right. */
  isMobile: boolean;
}

interface AddPartyOptions<P extends Party> {
  /** The details entered in the "New Seller" / "New Buyer" dialog. */
  partyData: PartyData<P>;
  /** Whether to also put the new party on the invoice right away. */
  shouldApplyToInvoice: boolean;
}

/**
 * What the user can do with saved sellers or buyers: add, edit, pick one for the invoice,
 * and delete the selected one.
 *
 * Every change is saved to storage first. If that fails, nothing else happens and the
 * user is told, rather than shown a change the next page load would undo. Each action
 * ends with a toast and an analytics event.
 */
export function usePartyActions<P extends Party>({
  party,
  savedParties,
  saveParties,
  selectedId,
  setSelectedId,
  applyToInvoice,
  isMobile,
}: UsePartyActionsOptions<P>) {
  const { label, defaultData } = PARTY_CONFIG[party];
  const position = isMobile ? "top-center" : "bottom-right";

  /**
   * Saves `nextParties`, then runs `onSaved` for the rest of the action.
   *
   * @returns whether the action went through.
   */
  const commit = ({
    action,
    nextParties,
    onSaved,
  }: CommitOptions<P>): boolean => {
    const failureMessage = `Failed to ${action} ${party}`;

    try {
      if (!saveParties(nextParties)) {
        // A full or disabled store, not an application error, so not sent to Sentry
        toast.error(failureMessage, {
          id: `${action}_${party}_error_toast`,
          description: "Please try again",
          closeButton: true,
          position,
        });

        return false;
      }

      onSaved();
      umamiTrackEvent(`${action}_${party}_success`);

      return true;
    } catch (error) {
      console.error(`${failureMessage}:`, error);

      toast.error(failureMessage, {
        id: `${action}_${party}_error_toast`,
        description: "Please try again",
        closeButton: true,
        position,
      });

      Sentry.captureException(error);

      return false;
    }
  };

  const addParty = ({
    partyData,
    shouldApplyToInvoice,
  }: AddPartyOptions<P>) => {
    // The id is what the dropdown, edit and delete go by (IMPORTANT!)
    const newParty = { ...partyData, id: Date.now().toString() };

    return commit({
      action: "add",
      nextParties: [...savedParties, newParty],
      onSaved: () => {
        if (shouldApplyToInvoice) {
          applyToInvoice(newParty);
          setSelectedId(newParty.id);
        }

        toast.success(
          shouldApplyToInvoice
            ? `${label} added and applied to invoice`
            : `${label} added successfully`,
          { id: `add_${party}_success_toast`, richColors: true, position },
        );
      },
    });
  };

  const editParty = (editedParty: PartyData<P>) => {
    return commit({
      action: "edit",
      nextParties: savedParties.map((savedParty) => {
        return savedParty.id === editedParty.id ? editedParty : savedParty;
      }),
      onSaved: () => {
        applyToInvoice(editedParty);

        toast.success(`${label} updated successfully`, {
          id: `edit_${party}_success_toast`,
          richColors: true,
          position,
        });
      },
    });
  };

  const deleteSelectedParty = () => {
    return commit({
      action: "delete",
      nextParties: savedParties.filter((savedParty) => {
        return savedParty.id !== selectedId;
      }),
      onSaved: () => {
        setSelectedId("");
        applyToInvoice(defaultData);

        toast.success(`${label} deleted successfully`, {
          id: `delete_${party}_success_toast`,
          richColors: true,
          position,
        });
      },
    });
  };

  /** Picks a saved party for the invoice; `""` goes back to the default details. */
  const selectParty = (id: string) => {
    umamiTrackEvent(`change_${party}`);

    if (!id) {
      setSelectedId("");
      applyToInvoice(defaultData);

      toast.success(`${label} restored to default`, {
        id: `reset_${party}_success_toast`,
        richColors: true,
        position,
      });

      return;
    }

    setSelectedId(id);

    const selectedParty = savedParties.find((savedParty) => {
      return savedParty.id === id;
    });

    if (!selectedParty) {
      return;
    }

    applyToInvoice(selectedParty);

    toast.success(`${label} "${selectedParty.name}" applied to invoice`, {
      id: `change_${party}_success_toast`,
      richColors: true,
      position,
    });
  };

  return { addParty, editParty, deleteSelectedParty, selectParty };
}

interface CommitOptions<P extends Party> {
  /** Names the action in toasts and analytics: "Failed to add seller", `add_seller_success`. */
  action: "add" | "edit" | "delete";
  /** The saved list as it should be after the action. */
  nextParties: PartyData<P>[];
  /** The rest of the action, run only once the list is saved. */
  onSaved: () => void;
}
