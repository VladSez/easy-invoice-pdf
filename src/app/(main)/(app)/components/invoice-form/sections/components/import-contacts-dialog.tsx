import { Check, ChevronDown, FileUp, FileWarning } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import {
  describeContactCounts,
  type ContactEntryIssue,
  type InvalidContactEntry,
  type MergeImportedContactsResult,
} from "@/app/(main)/(app)/utils/contacts-backup";
import type { BuyerData, SellerData } from "@/app/schema";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Longer values are cut short, so one long address does not push the problem off screen. */
const MAX_VALUE_LENGTH = 120;

export type ImportContactsDialogState =
  | { step: "choose" }
  | {
      step: "error";
      /** The name of the file that could not be read. */
      fileName: string;
      /** A user-facing explanation of why the file cannot be imported. */
      error: string;
    }
  | {
      step: "preview";
      /** The name of the file being imported. */
      fileName: string;
      /** What importing the file would do to the saved sellers. */
      sellers: MergeImportedContactsResult<SellerData>;
      /** What importing the file would do to the saved buyers. */
      buyers: MergeImportedContactsResult<BuyerData>;
    };

interface ImportContactsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  state: ImportContactsDialogState;
  /** Called with the file the user picked or dropped. */
  onFileSelected: (file: File) => void;
  /** Saves the entries shown in the preview. */
  onConfirm: () => void;
}

/**
 * Import runs in one dialog: choose a file, then review what it would add and what it
 * would skip (with the problems in each entry that cannot be imported) before anything
 * is saved. A file that cannot be read at all shows why, and the shape we expect.
 */
export function ImportContactsDialog({
  isOpen,
  onOpenChange,
  state,
  onFileSelected,
  onConfirm,
}: ImportContactsDialogProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // An effect event, so the listeners below see the latest callback without
  // re-subscribing on every render
  const handleDroppedFile = useEffectEvent((file: File) => {
    onFileSelected(file);
  });

  const isChoosingFile = state.step === "choose";

  // The whole window takes the drop on the choose step, overlay included. A file released
  // anywhere the page does not cancel `drop` gets the browser's default action, which
  // opens it in the tab and navigates away from the app, so file drops are still cancelled
  // on the other steps; they just import nothing, so a stray drop cannot swap the file
  // under review. Drags that carry no file (selected text, links) are left alone.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // The elements the drag has entered and not yet left, as each child element the
    // pointer crosses fires both events. `relatedTarget` cannot tell leaving the window
    // from moving between children: WebKit leaves it null on every `dragleave`. A set
    // rather than a count, because Firefox can fire `dragenter` more than once on the same
    // element, which would leave a count above zero after the drag has left the window.
    const enteredTargets = new Set<EventTarget>();

    const handleDragEnter = (event: DragEvent) => {
      if (!isChoosingFile || !isFileDrag(event) || !event.target) {
        return;
      }

      enteredTargets.add(event.target);
      setIsDraggingFile(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!event.target) {
        return;
      }

      enteredTargets.delete(event.target);

      if (enteredTargets.size === 0) {
        setIsDraggingFile(false);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      event.preventDefault();

      if (!isChoosingFile && event.dataTransfer) {
        // Shows the "not allowed" cursor instead of suggesting the drop does something
        event.dataTransfer.dropEffect = "none";
      }
    };

    const handleDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) {
        return;
      }

      event.preventDefault();
      enteredTargets.clear();
      setIsDraggingFile(false);

      const file = event.dataTransfer?.files[0];

      if (isChoosingFile && file) {
        handleDroppedFile(file);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
      setIsDraggingFile(false);
    };
  }, [isOpen, isChoosingFile]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        // `dvh` is missing before Safari 15.4; without the `vh` fallback the dialog would
        // have no height limit there, pushing its title and buttons off screen
        className="flex max-h-[calc(100vh-2rem)] flex-col gap-4 supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] sm:max-w-[520px]"
        data-testid="import-contacts-dialog"
      >
        {state.step === "choose" ? (
          <ChooseFileStep
            isDraggingFile={isDraggingFile}
            onFileSelected={onFileSelected}
          />
        ) : state.step === "error" ? (
          <FileErrorStep
            fileName={state.fileName}
            error={state.error}
            onFileSelected={onFileSelected}
          />
        ) : (
          <PreviewStep
            fileName={state.fileName}
            sellers={state.sellers}
            buyers={state.buyers}
            onFileSelected={onFileSelected}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ChooseFileStepProps {
  /** A file is being dragged over the page, so the drop zone shows it will take it. */
  isDraggingFile: boolean;
  onFileSelected: (file: File) => void;
}

function ChooseFileStep({
  isDraggingFile,
  onFileSelected,
}: ChooseFileStepProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Import sellers & buyers</DialogTitle>
        <DialogDescription className="text-pretty">
          Choose a file made with “Export sellers & buyers”. You’ll review
          everything in it before anything is saved.
        </DialogDescription>
      </DialogHeader>

      <FilePickerLabel
        onFileSelected={onFileSelected}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 hover:bg-slate-50",
          isDraggingFile && "border-slate-600 bg-slate-100",
        )}
      >
        <FileUp className="mb-1 size-5 text-slate-500" aria-hidden />
        <span className="text-sm font-medium text-slate-900">
          Drop a .json file here
        </span>
        <span className="text-sm text-slate-500">
          or <span className="underline underline-offset-2">choose a file</span>
        </span>
      </FilePickerLabel>

      <ul className="space-y-1.5 text-sm text-slate-600">
        {IMPORT_RULES.map((rule) => {
          return (
            <li key={rule} className="flex gap-2">
              <Check
                className="mt-0.5 size-3.5 shrink-0 text-green-600"
                aria-hidden
              />
              {rule}
            </li>
          );
        })}
      </ul>

      <details className="group text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="size-3.5 transition-transform group-open:rotate-180"
            aria-hidden
          />
          What does the file look like?
        </summary>
        <ExpectedFileShape />
      </details>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}

