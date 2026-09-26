import dayjs from "dayjs";
import { z } from "zod";

import type { BuyerData, SellerData } from "@/app/schema";

/**
 * Identifies a file as ours, so importing some unrelated JSON fails with a clear message
 * instead of a list of "invalid entries".
 */
const CONTACTS_BACKUP_APP_ID = "easyinvoicepdf";

/**
 * Bump when the file shape changes in a way an older app cannot read, and teach
 * {@link parseContactsBackup} to upgrade the previous versions.
 */
const CONTACTS_BACKUP_VERSION = 1;

/**
 * Upper bound for an imported file. A backup of a few hundred sellers and buyers is tens
 * of kilobytes, and `localStorage` caps out around 5 MB anyway.
 */
export const MAX_CONTACTS_BACKUP_FILE_BYTES = 1_000_000;

/**
 * Only the envelope is checked here. Entries are kept as `unknown` and validated one by
 * one while merging, so one bad entry does not throw away the rest of the file.
 */
const contactsBackupSchema = z.object({
  app: z.literal(CONTACTS_BACKUP_APP_ID),
  version: z.number().int().positive(),
  sellers: z.array(z.unknown()).default([]),
  buyers: z.array(z.unknown()).default([]),
});

const NOT_A_BACKUP_ERROR =
  "This file is not an EasyInvoicePDF sellers & buyers backup.";

interface SerializeContactsBackupOptions {
  /** Saved sellers, as read from `localStorage`. */
  sellers: SellerData[];
  /** Saved buyers, as read from `localStorage`. */
  buyers: BuyerData[];
  /** When the backup was made, recorded in the file for the user's benefit. */
  exportedAt: Date;
}

/**
 * Turns the saved sellers and buyers into the contents of a backup file.
 *
 * Visibility flags that are `true` are left out: that is their schema default, so they
 * come back on import, and the file stays readable. Hidden (`false`) flags are kept, so
 * a field someone chose to hide stays hidden after a restore.
 */
export function serializeContactsBackup({
  sellers,
  buyers,
  exportedAt,
}: SerializeContactsBackupOptions): string {
  const backup = {
    app: CONTACTS_BACKUP_APP_ID,
    version: CONTACTS_BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    sellers: sellers.map((seller) => {
      return omitDefaultVisibilityFlags(seller);
    }),
    buyers: buyers.map((buyer) => {
      return omitDefaultVisibilityFlags(buyer);
    }),
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * `easyinvoicepdf-contacts-2026-09-26.json`, dated in the user's local time zone.
 */
export function buildContactsBackupFileName(date: Date): string {
  return `${CONTACTS_BACKUP_APP_ID}-contacts-${dayjs(date).format("YYYY-MM-DD")}.json`;
}

type ParseContactsBackupResult =
  | {
      success: true;
      /** Raw seller entries, still to be validated by {@link mergeImportedContacts}. */
      sellers: unknown[];
      /** Raw buyer entries, still to be validated by {@link mergeImportedContacts}. */
      buyers: unknown[];
    }
  | {
      success: false;
      /** A user-facing explanation of why the file cannot be imported. */
      error: string;
    };

/**
 * Reads the text of an uploaded backup file and checks it is one of ours.
 */
export function parseContactsBackup(text: string): ParseContactsBackupResult {
  let json: unknown;

  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, error: NOT_A_BACKUP_ERROR };
  }

  const result = contactsBackupSchema.safeParse(json);

  if (!result.success) {
    return { success: false, error: NOT_A_BACKUP_ERROR };
  }

  const { version, sellers, buyers } = result.data;

  if (version > CONTACTS_BACKUP_VERSION) {
    return {
      success: false,
      error:
        "This backup was made by a newer version of EasyInvoicePDF. Reload the page and try again.",
    };
  }

  if (sellers.length === 0 && buyers.length === 0) {
    return {
      success: false,
      error: "This backup has no sellers or buyers in it.",
    };
  }

  return { success: true, sellers, buyers };
}

/** A saved seller or buyer: all the merge needs is an id and a name. */
interface SavedContact {
  id?: string;
  name: string;
}

export interface InvalidContactEntry {
  /** The entry's name when it has one, otherwise its position in the file. */
  label: string;
  /** The entry exactly as it is in the file, so the user can see what to fix. */
  entry: unknown;
  /** Every validation problem with the entry, not just the first. */
  issues: ContactEntryIssue[];
}

