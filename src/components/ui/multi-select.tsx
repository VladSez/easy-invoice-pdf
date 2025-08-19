// src/components/multi-select.tsx

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, XCircle, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LANGUAGE_TO_LABEL } from "@/app/schema";
import type { SupportedLanguages } from "@/app/schema";
import { CustomTooltip } from "./tooltip";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
  "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted: "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: {
    /** The text to display for the option. */
    label: string;
    /** The unique value associated with the option. */
    value: string;
    /** Optional icon component to display alongside the option. */
    icon?: React.ComponentType<{ className?: string }>;
  }[];

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;

  /**
   * A function to handle the download action.
   */
  handleDownload?: () => Promise<void>;

  /**
   * The selected languages to be displayed in the multi-select component.
   */
  selectedLanguages: SupportedLanguages[];

  /**
   * A function to set the selected languages in the multi-select component.
   */
  setSelectedLanguages: (languages: SupportedLanguages[]) => void;
}

/**
 * https://github.com/sersavan/shadcn-multi-select-component
 */
export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      variant,
      selectedLanguages = [],
      setSelectedLanguages,
      placeholder = "Select options",
      maxCount = 3,
      modalPopover = false,
      //   asChild = false,
      className,
      handleDownload,
      ...props
    },
    ref,
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedLanguages];
        newSelectedValues.pop();
        setSelectedLanguages(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: SupportedLanguages) => {
      const newSelectedValues = selectedLanguages.includes(option)
        ? selectedLanguages.filter((value) => value !== option)
        : [...selectedLanguages, option];
      setSelectedLanguages(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedLanguages([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = selectedLanguages.slice(0, maxCount);
      setSelectedLanguages(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          <div className="flex">
            <CustomTooltip
              content="Download PDF in selected languages"
              trigger={
                <Button
                  ref={ref}
                  {...props}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (selectedLanguages.length > 0 && handleDownload) {
                      await handleDownload();
                    } else if (selectedLanguages.length === 0) {
                      // If no languages are selected, open the popover
                      handleTogglePopover();
                    }
                  }}
                  className={cn(
                    "min-h- mb-4 h-auto rounded-l-lg rounded-r-none border-r-0 bg-slate-900 px-4 py-2 text-center text-sm font-medium text-slate-50 shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0",
                    selectedLanguages.length === 0 && "lg:w-[120px]",
                    selectedLanguages.length === 1 && "lg:w-[200px]",
                    selectedLanguages.length === 2 && "lg:w-[240px]",
                    selectedLanguages.length >= 3 && "lg:w-[280px]",
                    className,
                  )}
                >
                  <div className="flex w-full items-center">
                    <div className="flex flex-wrap items-center">
                      <span className="mr-1 text-sm">
                        {selectedLanguages.length > 0
                          ? "Download PDF in "
                          : placeholder}
                      </span>
                      {selectedLanguages
                        .slice(0, maxCount)
                        .map((value, index) => {
                          const isLast = index === selectedLanguages.length - 1;
                          const label = LANGUAGE_TO_LABEL[value];

                          return (
                            <React.Fragment key={value}>
                              {label}
                              {isLast ? "" : ", "}
                            </React.Fragment>
                          );
                        })}
                      {selectedLanguages.length > maxCount && (
                        <Badge
                          className={cn(
                            "border-foreground/1 bg-transparent text-foreground hover:bg-transparent",
                            multiSelectVariants({ variant }),
                          )}
                        >
                          {`+ ${selectedLanguages.length - maxCount} more`}
                          <XCircle
                            className="ml-2 h-4 w-4 cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearExtraOptions();
                            }}
                          />
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              }
            />
            <div className="relative flex items-center">
              <Separator orientation="vertical" className="h-[20px]" />
            </div>
            <CustomTooltip
              content="Select languages to download"
              trigger={
                <Button
                  onClick={handleTogglePopover}
                  className={cn(
                    "mb-4 h-auto rounded-l-none rounded-r-lg border-l-0 bg-slate-900 px-2 py-2 text-center text-sm font-medium text-slate-50 shadow-sm shadow-black/5 outline-offset-2 hover:bg-slate-900/90 focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 lg:mb-0",
                  )}
                >
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                </Button>
              }
            ></CustomTooltip>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            <CommandInput
              placeholder="Search..."
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedLanguages.includes(
                    option.value as SupportedLanguages,
                  );
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() =>
                        toggleOption(option.value as SupportedLanguages)
                      }
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-gray-500",
                          isSelected
                            ? "bg-gray-50 text-gray-900"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-gray-500" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="flex items-center justify-between gap-1">
                  {selectedLanguages.length > 0 && (
                    <>
                      <CommandItem
                        onSelect={handleClear}
                        className="max-w-full flex-1 cursor-pointer justify-center"
                      >
                        Clear
                      </CommandItem>
                      <Separator
                        orientation="vertical"
                        className="flex h-full min-h-6"
                      />
                      <CommandItem
                        onSelect={async () => {
                          setIsPopoverOpen(false);
                          if (handleDownload) await handleDownload();
                        }}
                        className="max-w-full flex-1 cursor-pointer justify-center bg-slate-900 text-slate-50 data-[selected='true']:bg-slate-900/90 data-[selected='true']:text-white dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90"
                      >
                        Download
                      </CommandItem>
                    </>
                  )}
                  {selectedLanguages.length === 0 && (
                    <CommandItem
                      onSelect={() => setIsPopoverOpen(false)}
                      className="max-w-full flex-1 cursor-pointer justify-center"
                    >
                      Close
                    </CommandItem>
                  )}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