interface FileErrorStepProps {
  fileName: string;
  error: string;
  onFileSelected: (file: File) => void;
}

function FileErrorStep({
  fileName,
  error,
  onFileSelected,
}: FileErrorStepProps) {
  return (
    <>
      <DialogHeader className="text-left">
        <div className="flex items-center gap-2">
          <FileWarning className="size-5 shrink-0 text-red-600" aria-hidden />
          <DialogTitle>This file can’t be imported</DialogTitle>
        </div>
        <DialogDescription className="text-pretty">
          <span className="break-all font-medium text-slate-700">
            {fileName}
          </span>
          : {error}
        </DialogDescription>
      </DialogHeader>

      <div className="text-sm">
        <p className="text-slate-600">A backup file looks like this:</p>
        <ExpectedFileShape />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </DialogClose>
        <FilePickerLabel
          onFileSelected={onFileSelected}
          className={buttonVariants({
            size: "sm",
            className:
              "cursor-pointer focus-within:outline focus-within:outline-2",
          })}
        >
          Choose another file
        </FilePickerLabel>
      </DialogFooter>
    </>
  );
}

interface PreviewStepProps {
  fileName: string;
  sellers: MergeImportedContactsResult<SellerData>;
  buyers: MergeImportedContactsResult<BuyerData>;
  onFileSelected: (file: File) => void;
  onConfirm: () => void;
}

