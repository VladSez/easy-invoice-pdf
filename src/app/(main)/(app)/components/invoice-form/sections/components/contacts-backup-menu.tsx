import * as Sentry from "@sentry/nextjs";
import { Download, Ellipsis, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";

import {
  ImportIssuesDialog,
  type InvalidImportedContact,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/import-issues-dialog";
import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  MAX_CONTACTS_BACKUP_FILE_BYTES,
  buildContactsBackupFileName,
  describeImportResult,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSavedContacts, setHasSavedContacts] = useState(false);
  const [invalidImportedEntries, setInvalidImportedEntries] = useState<
    InvalidImportedContact[]
  >([]);
  const [isImportIssuesDialogOpen, setIsImportIssuesDialogOpen] =
    useState(false);

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
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // Clear the input so picking the same file again still fires `change`.
    input.value = "";

    if (!file) {
      return;
    }

    const showImportError = (description: string) => {
      toast.error("Could not import sellers & buyers", {
        id: "import_contacts_error_toast",
        description,
        closeButton: true,
        position: toastPosition,
      });
    };

    if (file.size > MAX_CONTACTS_BACKUP_FILE_BYTES) {
      showImportError("This file is too large to be a backup.");

      return;
    }

    try {
      // Not `file.text()`: it is missing before Safari 14, which `.browserslistrc` still
      // targets, and Next does not polyfill it.
      const parsed = parseContactsBackup(await new Response(file).text());

      if (!parsed.success) {
        showImportError(parsed.error);

        return;
      }

      const previousSellersJson = getAppStorageItem(SELLERS_LOCAL_STORAGE_KEY);

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

        showImportError(
          "Your browser storage is full or unavailable. Nothing was imported.",
        );

        return;
      }

      window.dispatchEvent(new Event(SAVED_CONTACTS_IMPORTED_EVENT));

      // Invalid entries and name conflicts are listed together in the details dialog
      const invalidEntries: InvalidImportedContact[] = [
        ...[...sellers.invalidEntries, ...sellers.nameConflicts].map(
          (entry) => {
            return { ...entry, party: "Seller" as const };
          },
        ),
        ...[...buyers.invalidEntries, ...buyers.nameConflicts].map((entry) => {
          return { ...entry, party: "Buyer" as const };
        }),
      ];

      setInvalidImportedEntries(invalidEntries);

      showImportResultToast({
        addedSellerCount: sellers.addedCount,
        addedBuyerCount: buyers.addedCount,
        duplicateCount: sellers.duplicateCount + buyers.duplicateCount,
        invalidCount:
          sellers.invalidEntries.length + buyers.invalidEntries.length,
        nameConflictCount:
          sellers.nameConflicts.length + buyers.nameConflicts.length,
        onViewDetails: () => {
          setIsImportIssuesDialogOpen(true);
        },
        toastPosition,
      });

      umamiTrackEvent("import_contacts_success", {
        data: {
          sellersAdded: sellers.addedCount,
          buyersAdded: buyers.addedCount,
          invalid: sellers.invalidEntries.length + buyers.invalidEntries.length,
          nameConflicts:
            sellers.nameConflicts.length + buyers.nameConflicts.length,
        },
      });
    } catch (error) {
      console.error("Failed to import sellers & buyers:", error);

      showImportError("Please try again");

      Sentry.captureException(error);
    }
  };

  return (
    <>
      <DropdownMenu
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            return;
          }

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
              fileInputRef.current?.click();
            }}
          >
            <Upload className="size-3.5" />
            Import from file…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import sellers & buyers from file"
        data-testid="contacts-backup-file-input"
        onChange={(event) => {
          void handleImportFile(event);
        }}
      />

      <ImportIssuesDialog
        isOpen={isImportIssuesDialogOpen}
        onOpenChange={setIsImportIssuesDialogOpen}
        invalidEntries={invalidImportedEntries}
      />
    </>
  );
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

interface ShowImportResultToastOptions {
  addedSellerCount: number;
  addedBuyerCount: number;
  /** Entries skipped because they were already saved. */
  duplicateCount: number;
  /** How many entries were skipped because they failed validation. */
  invalidCount: number;
  /** How many entries were skipped because a different contact already uses their name. */
  nameConflictCount: number;
  /** Opens the dialog that shows what is wrong with the invalid entries. */
  onViewDetails: () => void;
  toastPosition: "top-center" | "bottom-right";
}

/**
 * One toast summarizing the import. When entries were skipped as invalid it stays open,
 * with a button to the dialog that shows what is wrong with them.
 */
function showImportResultToast({
  onViewDetails,
  toastPosition,
  ...counts
}: ShowImportResultToastOptions) {
  const { tone, title, description } = describeImportResult(counts);

  const options = {
    id: "import_contacts_result_toast",
    description,
    position: toastPosition,
  };

  if (tone === "success") {
    toast.success(title, { ...options, richColors: true });

    return;
  }

  const showToast = tone === "warning" ? toast.warning : toast.error;

  showToast(title, {
    ...options,
    duration: Infinity,
    closeButton: true,
    action: {
      label: "View details",
      onClick: onViewDetails,
    },
  });
}
