export const FORM_PREFIX_IDS = {
  MOBILE: "mobile-invoice-form",
  DESKTOP: "desktop-invoice-form",
} as const satisfies Record<string, string>;

export type FormPrefixId =
  (typeof FORM_PREFIX_IDS)[keyof typeof FORM_PREFIX_IDS];
