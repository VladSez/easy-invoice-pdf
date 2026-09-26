import type {
  ContactEntryIssue,
  InvalidContactEntry,
} from "@/app/(main)/(app)/utils/contacts-backup";
import { Button } from "@/components/ui/button";
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

export interface InvalidImportedContact extends InvalidContactEntry {
  /** Which list in the file the entry came from. */
  party: "Seller" | "Buyer";
}

interface ImportIssuesDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  invalidEntries: InvalidImportedContact[];
}

/**
 * Lists the entries an import skipped, each shown as it is written in the file with the
 * fields that failed highlighted in place, so the user can find and fix them there.
 */
export function ImportIssuesDialog({
  isOpen,
  onOpenChange,
  invalidEntries,
}: ImportIssuesDialogProps) {
  const count = invalidEntries.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        // `dvh` is missing before Safari 15.4; without the `vh` fallback the dialog would
        // have no height limit there, pushing its title and Close button off screen
        className="flex max-h-[calc(100vh-2rem)] flex-col gap-4 supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] sm:max-w-[560px]"
        data-testid="import-issues-dialog"
      >
        <DialogHeader>
          <DialogTitle>
            {count === 1
              ? "1 entry was not imported"
              : `${count} entries were not imported`}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            Everything else in the file was imported. Fix the highlighted fields
            in the file (for a name that is already saved, change it in the file
            or rename the saved one) and import it again. Sellers and buyers you
            already have are skipped, so nothing is added twice.
          </DialogDescription>
        </DialogHeader>

        <ol className="-mx-6 min-h-0 flex-1 space-y-3 overflow-y-auto px-6">
          {invalidEntries.map((invalidEntry, index) => {
            return (
              <li key={index}>
                <InvalidEntryCard invalidEntry={invalidEntry} />
              </li>
            );
          })}
        </ol>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface InvalidEntryCardProps {
  invalidEntry: InvalidImportedContact;
}

function InvalidEntryCard({ invalidEntry }: InvalidEntryCardProps) {
  const { party, label, entry, issues } = invalidEntry;

  const entryIssues = issues.filter((issue) => {
    return !issue.field;
  });

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h3 className="truncate text-sm font-medium text-slate-900">
          {party} {label}
        </h3>
        <span className="shrink-0 text-xs tabular-nums text-red-700">
          {issues.length === 1 ? "1 problem" : `${issues.length} problems`}
        </span>
      </header>

      {entryIssues.length > 0 ? (
        <ul className="space-y-0.5 px-3 pt-2 text-xs text-red-700">
          {entryIssues.map((issue) => {
            return <li key={issue.message}>{issue.message}</li>;
          })}
        </ul>
      ) : null}

      <EntrySource entry={entry} issues={issues} />
    </article>
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
