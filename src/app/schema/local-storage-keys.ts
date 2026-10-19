/**
 * Every `localStorage` key the web app uses.
 *
 * These are browser concerns, so they live here in the app and not in the invoice schema
 * (`./index.ts`), which is shared with the server-side backend.
 */

/** The invoice the user is editing (`invoiceSchema`). */
export const PDF_DATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_DATA";

/** App metadata (`metadataSchema`). */
export const METADATA_LOCAL_STORAGE_KEY = "EASY_INVOICE_METADATA";

/** Which form sections are expanded (`accordionSchema`). */
export const ACCORDION_STATE_LOCAL_STORAGE_KEY = "EASY_INVOICE_ACCORDION_STATE";

/** Saved sellers (`sellerSchema[]`). */
export const SELLERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_SELLERS";

/** Saved buyers (`buyerSchema[]`). */
export const BUYERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_BUYERS";

/**
 * Remembers that the user has already seen the welcome popup. The value is a version
 * marker, so bumping it shows the popup again.
 */
export const WELCOME_POPUP_SEEN_STORAGE_KEY = "EASY_INVOICE_WELCOME_POPUP_SEEN";

/**
 * The value {@link WELCOME_POPUP_SEEN_STORAGE_KEY} holds once the welcome popup has been
 * seen. Exported for `playwright.config.ts`, which marks it seen for every e2e run.
 */
export const WELCOME_POPUP_SEEN_VALUE = "v1";

/** The slug of the newest changelog entry the user has seen. */
export const CHANGELOG_SEEN_STORAGE_KEY =
  "EASY_INVOICE_LAST_SEEN_CHANGELOG_SLUG";

/** When the CTA toast was last shown, as an epoch-milliseconds string. */
export const CTA_TOAST_STORAGE_KEY = "EASY_INVOICE_CTA_LAST_SHOWN_AT";

/**
 * Every key the app is allowed to write to `localStorage`.
 *
 * This is the one list of all of them, and it is what `getAppStorageItem` / `setAppStorageItem` accept. Anything persisted by the
 * app belongs here, so that "what do we store, and can two features collide?" has a
 * single answer.
 */
export const LOCAL_STORAGE_KEYS = [
  PDF_DATA_LOCAL_STORAGE_KEY,
  METADATA_LOCAL_STORAGE_KEY,
  ACCORDION_STATE_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  BUYERS_LOCAL_STORAGE_KEY,
  WELCOME_POPUP_SEEN_STORAGE_KEY,
  CHANGELOG_SEEN_STORAGE_KEY,
  CTA_TOAST_STORAGE_KEY,
] as const;

export type LocalStorageKey = (typeof LOCAL_STORAGE_KEYS)[number];

// __________________________________________________________
// Validate that local storage keys are unique
// __________________________________________________________

// Two features sharing a key would silently overwrite each other's data, and the union
// type above cannot catch it - a duplicate literal collapses into the same member.
const uniqueLocalStorageKeys = new Set<string>(LOCAL_STORAGE_KEYS);

if (uniqueLocalStorageKeys.size !== LOCAL_STORAGE_KEYS.length) {
  const duplicates = LOCAL_STORAGE_KEYS.filter((key, index) => {
    return LOCAL_STORAGE_KEYS.indexOf(key) !== index;
  });

  throw new Error(
    `LOCAL_STORAGE_KEYS contains duplicate entries: ${duplicates.join(", ")}`,
  );
}