export interface ContactEntryIssue {
  /**
   * The key of the field that failed, as written in the file (e.g. `email`), so the user
   * can find it there. Absent when the entry as a whole is wrong, e.g. not an object.
   */
  field?: string;
  /** What is wrong with it, e.g. "Invalid email address". */
  message: string;
}

interface MergeImportedContactsOptions<T extends SavedContact> {
  /** The contacts already saved in this browser. They are never changed or removed. */
  existing: T[];
  /** Raw entries from the backup file. */
  imported: unknown[];
  /** `sellerSchema` or `buyerSchema`, applied to each imported entry. */
  schema: z.ZodType<T>;
  /** Makes an id for an imported entry that has none. */
  createId: () => string;
  /** "seller" or "buyer", for the message about a name that is already taken. */
  contactNoun: string;
}

interface MergeImportedContactsResult<T extends SavedContact> {
  /** The existing contacts followed by the newly added ones. */
  contacts: T[];
  /** How many imported entries were added. */
  addedCount: number;
  /** Imported entries skipped because the same id or the same details are already saved. */
  duplicateCount: number;
  /** Imported entries skipped because they failed validation. */
  invalidEntries: InvalidContactEntry[];
  /**
   * Imported entries skipped because a different contact already uses their name. The
   * add/edit dialog does not allow two contacts with one name (the dropdown lists only
   * names, and the pair could no longer be edited), so import does not either.
   */
  nameConflicts: InvalidContactEntry[];
}

/**
 * Adds the imported entries that are valid and new to the saved list.
 *
 * An entry counts as already saved when its id matches a saved one (the same contact,
 * possibly edited here since the backup was made, and the local edit wins) or when all
 * its details match one (the same contact saved twice, e.g. in two browsers). An entry
 * with new details but a name that is already saved is a conflict and is not added.
 * Nothing already saved is ever changed or removed.
 */
export function mergeImportedContacts<T extends SavedContact>({
  existing,
  imported,
  schema,
  createId,
  contactNoun,
}: MergeImportedContactsOptions<T>): MergeImportedContactsResult<T> {
  const contacts = [...existing];
  const knownIds = new Set(
    existing.flatMap((contact) => {
      return contact.id ? [contact.id] : [];
    }),
  );
  const knownFingerprints = new Set(
    existing.map((contact) => {
      return fingerprintContact(contact);
    }),
  );
  // Compared exactly as the add/edit dialog does: trimmed (by the schema), case-sensitive
  const knownNames = new Set(
    existing.map((contact) => {
      return contact.name;
    }),
  );

  let addedCount = 0;
  let duplicateCount = 0;
  const invalidEntries: InvalidContactEntry[] = [];
  const nameConflicts: InvalidContactEntry[] = [];

  for (const [index, entry] of imported.entries()) {
    const result = schema.safeParse(entry);

    if (!result.success) {
      invalidEntries.push({
        label: labelInvalidEntry({ entry, index }),
        entry,
        issues: result.error.issues.map((issue) => {
          return describeIssue({ entry, issue });
        }),
      });

      continue;
    }

    const contact = result.data;
    const fingerprint = fingerprintContact(contact);
    const isDuplicate =
      (contact.id !== undefined && knownIds.has(contact.id)) ||
      knownFingerprints.has(fingerprint);

    if (isDuplicate) {
      duplicateCount += 1;

      continue;
    }

    if (knownNames.has(contact.name)) {
      nameConflicts.push({
        label: labelInvalidEntry({ entry, index }),
        entry,
        issues: [
          {
            field: "name",
            message: `A ${contactNoun} with this name is already saved`,
          },
        ],
      });

      continue;
    }

    const contactWithId = { ...contact, id: contact.id || createId() };

    contacts.push(contactWithId);
    knownIds.add(contactWithId.id);
    knownFingerprints.add(fingerprint);
    knownNames.add(contactWithId.name);
    addedCount += 1;
  }

  return {
    contacts,
    addedCount,
    duplicateCount,
    invalidEntries,
    nameConflicts,
  };
}

function omitDefaultVisibilityFlags(
  contact: SellerData | BuyerData,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(contact).filter(([key, value]) => {
      return !(key.endsWith("FieldIsVisible") && value === true);
    }),
  );
}

/**
 * The contact's details without its id, with keys sorted so that two entries with the
 * same details but a different key order compare equal.
 */
function fingerprintContact(contact: SavedContact): string {
  const details = Object.entries(contact)
    .filter(([key, value]) => {
      return key !== "id" && value !== undefined;
    })
    // Not `toSorted()`: it is missing before Safari 16, which `.browserslistrc` still
    // targets, and Next does not polyfill it. `filter` already returned a copy.
    .sort(([a], [b]) => {
      return a.localeCompare(b);
    });

  return JSON.stringify(details);
}