function PreviewStep({
  fileName,
  sellers,
  buyers,
  onFileSelected,
  onConfirm,
}: PreviewStepProps) {
  const addedCount = sellers.added.length + buyers.added.length;
  const duplicateCount = sellers.duplicates.length + buyers.duplicates.length;
  const nameConflictCount =
    sellers.nameConflicts.length + buyers.nameConflicts.length;
  const problemCount =
    sellers.invalidEntries.length +
    buyers.invalidEntries.length +
    nameConflictCount;

  const title =
    addedCount > 0
      ? "Review import"
      : problemCount > 0
        ? "Nothing can be imported"
        : "Nothing new to import";

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="break-all">{fileName}</DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-3 gap-2">
        <PreviewStat label="to add" count={addedCount} />
        <PreviewStat label="already saved" count={duplicateCount} />
        <PreviewStat
          label="can’t import"
          count={problemCount}
          isProblem={problemCount > 0}
        />
      </dl>

      {problemCount > 0 ? (
        <p className="text-pretty text-sm text-slate-600">
          {addedCount > 0
            ? "Fix the highlighted fields in the file and import it again, or import the rest now."
            : "Fix the highlighted fields in the file and import it again."}
          {nameConflictCount > 0
            ? " For a name that’s already saved, rename it in the file or rename the saved one."
            : null}
        </p>
      ) : null}

      <div className="-mx-6 min-h-0 flex-1 space-y-4 overflow-y-auto px-6">
        <PartyPreview party="Sellers" result={sellers} />
        <PartyPreview party="Buyers" result={buyers} />
      </div>

      <DialogFooter>
        {addedCount > 0 ? (
          <>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button size="sm" onClick={onConfirm}>
              Import{" "}
              {describeContactCounts({
                sellerCount: sellers.added.length,
                buyerCount: buyers.added.length,
              })}
            </Button>
          </>
        ) : (
          <>
            <FilePickerLabel
              onFileSelected={onFileSelected}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "cursor-pointer focus-within:outline focus-within:outline-2",
              })}
            >
              Choose another file
            </FilePickerLabel>
            <DialogClose asChild>
              <Button size="sm">Close</Button>
            </DialogClose>
          </>
        )}
      </DialogFooter>
    </>
  );
}

interface PreviewStatProps {
  label: string;
  count: number;
  /** Highlights the count in red. */
  isProblem?: boolean;
}

function PreviewStat({ label, count, isProblem = false }: PreviewStatProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse rounded-lg bg-slate-50 px-3 py-2",
        isProblem && "bg-red-50 text-red-700",
      )}
    >
      <dt className={cn("text-xs text-slate-500", isProblem && "text-red-700")}>
        {label}
      </dt>
      <dd className="text-lg font-semibold tabular-nums">{count}</dd>
    </div>
  );
}

interface PartyPreviewProps {
  party: "Sellers" | "Buyers";
  result: MergeImportedContactsResult<SellerData | BuyerData>;
}

/**
 * One party's entries from the file: the new ones first, then the ones that cannot be
 * imported (opened, so their problems show), then the ones already saved.
 */
function PartyPreview({ party, result }: PartyPreviewProps) {
  const { added, duplicates, invalidEntries, nameConflicts } = result;

  if (
    added.length +
      duplicates.length +
      invalidEntries.length +
      nameConflicts.length ===
    0
  ) {
    return null;
  }

  return (
    <section>
      <h3 className="mb-1.5 text-xs font-medium text-slate-500">{party}</h3>
      <ul
        className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 text-sm"
        aria-label={party}
      >
        {added.map((contact, index) => {
          return (
            <PreviewRow
              key={`added-${index}`}
              name={contact.name}
              address={contact.address}
            >
              <StatusBadge tone="success">New</StatusBadge>
            </PreviewRow>
          );
        })}
        {invalidEntries.map((invalidEntry, index) => {
          return (
            <ProblemRow
              key={`invalid-${index}`}
              invalidEntry={invalidEntry}
              badge={
                invalidEntry.issues.length === 1
                  ? "1 problem"
                  : `${invalidEntry.issues.length} problems`
              }
            />
          );
        })}
        {nameConflicts.map((invalidEntry, index) => {
          return (
            <ProblemRow
              key={`conflict-${index}`}
              invalidEntry={invalidEntry}
              badge="Name taken"
            />
          );
        })}
        {duplicates.map((contact, index) => {
          return (
            <PreviewRow
              key={`duplicate-${index}`}
              name={contact.name}
              address={contact.address}
              isMuted
            >
              <StatusBadge tone="neutral">Already saved</StatusBadge>
            </PreviewRow>
          );
        })}
      </ul>
    </section>
  );
}

