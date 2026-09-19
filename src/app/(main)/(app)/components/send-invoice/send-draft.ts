import { z } from "zod";

import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import { SEND_MESSAGE_LOCAL_STORAGE_KEY } from "@/app/schema";
import { MAILBOX_PROVIDER_IDS } from "@/lib/mailbox/mailbox-types";

const SEND_DRAFT_KEY = "easyinvoice-send-draft-v2";
const SEND_INTENT_KEY = "easyinvoice-send-intent-v1";

export type EmailDraft = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
};

/**
 * Compose state saved immediately before an OAuth redirect.
 *
 * Provider OAuth leaves the page, so React state would otherwise be lost. The
 * known mailbox IDs identify which mailbox was added when the user returns,
 * and the presence of a draft doubles as the "returning from OAuth" marker so
 * the URL needs no feature-specific query parameter.
 */
const sendDraftSchema = z.object({
  to: z.string(),
  cc: z.string(),
  bcc: z.string(),
  subject: z.string(),
  body: z.string(),
  provider: z.enum(MAILBOX_PROVIDER_IDS).optional(),
  selectedMailboxId: z.string().optional(),
  knownMailboxIds: z.array(z.string()).default([]),
});

type SendDraft = z.infer<typeof sendDraftSchema>;

export function saveSendDraft(draft: SendDraft) {
  sessionStorage.setItem(SEND_DRAFT_KEY, JSON.stringify(draft));
}

/** Reads and clears the stored draft. Malformed browser state is ignored. */
export function takeSendDraft(): SendDraft | undefined {
  const stored = sessionStorage.getItem(SEND_DRAFT_KEY);
  if (!stored) return undefined;

  sessionStorage.removeItem(SEND_DRAFT_KEY);

  try {
    return sendDraftSchema.parse(JSON.parse(stored));
  } catch {
    return undefined;
  }
}

/**
 * Records that the user asked to send an invoice before they had a session.
 *
 * Signing in with Google or Microsoft leaves the page, so a ref cannot carry
 * the intent across the round trip. Session storage survives the navigation
 * and is scoped to the tab that started it, so a second tab never inherits a
 * dialog nobody asked for.
 */
export function saveSendIntent() {
  sessionStorage.setItem(SEND_INTENT_KEY, "1");
}

/** Reads and clears the pending send intent. */
export function takeSendIntent(): boolean {
  if (!sessionStorage.getItem(SEND_INTENT_KEY)) return false;

  sessionStorage.removeItem(SEND_INTENT_KEY);

  return true;
}

/**
 * The Message field as the user last left it, together with the localized
 * default it was generated from.
 *
 * The default travels with the message because it is what makes the two cases
 * distinguishable after a reload: a body that still equals its stored default
 * is untouched copy that a language change may replace, while anything else is
 * the user's own writing and is kept. Session storage would lose the message
 * on the refresh this exists to survive, so this one lives in local storage.
 */
const persistedMessageSchema = z.object({
  body: z.string(),
  defaultBody: z.string(),
});

export type PersistedMessage = z.infer<typeof persistedMessageSchema>;

export function savePersistedMessage(message: PersistedMessage) {
  // A full or restricted store only costs the user their saved message.
  setAppStorageItem({
    key: SEND_MESSAGE_LOCAL_STORAGE_KEY,
    value: JSON.stringify(message),
  });
}

/** Reads the stored message. Malformed browser state is ignored. */
export function readPersistedMessage(): PersistedMessage | undefined {
  try {
    const stored = getAppStorageItem(SEND_MESSAGE_LOCAL_STORAGE_KEY);
    if (!stored) return undefined;

    return persistedMessageSchema.parse(JSON.parse(stored));
  } catch {
    return undefined;
  }
}
