/**
 * The page atlas model: every page, every state worth a screenshot, and the user flows
 * that connect them. The capture specs (`capture/*.atlas.ts`) screenshot states by id,
 * and `build-atlas.ts` joins those screenshots with this model into the viewer.
 *
 * A state id is `<page id>/<variant>`. Its screenshot is stored under the same id with
 * the slash swapped for `--`, once per viewport.
 */

export const VIEWPORTS = ["desktop", "phone"] as const;

export type Viewport = (typeof VIEWPORTS)[number];

export const AREAS = {
  onboarding: "Onboarding",
  editor: "Editor",
  parties: "Sellers & buyers",
  items: "Items",
  sharing: "Sharing",
  errors: "Errors",
  templates: "Templates & logo",
  about: "About",
} as const;

type AreaId = keyof typeof AREAS;

interface PageDefinition {
  title: string;
  /** Where the page lives; dialogs name the route they open on. */
  route: string;
  area: AreaId;
}

export const PAGES = {
  editor: { title: "Invoice editor", route: "/", area: "editor" },
  stripe: {
    title: "Invoice editor, Stripe template",
    route: "/stripe-template",
    area: "templates",
  },
  "how-it-works": {
    title: "How it works dialog",
    route: "/ (dialog)",
    area: "onboarding",
  },
  "changelog-post": {
    title: "Changelog post",
    route: "/changelog/[slug]",
    area: "onboarding",
  },
  "seller-dialog": {
    title: "Seller dialog",
    route: "/ (dialog)",
    area: "parties",
  },
  "seller-delete": {
    title: "Delete seller alert",
    route: "/ (alert)",
    area: "parties",
  },
  "buyer-dialog": {
    title: "Buyer dialog",
    route: "/ (dialog)",
    area: "parties",
  },
  "buyer-delete": {
    title: "Delete buyer alert",
    route: "/ (alert)",
    area: "parties",
  },
  "item-delete": {
    title: "Delete item alert",
    route: "/ (alert)",
    area: "items",
  },
  import: {
    title: "Import sellers & buyers dialog",
    route: "/ (dialog)",
    area: "parties",
  },
  about: { title: "About page", route: "/[locale]/about", area: "about" },
} as const satisfies Record<string, PageDefinition>;

type PageId = keyof typeof PAGES;

/** The UI locales `/[locale]/about` is served in, see `SUPPORTED_I18N_LOCALES`. */
export const ABOUT_LOCALES = {
  en: "English",
  pl: "Polish",
  nl: "Dutch",
  fr: "French",
  de: "German",
  it: "Italian",
  nb: "Norwegian",
  pt: "Portuguese",
  ru: "Russian",
  es: "Spanish",
  sv: "Swedish",
  uk: "Ukrainian",
} as const;

type AboutLocale = keyof typeof ABOUT_LOCALES;

interface StateDefinition {
  title: string;
  /** Viewports this state exists in; both when omitted. */
  only?: Viewport;
}