interface PreviewRowProps {
  name: string;
  /** Can span several lines, as typed in the address field. */
  address: string;
  /** For entries that will be skipped. */
  isMuted?: boolean;
  /** The status badge. */
  children: React.ReactNode;
}

function PreviewRow({
  name,
  address,
  isMuted = false,
  children,
}: PreviewRowProps) {
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-2 px-3 py-2",
        isMuted && "text-slate-500",
      )}
    >
      <div className="min-w-0">
        <p className="truncate">{name}</p>
        <ContactAddress address={address} />
      </div>
      {children}
    </li>
  );
}

interface ContactAddressProps {
  /** Can span several lines, as typed in the address field. */
  address: string;
}

/** Kept to two lines, so one long address does not push the rest of the list down. */
function ContactAddress({ address }: ContactAddressProps) {
  return (
    <p className="line-clamp-2 whitespace-pre-line break-words text-xs text-slate-500">
      {address}
    </p>
  );
}

interface ProblemRowProps {
  invalidEntry: InvalidContactEntry;
  badge: string;
}

function ProblemRow({ invalidEntry, badge }: ProblemRowProps) {
  const { label, entry, issues } = invalidEntry;

  const entryIssues = issues.filter((issue) => {
    return !issue.field;
  });
  const address =
    isPlainObject(entry) && typeof entry.address === "string"
      ? entry.address
      : null;

  return (
    <li>
      <details open className="group" data-testid="import-problem-entry">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-2 px-3 py-2 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <p className="truncate">{label}</p>
            {address ? <ContactAddress address={address} /> : null}
          </div>
          <span className="flex shrink-0 items-center gap-1.5">
            <StatusBadge tone="danger">{badge}</StatusBadge>
            <ChevronDown
              className="size-3.5 text-slate-500 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </span>
        </summary>

        <div className="border-t border-slate-200 bg-slate-50/60">
          {entryIssues.length > 0 ? (
            <ul className="space-y-0.5 px-3 pt-2 text-xs text-red-700">
              {entryIssues.map((issue) => {
                return <li key={issue.message}>{issue.message}</li>;
              })}
            </ul>
          ) : null}

          <EntrySource entry={entry} issues={issues} />
        </div>
      </details>
    </li>
  );
}

interface StatusBadgeProps {
  tone: "success" | "neutral" | "danger";
  children: React.ReactNode;
}

function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "success" && "bg-green-200/80 text-green-900",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "danger" && "bg-red-200/80 text-red-900",
      )}
      data-testid="import-export-status-badge"
    >
      {children}
    </span>
  );
}

interface FilePickerLabelProps extends Omit<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  "htmlFor"
> {
  onFileSelected: (file: File) => void;
}

/**
 * A <label> around a visually hidden file input, rather than a button calling
 * `input.click()`: the tap itself opens the picker, with no programmatic click for the
 * browser to refuse. Chrome on iOS ignores `input.click()` after the page has started a
 * download (e.g. right after an export), while Safari does not. The input stays
 * focusable, so keyboard users reach it with Tab and open it with Space.
 */
function FilePickerLabel({
  onFileSelected,
  children,
  ...labelProps
}: FilePickerLabelProps) {
  return (
    <label {...labelProps}>
      {children}
      <input
        type="file"
        accept="application/json,.json"
        className="sr-only"
        data-testid="contacts-backup-file-input"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];

          // Clear the input so picking the same file again still fires `change`.
          input.value = "";

          if (file) {
            onFileSelected(file);
          }
        }}
      />
    </label>
  );
}

function ExpectedFileShape() {
  return (
    <>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] leading-5 text-slate-700">
        {EXPECTED_FILE_EXAMPLE}
      </pre>
      <p className="mt-2 text-pretty text-xs text-slate-500">
        Every seller and buyer needs a <code>name</code> and an{" "}
        <code>address</code>. Either list can be empty, and every other field is
        optional.
      </p>
    </>
  );
}

interface EntrySourceProps {
  entry: unknown;
  issues: ContactEntryIssue[];
}

