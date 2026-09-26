import * as Sentry from "@sentry/nextjs";
import { useEffect, useEffectEvent, useState } from "react";

import { SAVED_CONTACTS_IMPORTED_EVENT } from "@/app/(main)/(app)/components/invoice-form/sections/components/contacts-backup-menu";
import {
  PARTY_CONFIG,
  type Party,
  type PartyData,
} from "@/app/(main)/(app)/components/invoice-form/sections/hooks/party-config";
import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";

interface UseSavedPartiesOptions<P extends Party> {
  /** Which list to manage: the saved sellers or the saved buyers. */
  party: P;
  /**
   * The id of the party the invoice currently uses. When it is one of the saved ones, it
   * is selected in the dropdown after the list loads.
   */
  invoicePartyId: string | undefined;
  /** Selects a saved party in the dropdown by id; `""` selects none. */
  setSelectedId: (id: string) => void;
}

interface UseSavedPartiesResult<P extends Party> {
  /** The saved sellers or buyers, in the order they were added. */
  savedParties: PartyData<P>[];
  /**
   * Replaces the saved list, in storage first and in state only if that worked.
   *
   * @returns `false` when storage rejected the write (full or unavailable), in which
   * case nothing changed.
   */
  saveParties: (parties: PartyData<P>[]) => boolean;
}

/**
 * The saved sellers or buyers, kept in sync with `localStorage`.
 *
 * Reads the list when the component mounts, when the invoice switches to a different
 * party, and after a backup import has added to it.
 */
export function useSavedParties<P extends Party>({
  party,
  invoicePartyId,
  setSelectedId,
}: UseSavedPartiesOptions<P>): UseSavedPartiesResult<P> {
  const [savedParties, setSavedParties] = useState<PartyData<P>[]>([]);

  // An effect event, so `setSelectedId` can be any callback, even a new one per render,
  // without re-running the effect below (which would set state and render again, forever)
  const showLoadedParties = useEffectEvent(
    ({ parties, selectedPartyId }: ShowLoadedPartiesOptions<P>) => {
      const selectedParty = parties.find((savedParty) => {
        return savedParty.id === selectedPartyId;
      });

      setSavedParties(parties);
      setSelectedId(selectedParty?.id ?? "");
    },
  );

  useEffect(() => {
    const reload = () => {
      const parties = loadSavedParties(party);

      // Storage could not be read at all: keep what is on screen
      if (parties) {
        showLoadedParties({ parties, selectedPartyId: invoicePartyId });
      }
    };

    reload();

    window.addEventListener(SAVED_CONTACTS_IMPORTED_EVENT, reload);

    return () => {
      window.removeEventListener(SAVED_CONTACTS_IMPORTED_EVENT, reload);
    };
  }, [party, invoicePartyId]);

  const saveParties = (parties: PartyData<P>[]) => {
    const isPersisted = setAppStorageItem({
      key: PARTY_CONFIG[party].storageKey,
      value: JSON.stringify(parties),
    });

    if (isPersisted) {
      setSavedParties(parties);
    }

    return isPersisted;
  };

  return { savedParties, saveParties };
}

interface ShowLoadedPartiesOptions<P extends Party> {
  /** The list as just read from storage. */
  parties: PartyData<P>[];
  /** The party to select if it is in the list: the one the invoice uses. */
  selectedPartyId: string | undefined;
}

/**
 * Reads the saved list and keeps only the entries that pass the schema.
 *
 * Invalid entries are dropped for good: the cleaned list is written back and the drop is
 * reported to Sentry, since the app itself should never have saved them.
 *
 * @returns `null` when the stored value is not JSON, so the caller can leave the list
 * as it is instead of showing it as empty.
 */
function loadSavedParties<P extends Party>(party: P): PartyData<P>[] | null {
  const { storageKey, schema } = PARTY_CONFIG[party];
  const logPrefix = `[${party}-management]`;

  let stored: unknown;

  try {
    const saved = getAppStorageItem(storageKey);
    stored = saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(`${logPrefix} Failed to load saved ${party}s:`, error);
    Sentry.captureException(error);

    return null;
  }

  const entries = Array.isArray(stored) ? stored : [];
  const validParties: PartyData<P>[] = [];
  const invalidEntries: unknown[] = [];

  for (const entry of entries) {
    const result = schema.safeParse(entry);

    if (result.success) {
      validParties.push(result.data);
    } else {
      invalidEntries.push(entry);
      console.error(`${logPrefix} Invalid ${party} entry:`, result.error);
    }
  }

  if (invalidEntries.length > 0) {
    console.error(
      `${logPrefix} Dropped ${invalidEntries.length} invalid ${party} entries:`,
      invalidEntries,
    );

    Sentry.captureException(
      new Error(
        `${logPrefix} Invalid ${party} data in localStorage: ${invalidEntries.length} items dropped`,
      ),
    );

    setAppStorageItem({
      key: storageKey,
      value: JSON.stringify(validParties),
    });
  }

  return validParties;
}
