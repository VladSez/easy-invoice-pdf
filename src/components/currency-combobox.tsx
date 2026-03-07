"use client";

import {
  CURRENCY_COMBOBOX_GROUPS,
  CURRENCY_SYMBOLS,
  CURRENCY_TO_LABEL,
  type SupportedCurrencies,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

/**
 * Currency Combobox component
 * allows to select and search for currencies from a list of groups
 *  - https://ui.shadcn.com/docs/components/radix/combobox
 *  - https://v3.shadcn.com/docs/components/combobox
 *
 */
export function CurrencyCombobox({
  id = "",
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: Scrolls the currently selected currency into view when the combobox popover is opened (better UX).
   *
   * - When the popover is open and a currency is selected (`value`), this effect finds the
   *   selected currency item in the list and scrolls it into the center of the visible area.
   * - Uses `requestAnimationFrame` to ensure the DOM is ready for manipulation, providing a smooth UI experience.
   * - Relies on a `data-selected-currency="true"` attribute to identify the correct item.
   *
   * Dependencies: Runs on changes to `open` or `value`.
   */
  useEffect(() => {
    if (!open || !value) return;

    requestAnimationFrame(() => {
      const list = listRef.current;
      if (!list) return;

      const selected = list.querySelector<HTMLElement>(
        `[data-selected-currency="true"]`,
      );
      selected?.scrollIntoView({ block: "center" });
    });
  }, [open, value]);

  /**
   * Scrolls the list of currencies to the top (better UX).
   *
   * This function is used to reset the CommandList scroll position to the top,
   * such as after changing the search query in the currency combobox.
   * It schedules the scroll using requestAnimationFrame for smooth UI updates.
   */
  const scrollListToTop = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0 });
    });
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full !scale-100 justify-between rounded-md border border-gray-300 bg-white pl-3 pr-2 text-sm font-normal text-slate-950 shadow-sm shadow-black/5 !outline-none transition-all hover:bg-slate-100/80 focus-visible:!border-2 focus-visible:!border-indigo-600 focus-visible:!ring-2 focus-visible:!ring-indigo-200 focus-visible:!ring-opacity-50 focus-visible:!ring-offset-1"
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">
                {value} {CURRENCY_SYMBOLS[value as SupportedCurrencies]}{" "}
                {CURRENCY_TO_LABEL[value as SupportedCurrencies]}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select currency</span>
          )}
          <ChevronsUpDownIcon
            className="shrink-0 text-slate-500/80 peer-disabled:opacity-50 dark:text-slate-400/80"
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
        align="start"
      >
        <Command loop>
          <CommandInput
            placeholder="Search currency..."
            onValueChange={scrollListToTop}
          />
          <CommandList ref={listRef}>
            <CommandEmpty>No currencies found.</CommandEmpty>
            {CURRENCY_COMBOBOX_GROUPS.map((group) => (
              <Fragment key={group.value}>
                <CommandGroup heading={group.value}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.code}
                      value={item.searchLabel}
                      onSelect={() => {
                        onChange(item.code);
                        setOpen(false);
                      }}
                      data-selected-currency={value === item.code || undefined}
                      className={cn(
                        "mb-0.5 active:bg-slate-200/80",
                        value === item.code &&
                          "!bg-indigo-50 !text-indigo-900 hover:!bg-indigo-50/80 hover:!text-indigo-900/90 active:!bg-indigo-100",
                      )}
                    >
                      {item.code} {CURRENCY_SYMBOLS[item.code]}{" "}
                      {CURRENCY_TO_LABEL[item.code]}
                      {value === item.code ? (
                        <CheckIcon size={16} className="ml-auto" />
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
