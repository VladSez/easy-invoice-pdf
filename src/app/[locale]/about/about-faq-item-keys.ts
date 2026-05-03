/**
 * FAQ entries shown on the about page and mirrored in FAQPage JSON-LD.
 * Single source of truth to avoid schema/content drift.
 */
export const ABOUT_FAQ_ITEM_KEYS = [
  "whatIs",
  "isFree",
  "accountNeeded",
  "customization",
  "dataSecurity",
  "sharing",
] as const;