const APP_STATES = {
  "editor/loading": { title: "PDF still generating" },
  "editor/default": { title: "Default invoice" },
  "editor/welcome-popup": { title: "Welcome popup, first visit" },
  "editor/whats-new-popup": {
    title: "What's new popup after a release",
    only: "desktop",
  },
  "editor/edited": { title: "Edited invoice, PDF regenerated" },
  "editor/cta-toast": { title: "Support toast after a download" },
  "editor/mobile-preview": { title: "Preview PDF tab", only: "phone" },
  "editor/seller-saved": { title: "Seller saved and applied" },
  "editor/seller-saved-not-applied": {
    title: "Seller saved, not used on this invoice",
  },
  "editor/seller-updated": { title: "Seller updated" },
  "editor/seller-restored": { title: "Seller restored to default" },
  "editor/seller-deleted": { title: "Seller deleted" },
  "editor/buyer-saved": { title: "Buyer saved and applied" },
  "editor/buyer-deleted": { title: "Buyer deleted" },
  "editor/items": { title: "Invoice items section" },
  "editor/items-two": { title: "Second item added" },
  "editor/item-discount": { title: "Item with a discount" },
  "editor/item-discount-error": { title: "Discount above 100%" },
  "editor/item-deleted": { title: "Item removed" },
  "editor/validation-error": { title: "Seller name missing" },
  "editor/validation-fixed": { title: "Seller name filled in again" },
  "editor/link-copied": { title: "Share link copied" },
  "editor/shared": { title: "Opened from a share link" },
  "editor/shared-edited": { title: "Shared invoice edited" },
  "editor/share-blocked-logo": { title: "Sharing blocked by a logo" },
  "editor/share-too-large": { title: "Invoice too large to share" },
  "editor/corrupt-link": { title: "Corrupted share link" },
  "editor/corrupt-link-cleared": { title: "Corrupted link cleared by an edit" },
  "editor/saved-invoice-unreadable": { title: "Saved invoice unreadable" },
  "editor/pdf-error": { title: "PDF generation failed" },
  "editor/stale-dates": { title: "Dates out of date" },
  "editor/stale-dates-one-fixed": { title: "Date of issue fixed" },
  "editor/dates-updated": { title: "All dates updated" },
  "editor/logo": { title: "Logo uploaded" },
  "editor/logo-invalid": { title: "Logo file rejected" },
  "editor/logo-removed": { title: "Logo removed" },
  "editor/contacts-saved": { title: "Saved sellers and buyers" },
  "editor/backup-menu": { title: "Import or export menu" },
  "editor/contacts-exported": { title: "Sellers & buyers exported" },
  "editor/contacts-imported": { title: "Sellers & buyers imported" },
  "stripe/default": { title: "Stripe template" },
  "stripe/indigo": { title: "Indigo top line" },
  "how-it-works/default": { title: "Video dialog" },
  "changelog-post/default": { title: "Latest post", only: "desktop" },
  "seller-dialog/empty": { title: "New seller, empty" },
  "seller-dialog/filled": { title: "New seller, filled in" },
  "seller-dialog/discard-confirm": { title: "Discard unsaved changes?" },
  "seller-dialog/edit": { title: "Edit a saved seller" },
  "seller-dialog/duplicate-name": { title: "Name already taken" },
  "seller-delete/confirm": { title: "Delete seller?" },
  "buyer-dialog/empty": { title: "New buyer, empty" },
  "buyer-dialog/filled": { title: "New buyer, filled in" },
  "buyer-delete/confirm": { title: "Delete buyer?" },
  "item-delete/confirm": { title: "Delete item 2?" },
  "import/choose-file": { title: "Choose a backup file" },
  "import/review": { title: "Review import" },
  "import/nothing-new": { title: "Nothing new to import" },
  "import/invalid-file": { title: "File can't be imported" },
  "about/language-menu": { title: "Language menu", only: "desktop" },
  "about/mobile-menu": { title: "Mobile menu sheet", only: "phone" },
} as const satisfies Record<`${PageId}/${string}`, StateDefinition>;

const ABOUT_LOCALE_STATES = Object.fromEntries(
  Object.entries(ABOUT_LOCALES).map(([locale, language]) => {
    return [`about/${locale}`, { title: `/${locale}/about, ${language}` }];
  }),
) as Record<`about/${AboutLocale}`, StateDefinition>;

export const STATES: Record<StateId, StateDefinition> = {
  ...APP_STATES,
  ...ABOUT_LOCALE_STATES,
};

export type StateId = keyof typeof APP_STATES | `about/${AboutLocale}`;

/**
 * One step of a flow. Children are the steps the user can take next, so a step with
 * several children is a branch. The same state can appear in several places.
 */
interface FlowStep {
  state: StateId;
  /** The action that leads here from the parent step (or into the flow, on a root). */
  via?: string;
  next?: FlowStep[];
}

interface FlowDefinition {
  id: string;
  title: string;
  area: AreaId;
  summary: string;
  /** Viewports the flow exists in; both when omitted. */
  only?: Viewport;
  /** Each root starts its own path through the flow. */
  roots: FlowStep[];
}

