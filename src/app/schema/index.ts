import type { SupportedLanguages } from "@easyinvoicepdf/invoice-core";
import dayjs from "dayjs";
import { z } from "zod";

// The invoice schema itself lives in `@easyinvoicepdf/invoice-core`, which the backend
// shares. It is re-exported here only while the app's imports move over (openspec change
// `backend-split`, task 6.1). What follows is web-app-only.
export * from "@easyinvoicepdf/invoice-core";

/**
 * The languages the *interface* is translated into.
 *
 * Every one of these is a route (`/pt/about`), a `messages/<locale>.json`, a
 * `public/<locale>/about.md`, a sitemap entry and a footer link, so a locale costs a page
 * to write and keep up to date. An invoice language costs a column of labels, which is why
 * the two lists are allowed to differ: `pt-BR` prints a Brazilian invoice without
 * committing the site to a second Portuguese translation.
 *
 * `satisfies` keeps it a subset -- a locale has to be a language the PDF can be written in
 * too, since the about page links straight into the generator.
 *
 * `en` has to stay first: it is read as the default locale (`SUPPORTED_I18N_LOCALES[0]`) by the
 * i18n routing.
 */
export const SUPPORTED_I18N_LOCALES = [
  "en",
  "pl",
  "nl",
  "fr",
  "de",
  "it",
  "nb",
  "pt",
  "ru",
  "es",
  "sv",
  "uk",
] as const satisfies readonly SupportedLanguages[];
export type SupportedLocale = (typeof SUPPORTED_I18N_LOCALES)[number];

/**
 *
 * This is the version of the app and the schema of the app's data model
 */
export const APP_VERSION = "1.0.0";

/**
 * Schema version
 *
 * This is the version of the schema (zod) of the app's data model
 */
export const SCHEMA_VERSION = "1.0.0";

/**
 * Accordion state schema
 *
 * This schema is used to store the state of the accordion in the local storage
 *
 * The accordion is used to collapse/expand the sections of the invoice form
 */
export const accordionSchema = z
  .object({
    general: z.boolean(),
    seller: z.boolean(),
    buyer: z.boolean(),
    invoiceItems: z.boolean(),
  })
  .strict();

export type AccordionState = z.infer<typeof accordionSchema>;

export const MOBILE_TABS_VALUES = ["invoice-form", "invoice-preview"] as const;
export const DEFAULT_MOBILE_TAB = MOBILE_TABS_VALUES[0];

export type MobileTabsValues = (typeof MOBILE_TABS_VALUES)[number];

/**
 * Metadata schema
 *
 * This schema is used to store the metadata about EasyInvoicePDF web app in the local storage
 */
export const metadataSchema = z.object({
  /** the app version */
  appVersion: z.string().default(APP_VERSION),
  /** the schema (zod) version of the app's data model */
  schemaVersion: z.string().default(SCHEMA_VERSION),
  /** when the invoice was created (i.e. invoice is first created) */
  invoiceCreatedAt: z.iso.datetime().default(() => {
    return dayjs().toISOString();
  }),
  /** when the invoice was last updated (i.e. invoice is regenerated) */
  invoiceLastUpdatedAt: z.iso.datetime().optional(),

  /** the last visited mobile tab (for better UX) */
  lastVisitedMobileTab: z
    .enum(MOBILE_TABS_VALUES)
    .default(DEFAULT_MOBILE_TAB)
    .optional(),

  /** how many times the invoice PDF has been downloaded */
  invoiceDownloadCount: z.number().int().nonnegative().default(0),
  /** how many times the invoice has been shared via link */
  invoiceSharedCount: z.number().int().nonnegative().default(0),
});

export type Metadata = z.infer<typeof metadataSchema>;