/**
 * The entry as JSON, one field per line. A field that failed is highlighted with its
 * error under it; a required field the entry lacks is added as a "missing" line.
 */
function EntrySource({ entry, issues }: EntrySourceProps) {
  const codeClassName =
    "overflow-x-auto whitespace-pre-wrap break-all px-3 py-2 font-mono text-[11px] leading-5 text-slate-700";

  if (!isPlainObject(entry)) {
    return <pre className={codeClassName}>{formatValue(entry)}</pre>;
  }

  const messagesByField = new Map<string, string[]>();

  for (const { field, message } of issues) {
    if (!field) {
      continue;
    }

    // `address.0` and the like still belong to the top-level field
    const [key = field] = field.split(".");

    messagesByField.set(key, [...(messagesByField.get(key) ?? []), message]);
  }

  const missingFields = [...messagesByField.keys()].filter((key) => {
    return !Object.hasOwn(entry, key);
  });

  return (
    <pre className={codeClassName}>
      <span className="block">{"{"}</span>
      {Object.entries(entry).map(([key, value]) => {
        return (
          <EntryLine
            key={key}
            field={key}
            value={formatValue(value)}
            messages={messagesByField.get(key)}
          />
        );
      })}
      {missingFields.map((key) => {
        return (
          <EntryLine
            key={key}
            field={key}
            value={null}
            messages={messagesByField.get(key)}
          />
        );
      })}
      <span className="block">{"}"}</span>
    </pre>
  );
}

interface EntryLineProps {
  /** The field's key. */
  field: string;
  /** The formatted value, or `null` when the field is missing from the entry. */
  value: string | null;
  /** What is wrong with the field; absent when nothing is. */
  messages?: string[];
}

function EntryLine({ field, value, messages }: EntryLineProps) {
  const hasProblem = Boolean(messages?.length);

  return (
    <span
      className={cn(
        "-mx-3 block px-3",
        hasProblem && "border-l-2 border-red-500 bg-red-50 text-red-900",
      )}
      data-invalid-field={hasProblem ? field : undefined}
    >
      {"  "}
      <span className="text-slate-500">{JSON.stringify(field)}:</span>{" "}
      {value === null ? <span className="italic">missing</span> : value}
      {messages?.map((message) => {
        return (
          <span
            key={message}
            className="block break-normal pl-4 font-sans text-xs font-medium text-red-700"
          >
            ↳ {message}
          </span>
        );
      })}
    </span>
  );
}

function formatValue(value: unknown): string {
  const text = JSON.stringify(value) ?? String(value);

  return text.length > MAX_VALUE_LENGTH
    ? `${text.slice(0, MAX_VALUE_LENGTH)}…`
    : text;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether the drag carries files, as opposed to selected text or a link. Checked three
 * ways, as react-dropzone does: some Chromium file drags list only `text/plain` in
 * `types` but still have an item of kind `file` (react-dropzone#1409), and old Firefox
 * reports `application/x-moz-file`. Missing one would leave that drop uncancelled, and
 * the browser would open the file in the tab.
 */
function isFileDrag(event: DragEvent): boolean {
  const dataTransfer = event.dataTransfer;

  if (!dataTransfer) {
    return false;
  }

  // `Array.from`: `types` was a `DOMStringList`, which has no `includes`, in older browsers
  const types = Array.from(dataTransfer.types);

  return (
    types.includes("Files") ||
    types.includes("application/x-moz-file") ||
    Array.from(dataTransfer.items ?? []).some((item) => {
      return item.kind === "file";
    })
  );
}

const IMPORT_RULES = [
  "Only adds. Sellers and buyers you’ve saved are never changed.",
  "Anything already saved is skipped, so nothing is added twice.",
  "The invoice you’re working on isn’t touched.",
] as const;

const EXPECTED_FILE_EXAMPLE = `{
  "app": "easyinvoicepdf",
  "version": 1,
  "sellers": [
    {
      "name": "Acme Ltd",
      "address": "1 Main Street"
    }
  ],
  "buyers": [
    {
      "name": "Globex GmbH",
      "address": "2 Side Road"
    }
  ]
}`;
