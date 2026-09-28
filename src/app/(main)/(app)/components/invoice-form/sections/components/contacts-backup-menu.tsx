import * as Sentry from "@sentry/nextjs";
import { Download, Ellipsis, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import {
  ImportContactsDialog,
  type ImportContactsDialogState,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/import-contacts-dialog";
import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  MAX_CONTACTS_BACKUP_FILE_BYTES,
  buildContactsBackupFileName,
  describeContactCounts,
  formatCount,
  mergeImportedContacts,
  parseContactsBackup,
  serializeContactsBackup,
} from "@/app/(main)/(app)/utils/contacts-backup";
import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  buyerSchema,
  sellerSchema,
  type LocalStorageKey,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { useIsLocalStorageAvailable } from "@/lib/use-is-local-storage-available";

/**
 * Dispatched on `window` after an import has written new sellers or buyers, so both
 * management sections re-read their lists, not just the one whose menu was used.
 */
export const SAVED_CONTACTS_IMPORTED_EVENT = "easy-invoice:contacts-imported";

interface ContactsBackupMenuProps {
  /** Mobile shows toasts at the top, desktop at the bottom right. */
  isMobile: boolean;
}

/**
 * The ⋯ menu next to "New Seller" / "New Buyer": exports every saved seller and buyer to
 * one JSON file, and imports such a file back.
 *
 * Both sections render it and it does the same thing in both, since the file always
 * holds both lists. An import only adds to the saved lists; it never changes which
 * seller or buyer the current invoice uses.
 */
export function ContactsBackupMenu({ isMobile }: ContactsBackupMenuProps) {
  const [hasSavedContacts, setHasSavedContacts] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importState, setImportState] = useState<ImportContactsDialogState>({
    step: "choose",
  });

  const isLocalStorageAvailable = useIsLocalStorageAvailable();
  const toastPosition = isMobile ? "top-center" : "bottom-right";

  const handleExport = () => {
    try {
      const sellers = readSavedContacts({
        key: SELLERS_LOCAL_STORAGE_KEY,
        schema: sellerSchema,
      });
      const buyers = readSavedContacts({
        key: BUYERS_LOCAL_STORAGE_KEY,
        schema: buyerSchema,
      });

      const exportedAt = new Date();
      const blob = new Blob(
        [serializeContactsBackup({ sellers, buyers, exportedAt })],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = buildContactsBackupFileName(exportedAt);
      link.click();

      // Safari starts the download asynchronously, so revoking right away can cancel it.
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success("Sellers & buyers exported", {
        id: "export_contacts_success_toast",
        description: `${formatCount({ count: sellers.length, noun: "seller" })} and ${formatCount({ count: buyers.length, noun: "buyer" })} saved to ${link.download}`,
        richColors: true,
        position: toastPosition,
      });

      umamiTrackEvent("export_contacts_success");
    } catch (error) {
      console.error("Failed to export sellers & buyers:", error);

      toast.error("Failed to export sellers & buyers", {
        id: "export_contacts_error_toast",
        description: "Please try again",
        closeButton: true,
        position: toastPosition,
      });

      Sentry.captureException(error);

      umamiTrackEvent("export_contacts_error");
    }
  };

  /**
   * Reads the chosen file and works out what importing it would add and skip, without
   * saving anything: the dialog shows that for the user to confirm.
   */
  const handleFileSelected = async (file: File) => {
    const showFileError = ({ error, reason }: ShowFileErrorOptions) => {
      setImportState({ step: "error", fileName: file.name, error });

      umamiTrackEvent("import_contacts_file_error", { data: { reason } });
    };

    if (file.size > MAX_CONTACTS_BACKUP_FILE_BYTES) {
      showFileError({
        error: "This file is too large to be a backup.",
        reason: "too_large",
      });

      return;
    }

    try {
      // Not `file.text()`: it is missing before Safari 14, which `.browserslistrc` still
      // targets, and Next does not polyfill it.
      const parsed = parseContactsBackup(await new Response(file).text());

      if (!parsed.success) {
        showFileError({ error: parsed.error, reason: "invalid_backup" });

        return;
      }

      const sellers = mergeImportedContacts({
        existing: readSavedContacts({
          key: SELLERS_LOCAL_STORAGE_KEY,
          schema: sellerSchema,
        }),
        imported: parsed.sellers,
        schema: sellerSchema,
        createId: createContactId,
        contactNoun: "seller",
      });

      const buyers = mergeImportedContacts({
        existing: readSavedContacts({
          key: BUYERS_LOCAL_STORAGE_KEY,
          schema: buyerSchema,
        }),
        imported: parsed.buyers,
        schema: buyerSchema,
        createId: createContactId,
        contactNoun: "buyer",
      });

      setImportState({
        step: "preview",
        fileName: file.name,
        sellers,
        buyers,
      });

      umamiTrackEvent("import_contacts_preview_shown", {
        data: {
          sellersToAdd: sellers.added.length,
          buyersToAdd: buyers.added.length,
          alreadySaved: sellers.duplicates.length + buyers.duplicates.length,
          invalid: sellers.invalidEntries.length + buyers.invalidEntries.length,
          nameConflicts:
            sellers.nameConflicts.length + buyers.nameConflicts.length,
        },
      });
    } catch (error) {
      console.error("Failed to read sellers & buyers backup:", error);

      showFileError({
        error: "Something went wrong while reading it. Please try again.",
        reason: "read_failed",
      });

      Sentry.captureException(error);
    }
  };

  const handleConfirmImport = () => {
    if (importState.step !== "preview") {
      return;
    }

    const { sellers, buyers } = importState;

    const showImportError = ({
      description,
      reason,
    }: ShowImportErrorOptions) => {
      umamiTrackEvent("import_contacts_error", { data: { reason } });

      toast.error("Could not import sellers & buyers", {
        id: "import_contacts_error_toast",
        description,
        closeButton: true,
        position: toastPosition,
      });
    };

    try {
      const previousSellersJson = getAppStorageItem(SELLERS_LOCAL_STORAGE_KEY);

      const areSellersPersisted = setAppStorageItem({
        key: SELLERS_LOCAL_STORAGE_KEY,
        value: JSON.stringify(sellers.contacts),
      });
      const areBuyersPersisted =
        areSellersPersisted &&
        setAppStorageItem({
          key: BUYERS_LOCAL_STORAGE_KEY,
          value: JSON.stringify(buyers.contacts),
        });

      if (!areBuyersPersisted) {
        // Put the sellers back if only they made it, so an import lands whole or not at all.
        if (areSellersPersisted) {
          setAppStorageItem({
            key: SELLERS_LOCAL_STORAGE_KEY,
            value: previousSellersJson ?? "[]",
          });
        }

        showImportError({
          description:
            "Your browser storage is full or unavailable. Nothing was imported.",
          reason: "storage_unavailable",
        });

        return;
      }

      window.dispatchEvent(new Event(SAVED_CONTACTS_IMPORTED_EVENT));

      setIsImportDialogOpen(false);

      toast.success(
        `Imported ${describeContactCounts({
          sellerCount: sellers.added.length,
          buyerCount: buyers.added.length,
        })}`,
        {
          id: "import_contacts_success_toast",
          richColors: true,
          position: toastPosition,
        },
      );

      umamiTrackEvent("import_contacts_success", {
        data: {
          sellersAdded: sellers.added.length,
          buyersAdded: buyers.added.length,
          invalid: sellers.invalidEntries.length + buyers.invalidEntries.length,
          nameConflicts:
            sellers.nameConflicts.length + buyers.nameConflicts.length,
        },
      });
    } catch (error) {
      console.error("Failed to import sellers & buyers:", error);

      showImportError({ description: "Please try again", reason: "unknown" });

      Sentry.captureException(error);
    }
  };

  return (
    <>
      {/*
        Not modal: a modal menu blocks the rest of the page, so with it open a tap on the
        other section's ⋯ (or anything else) only closed the menu and needed a second tap.
      */}
      <DropdownMenu
        modal={false}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            return;
          }

          umamiTrackEvent("contacts_backup_menu_opened");

          // dismiss any existing toast for better UX
          toast.dismiss();

          // Read on open rather than during render: storage is not there on the server,
          // and the other section may have just added or deleted an entry.
          setHasSavedContacts(
            readSavedContacts({
              key: SELLERS_LOCAL_STORAGE_KEY,
              schema: sellerSchema,
            }).length > 0 ||
              readSavedContacts({
                key: BUYERS_LOCAL_STORAGE_KEY,
                schema: buyerSchema,
              }).length > 0,
          );
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="size-8 shrink-0 px-2"
            aria-label="Import or export sellers & buyers"
          >
            <Ellipsis className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" loop>
          <DropdownMenuItem
            disabled={!hasSavedContacts}
            onSelect={handleExport}
          >
            <Download className="size-3.5" />
            Export sellers & buyers
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!isLocalStorageAvailable}
            onSelect={() => {
              setImportState({ step: "choose" });
              setIsImportDialogOpen(true);

              umamiTrackEvent("import_contacts_dialog_opened");
            }}
          >
            <Upload className="size-3.5" />
            Import from file…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImportContactsDialog
        isOpen={isImportDialogOpen}
        onOpenChange={(isOpen) => {
          setIsImportDialogOpen(isOpen);

          // A confirmed import closes the dialog itself, so this is only a dismissal
          if (!isOpen) {
            umamiTrackEvent("import_contacts_dialog_dismissed", {
              data: { step: importState.step },
            });
          }
        }}
        state={importState}
        onFileSelected={(file) => {
          void handleFileSelected(file);
        }}
        onConfirm={handleConfirmImport}
      />
    </>
  );
}