interface DescribeIssueOptions {
  /** The raw entry that failed validation. */
  entry: unknown;
  /** One of the problems zod found with it. */
  issue: z.core.$ZodIssue;
}

/**
 * zod reports a missing field as "Invalid input: expected string, received undefined",
 * which reads as jargon, so a field absent from the entry is reported as "Required".
 */
function describeIssue({
  entry,
  issue,
}: DescribeIssueOptions): ContactEntryIssue {
  const field = issue.path.join(".");

  if (!field) {
    return { message: issue.message };
  }

  const [key] = issue.path;
  const isMissing =
    issue.code === "invalid_type" &&
    typeof entry === "object" &&
    entry !== null &&
    typeof key === "string" &&
    !Object.hasOwn(entry, key);

  return { field, message: isMissing ? "Required" : issue.message };
}

interface LabelInvalidEntryOptions {
  /** The raw entry that failed validation. */
  entry: unknown;
  /** Its zero-based position in the file's list. */
  index: number;
}

function labelInvalidEntry({ entry, index }: LabelInvalidEntryOptions): string {
  const name =
    typeof entry === "object" && entry !== null && "name" in entry
      ? entry.name
      : undefined;

  return typeof name === "string" && name.trim()
    ? `“${name.trim()}”`
    : `Entry #${index + 1}`;
}

interface DescribeImportResultOptions {
  /** Sellers added to the saved list. */
  addedSellerCount: number;
  /** Buyers added to the saved list. */
  addedBuyerCount: number;
  /** Entries skipped because they were already saved. */
  duplicateCount: number;
  /** Entries skipped because they failed validation. */
  invalidCount: number;
  /** Entries skipped because a different contact already uses their name. */
  nameConflictCount: number;
}

interface ImportResultDescription {
  /**
   * `success` when nothing needs the user's attention, `warning` when some entries were
   * imported and some could not be, `error` when none could be.
   */
  tone: "success" | "warning" | "error";
  title: string;
  description: string | null;
}

/**
 * The wording of the import result toast.
 *
 * "Nothing new to import" is kept for a file whose entries are all already saved; when
 * nothing was added because entries could not be imported, it says so instead.
 */
export function describeImportResult({
  addedSellerCount,
  addedBuyerCount,
  duplicateCount,
  invalidCount,
  nameConflictCount,
}: DescribeImportResultOptions): ImportResultDescription {
  const addedParts = [
    addedSellerCount > 0
      ? formatCount({ count: addedSellerCount, noun: "seller" })
      : null,
    addedBuyerCount > 0
      ? formatCount({ count: addedBuyerCount, noun: "buyer" })
      : null,
  ].filter((part) => {
    return part !== null;
  });

  const hasAdded = addedParts.length > 0;
  const hasProblems = invalidCount + nameConflictCount > 0;

  const title = hasAdded
    ? `Imported ${addedParts.join(" and ")}`
    : hasProblems
      ? "Nothing was imported"
      : "Nothing new to import";

  const duplicatesSummary =
    duplicateCount > 0
      ? `${formatCount({ count: duplicateCount, noun: "entry", plural: "entries" })} already saved, skipped.`
      : null;

  const invalidSummary =
    invalidCount > 0
      ? `${formatCount({ count: invalidCount, noun: "entry has", plural: "entries have" })} invalid data and ${invalidCount === 1 ? "was" : "were"} not imported.`
      : null;

  const nameConflictSummary =
    nameConflictCount > 0
      ? `${formatCount({ count: nameConflictCount, noun: "entry uses a name", plural: "entries use names" })} already saved and ${nameConflictCount === 1 ? "was" : "were"} not imported.`
      : null;

  const description =
    [duplicatesSummary, invalidSummary, nameConflictSummary]
      .filter((part) => {
        return part !== null;
      })
      .join(" ") || null;

  const tone = hasProblems ? (hasAdded ? "warning" : "error") : "success";

  return { tone, title, description };
}

interface FormatCountOptions {
  count: number;
  /** Singular form, e.g. "seller". */
  noun: string;
  /** Plural form, when it is not just `noun` + "s". */
  plural?: string;
}

/** `1 seller`, `3 sellers`. */
export function formatCount({
  count,
  noun,
  plural = `${noun}s`,
}: FormatCountOptions): string {
  return `${count} ${count === 1 ? noun : plural}`;
}