export const FLOWS = [
  {
    id: "first-visit",
    title: "First visit",
    area: "onboarding",
    summary:
      "A new visitor gets the welcome popup 1.5s after load. It shows once per browser; on a phone it sits in the bottom dock.",
    roots: [
      {
        state: "editor/welcome-popup",
        via: "Open / for the first time",
        next: [
          { state: "editor/default", via: "Continue" },
          {
            state: "how-it-works/default",
            via: "How it works",
            next: [{ state: "editor/default", via: "Close" }],
          },
        ],
      },
    ],
  },
  {
    id: "whats-new",
    title: "Return after a release",
    area: "onboarding",
    summary:
      "A returning desktop visitor who has not seen the newest changelog post gets the What's new popup instead.",
    only: "desktop",
    roots: [
      {
        state: "editor/whats-new-popup",
        via: "Open / after a release",
        next: [
          { state: "editor/default", via: "Continue" },
          { state: "changelog-post/default", via: "Read more" },
        ],
      },
    ],
  },
  {
    id: "edit-download",
    title: "Edit and download",
    area: "editor",
    summary:
      "Edits are debounced by 500ms, then the PDF re-renders. The support toast appears 2.5s after a download, at most once a day.",
    roots: [
      {
        state: "editor/loading",
        via: "Open /",
        next: [
          {
            state: "editor/default",
            via: "PDF ready",
            next: [
              {
                state: "editor/edited",
                via: "Edit the notes",
                next: [{ state: "editor/cta-toast", via: "Download PDF" }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mobile-tabs",
    title: "Edit and preview on a phone",
    area: "editor",
    summary:
      "Below 1024px the form and the PDF are two tabs in the bottom dock. Switching tabs flushes pending edits at once.",
    only: "phone",
    roots: [
      {
        state: "editor/default",
        via: "Open /",
        next: [
          {
            state: "editor/mobile-preview",
            via: "Preview PDF",
            next: [{ state: "editor/default", via: "Edit Invoice" }],
          },
        ],
      },
    ],
  },
  {
    id: "new-seller",
    title: "Save a new seller",
    area: "parties",
    summary:
      "Saved sellers live in localStorage. Leaving a dirty dialog asks before throwing the changes away.",
    roots: [
      {
        state: "editor/default",
        next: [
          {
            state: "seller-dialog/empty",
            via: "New Seller",
            next: [
              {
                state: "seller-dialog/filled",
                via: "Fill in the seller",
                next: [
                  { state: "editor/seller-saved", via: "Save Seller" },
                  {
                    state: "editor/seller-saved-not-applied",
                    via: "Untick Use on this invoice, save",
                  },
                  {
                    state: "seller-dialog/discard-confirm",
                    via: "Cancel",
                    next: [
                      { state: "seller-dialog/filled", via: "Keep editing" },
                      { state: "editor/default", via: "Discard changes" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "manage-seller",
    title: "Manage a saved seller",
    area: "parties",
    summary:
      "Editing, unselecting and deleting a seller that is already saved and applied to the invoice.",
    roots: [
      {
        state: "editor/seller-saved",
        next: [
          {
            state: "seller-dialog/edit",
            via: "Edit seller",
            next: [{ state: "editor/seller-updated", via: "Save Seller" }],
          },
          {
            state: "editor/seller-restored",
            via: "Select No seller selected",
          },
          {
            state: "seller-delete/confirm",
            via: "Delete seller",
            next: [{ state: "editor/seller-deleted", via: "Delete" }],
          },
          {
            state: "seller-dialog/duplicate-name",
            via: "New Seller with the same name, save",
          },
        ],
      },
    ],
  },
  {
    id: "buyer",
    title: "Save and delete a buyer",
    area: "parties",
    summary:
      "Buyers work like sellers, without bank details. Edit, restore and the discard prompt behave the same way.",
    roots: [
      {
        state: "editor/default",
        next: [
          {
            state: "buyer-dialog/empty",
            via: "New Buyer",
            next: [
              {
                state: "buyer-dialog/filled",
                via: "Fill in the buyer",
                next: [
                  {
                    state: "editor/buyer-saved",
                    via: "Save Buyer",
                    next: [
                      {
                        state: "buyer-delete/confirm",
                        via: "Delete buyer",
                        next: [
                          { state: "editor/buyer-deleted", via: "Delete" },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "items",
    title: "Items and discounts",
    area: "items",
    summary:
      "Each item can carry a percentage or fixed discount, applied before tax. Deleting an item asks first.",
    roots: [
      {
        state: "editor/items",
        next: [
          {
            state: "editor/item-discount",
            via: "Add discount, 10%",
            next: [
              {
                state: "editor/item-discount-error",
                via: "Discount value 150",
              },
            ],
          },
          {
            state: "editor/items-two",
            via: "Add invoice item",
            next: [
              {
                state: "item-delete/confirm",
                via: "Delete Invoice Item 2",
                next: [{ state: "editor/item-deleted", via: "Delete Item 2" }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "validation",
    title: "Validation errors",
    area: "editor",
    summary:
      "A required field left empty shows inline and in a toast listing every error; the PDF keeps its last valid version.",
    roots: [
      {
        state: "editor/default",
        next: [
          {
            state: "editor/validation-error",
            via: "Clear the seller name",
            next: [
              { state: "editor/validation-fixed", via: "Type a seller name" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "share-link",
    title: "Share a link",
    area: "sharing",
    summary:
      "Get link compresses the invoice into ?data=. Logos never fit in a URL, and URLs over 4096 characters are refused.",
    roots: [
      {
        state: "editor/default",
        next: [
          {
            state: "editor/link-copied",
            via: "Get link",
            next: [
              {
                state: "editor/shared",
                via: "Open the link",
                next: [
                  { state: "editor/shared-edited", via: "Edit any field" },
                ],
              },
            ],
          },
          { state: "editor/share-blocked-logo", via: "Get link with a logo" },
          {
            state: "editor/share-too-large",
            via: "Get link with 16 long items",
          },
        ],
      },
    ],
  },
  {
    id: "errors",
    title: "Broken links and errors",
    area: "errors",
    summary:
      "What happens when a share link, the saved invoice or the PDF renderer fails.",
    roots: [
      {
        state: "editor/corrupt-link",
        via: "Open /?data=invalid",
        next: [
          { state: "editor/default", via: "Clear URL" },
          { state: "editor/corrupt-link-cleared", via: "Edit any field" },
        ],
      },
      {
        state: "editor/saved-invoice-unreadable",
        via: "Open / with broken saved data",
      },
      { state: "editor/pdf-error", via: "Open / with fonts failing to load" },
    ],
  },
  {
    id: "stale-dates",
    title: "Out-of-date dates",
    area: "editor",
    summary:
      "Reusing last month's invoice flags the issue date, service period, invoice number and due date, one by one or all at once.",
    roots: [
      {
        state: "editor/stale-dates",
        via: "Open last month's invoice",
        next: [
          {
            state: "editor/stale-dates-one-fixed",
            via: "Set date of issue to today",
            next: [{ state: "editor/dates-updated", via: "Update All Dates" }],
          },
        ],
      },
    ],
  },
  {
    id: "template-logo",
    title: "Template and logo",
    area: "templates",
    summary:
      "The Stripe template lives at /stripe-template and adds a top line color. Logos are JPEG, PNG or WebP under 3MB.",
    roots: [
      {
        state: "editor/default",
        next: [
          {
            state: "stripe/default",
            via: "Invoice Template: Stripe",
            next: [{ state: "stripe/indigo", via: "Top line color: Indigo" }],
          },
          {
            state: "editor/logo",
            via: "Upload a logo",
            next: [{ state: "editor/logo-removed", via: "Remove logo" }],
          },
          { state: "editor/logo-invalid", via: "Upload a text file" },
        ],
      },
    ],
  },
  {
    id: "contacts-backup",
    title: "Back up sellers & buyers",
    area: "parties",
    summary:
      "Saved sellers and buyers export to a JSON file and import back, skipping ones already saved.",
    roots: [
      {
        state: "editor/contacts-saved",
        next: [
          {
            state: "editor/backup-menu",
            via: "Import or export",
            next: [
              {
                state: "editor/contacts-exported",
                via: "Export sellers & buyers",
              },
              {
                state: "import/choose-file",
                via: "Import from file…",
                next: [
                  {
                    state: "import/review",
                    via: "Choose a backup from another browser",
                    next: [
                      {
                        state: "editor/contacts-imported",
                        via: "Import 1 seller and 1 buyer",
                      },
                    ],
                  },
                  {
                    state: "import/nothing-new",
                    via: "Choose a backup already imported",
                  },
                  { state: "import/invalid-file", via: "Choose a broken file" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "about-language",
    title: "About page languages",
    area: "about",
    summary:
      "The about page is translated into 12 languages. Desktop switches from the header; phones go through the menu sheet.",
    roots: [
      {
        state: "about/en",
        via: "Open /en/about",
        next: [
          {
            state: "about/language-menu",
            via: "Switch language",
            next: [{ state: "about/fr", via: "Français" }],
          },
          { state: "about/mobile-menu", via: "Open menu" },
        ],
      },
    ],
  },
] as const satisfies readonly FlowDefinition[];

export function getPageId(stateId: StateId) {
  return stateId.slice(0, stateId.indexOf("/")) as PageId;
}

export function getShotFileName(stateId: StateId) {
  return `${stateId.replace("/", "--")}.jpg`;
}