interface ShowFileErrorOptions {
  /** A user-facing explanation of why the file cannot be imported. */
  error: string;
  /** Sent to analytics; the error text itself may hold parts of the file. */
  reason: "too_large" | "invalid_backup" | "read_failed";
}

interface ShowImportErrorOptions {
  /** The toast's description. */
  description: string;
  /** Sent to analytics. */
  reason: "storage_unavailable" | "unknown";
}

interface ReadSavedContactsOptions<T> {
  /** The `localStorage` key holding the list. */
  key: LocalStorageKey;
  /** The schema each saved entry must pass. */
  schema: z.ZodType<T>;
}

/**
 * The saved list with invalid entries left out. The management sections already drop
 * and report those when they load, so they are not reported again here.
 *
 * A value that is not JSON at all reads as an empty list, which is also what the
 * management sections show for it. Throwing instead would make export and import fail
 * for good, and importing a backup is exactly how the user gets the list back.
 */
function readSavedContacts<T>({
  key,
  schema,
}: ReadSavedContactsOptions<T>): T[] {
  const parsed = parseStoredJson(getAppStorageItem(key));

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    const result = schema.safeParse(entry);

    return result.success ? [result.data] : [];
  });
}

/**
 * Saved contacts use `Date.now()` ids, which would collide when a whole file is imported
 * in the same millisecond, so imported entries without an id get a random suffix too.
 *
 * Not `crypto.randomUUID()`: it is missing before Safari 15.4, which `.browserslistrc`
 * still targets, and Next does not polyfill it. The id only has to be unique within
 * this browser's list, not unguessable.
 */
function createContactId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseStoredJson(saved: string | null): unknown {
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}
