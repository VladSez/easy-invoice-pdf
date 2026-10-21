import { INVOICE_SCHEMA_VERSION } from ".";

/**
 * Upgrades stored invoice JSON from the version it was saved with to the next one. The key is
 * the version a step upgrades *from*: `{ 1: (data) => … }` turns a version-1 invoice into a
 * version-2 one.
 *
 * Empty while `INVOICE_SCHEMA_VERSION` is 1. When the version is bumped, add the step for the
 * old version here in the same change, so every stored invoice keeps a path to the current
 * format.
 */
export type InvoiceMigrationSteps = Readonly<
  Record<number, (data: unknown) => unknown>
>;

export const INVOICE_MIGRATION_STEPS: InvoiceMigrationSteps = {};

interface MigrateInvoiceDataArgs {
  /** The stored invoice JSON, as it was saved. Not validated here. */
  data: unknown;
  /** The `INVOICE_SCHEMA_VERSION` the invoice was saved with. */
  fromVersion: number;
  /** Version to upgrade to. Defaults to the current one; tests pass a smaller one. */
  toVersion?: number;
  /** The upgrade steps. Defaults to {@link INVOICE_MIGRATION_STEPS}; tests pass their own. */
  steps?: InvoiceMigrationSteps;
}

type MigrateInvoiceDataResult =
  | {
      success: true;
      /** The invoice JSON in the `toVersion` format, still to be validated with `invoiceSchema`. */
      data: unknown;
      /** The version `data` is now in. */
      version: number;
    }
  | {
      success: false;
      error:
        | "invalid_version"
        | "future_version"
        | "missing_step"
        | "step_failed";
      /** Says which version failed and why, for logs; not meant for end users. */
      message: string;
    };

/**
 * Upgrades a stored invoice to the current invoice format, one version step at a time.
 *
 * The result still has to go through `invoiceSchema`: a step only reshapes the JSON, it
 * doesn't promise the result is valid. At the current version the data comes back as is.
 * Expected failures (a version this build doesn't know, a missing or throwing step) come back
 * as `success: false` rather than being thrown, so one bad row can't break a whole list.
 */
export function migrateInvoiceData({
  data,
  fromVersion,
  toVersion = INVOICE_SCHEMA_VERSION,
  steps = INVOICE_MIGRATION_STEPS,
}: MigrateInvoiceDataArgs): MigrateInvoiceDataResult {
  if (!Number.isInteger(fromVersion) || fromVersion < 0) {
    return {
      success: false,
      error: "invalid_version",
      message: `Stored invoice version ${String(fromVersion)} is not a non-negative integer.`,
    };
  }

  if (fromVersion > toVersion) {
    return {
      success: false,
      error: "future_version",
      message: `Stored invoice version ${fromVersion} is newer than this build's version ${toVersion}.`,
    };
  }

  let current = data;

  for (let version = fromVersion; version < toVersion; version += 1) {
    const step = steps[version];

    if (!step) {
      return {
        success: false,
        error: "missing_step",
        message: `No migration step from invoice version ${version} to ${version + 1}.`,
      };
    }

    try {
      current = step(current);
    } catch (error) {
      console.error(
        `[migrateInvoiceData] step from version ${version} failed`,
        error,
      );

      return {
        success: false,
        error: "step_failed",
        message: `The migration step from invoice version ${version} to ${version + 1} failed.`,
      };
    }
  }

  return { success: true, data: current, version: toVersion };
}
