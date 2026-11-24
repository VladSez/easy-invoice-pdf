import { useId, useRef, useState } from "react";
import {
  type Control,
  Controller,
  type FieldArrayWithId,
  type FieldErrors,
  type UseFormClearErrors,
  type UseFormGetValues,
  type UseFormSetValue,
  useFieldArray,
  useWatch,
} from "react-hook-form";

import {
  ErrorMessage,
  hiddenInPdfClassName,
  inputErrorClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import {
  AddPillButton,
  takeOpenOrder,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/add-pill-button";
import { type InvoiceData, MAX_EXTRA_CUSTOM_COLUMNS } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";

/**
 * An item's custom columns: a pill or card for each column the invoice has, then the pill
 * that adds another. `customColumns` comes from `useCustomColumns`, called once for the
 * whole items list.
 */
export function ItemCustomColumns({
  control,
  index,
  errors,
  getValues,
  setValue,
  customColumns,
}: ItemCustomColumnsProps) {
  const { extraColumnFields, columnToOpen, addColumn, removeColumn } =
    customColumns;

  return (
    <>
      <ItemCustomColumnField
        control={control}
        index={index}
        position={0}
        errors={errors}
        getValues={getValues}
        setValue={setValue}
      />
      {extraColumnFields.map((field, extraIndex) => {
        const position = extraIndex + 1;

        const isJustAddedHere =
          columnToOpen?.index === index && columnToOpen.position === position;

        return (
          <ItemCustomColumnField
            key={field.id}
            control={control}
            index={index}
            position={position}
            errors={errors}
            getValues={getValues}
            setValue={setValue}
            opensOnMount={isJustAddedHere}
            onColumnEmptied={() => {
              removeColumn(position);
            }}
          />
        );
      })}
      <AddAnotherCustomColumnPill
        control={control}
        index={index}
        onAdd={() => {
          addColumn(index);
        }}
      />
    </>
  );
}

/**
 * The custom columns after the first, as a field array, with adding and removing them.
 * Called once by the items list, which hands the result to every item's
 * `ItemCustomColumns`: a field array has one owner.
 */
export function useCustomColumns({
  control,
  getValues,
  setValue,
  clearErrors,
}: UseCustomColumnsArgs) {
  const {
    fields: extraColumnFields,
    append,
    remove,
  } = useFieldArray({ control, name: "extraCustomColumns" });

  // the column just added and the item it was added on, whose card mounts open
  const [columnToOpen, setColumnToOpen] = useState<CustomColumnLocation | null>(
    null,
  );

  return {
    extraColumnFields,
    columnToOpen,

    /** Adds a column after the last and opens its card on item `index`. */
    addColumn(index: number) {
      const position = extraColumnFields.length + 1;

      setColumnToOpen({ index, position });
      append({ label: "", isVisible: true }, { shouldFocus: false });
      trackEvent({
        event: "add_item_custom_column",
        data: { column_name: undefined, column_position: position + 1 },
      });

      // the card mounts in this click's render, so focus its name on the next frame
      requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>(
            `#itemCustomColumnName${index}-${position}`,
          )
          ?.focus();
      });
    },

    /** Removes a column after the first, with every item's value in it. */
    removeColumn(position: number) {
      const extraIndex = position - 1;

      getValues("items").forEach((item, itemIndex) => {
        // Array.from turns holes a sparse array may have into entries, so no value
        // shifts into the wrong column
        const values = Array.from(
          item.extraCustomColumnValues ?? [],
          (value) => {
            return value ?? "";
          },
        );

        if (values.length <= extraIndex) {
          return;
        }

        // Validating the shifted values only writes the errors they have now, and an
        // error at the old last index would outlive its value and land on the next
        // column added there: drop this item's column errors first.
        clearErrors(`items.${itemIndex}.extraCustomColumnValues`);

        setValue(
          `items.${itemIndex}.extraCustomColumnValues`,
          values.filter((_value, valueIndex) => {
            return valueIndex !== extraIndex;
          }),
          // the later columns' values move left, so their errors have to move with
          // them: re-validate, or an over-limit value would lose its red border and
          // a stale error stay behind at the old index
          { shouldDirty: true, shouldValidate: true },
        );
      });

      setColumnToOpen(null);
      remove(extraIndex);
    },
  };
}

/**
 * The item's value in one of the invoice's custom columns, columns the user names
 * themselves (a project code, a SKU, a PO line), collapsed behind a pill like the discount.
 *
 * A column is one for the whole table: its name is shared, and each item has its own
 * value. The first column keeps the fields it had when it was the Polish Type of GTU
 * (`customColumnLabel`, each item's `typeOfGTU`); the ones after it live in
 * `extraCustomColumns` and each item's `extraCustomColumnValues`, see `customColumnPaths`.
 *
 * The first card to open asks for the name, and item 1's card always shows it so it can be
 * renamed; once named, the other items' pills read "+ <name>". Adding a value turns the
 * column on in the PDF. Removing the last value takes the first column out and forgets its
 * name, and removes a later column altogether.
 */
function ItemCustomColumnField({
  control,
  index,
  position,
  errors,
  getValues,
  setValue,
  opensOnMount = false,
  onColumnEmptied,
}: ItemCustomColumnFieldProps) {
  const paths = customColumnPaths({ index, position });

  const [isOpen, setIsOpen] = useState(() => {
    return opensOnMount || Boolean(getValues(paths.value));
  });
  // where the card sits among the item's open cards, see `takeOpenOrder`
  const [openOrder, setOpenOrder] = useState(() => {
    return opensOnMount ? takeOpenOrder() : 0;
  });
  // whether this card asks for the column's name: item 1's always does, and so does the
  // card that adds a column that has no name yet. Fixed when the card opens, so the field
  // doesn't vanish the moment a name is typed into it.
  const [asksForName, setAsksForName] = useState(index === 0 || opensOnMount);
  const pillRef = useRef<HTMLButtonElement>(null);

  const columnName = (useWatch({ control, name: paths.label }) ?? "").trim();

  const idSuffix = position === 0 ? `${index}` : `${index}-${position}`;
  const nameInputId = `itemCustomColumnName${idSuffix}`;
  const valueInputId =
    position === 0
      ? `itemTypeOfGTU${index}`
      : `itemCustomColumnValue${idSuffix}`;

  if (!isOpen) {
    return (
      <AddPillButton
        ref={pillRef}
        testId={`addItemCustomColumn${idSuffix}`}
        onClick={() => {
          const existingName = (getValues(paths.label) ?? "").trim();
          const isUnnamed = !existingName;
          const willAskForName = index === 0 || isUnnamed;

          setIsOpen(true);
          setAsksForName(willAskForName);
          setOpenOrder(takeOpenOrder());
          setValue(paths.isVisible, true, { shouldDirty: true });
          // the name the column already has; the first card to open asks for it, so
          // adding a column that is still unnamed reports none
          trackEvent({
            event: "add_item_custom_column",
            data: {
              column_name: existingName || undefined,
              column_position: position + 1,
            },
          });

          // the card mounts in this click's render, so focus its first field on the next
          // frame: the name while the column has none, otherwise the value
          requestAnimationFrame(() => {
            document
              .querySelector<HTMLElement>(
                `#${willAskForName && isUnnamed ? nameInputId : valueInputId}`,
              )
              ?.focus();
          });
        }}
      >
        {columnName || unnamedColumnPillText(position)}
      </AddPillButton>
    );
  }

  return (
    <OpenItemCustomColumnField
      control={control}
      index={index}
      position={position}
      errors={errors}
      setValue={setValue}
      columnName={columnName}
      asksForName={asksForName}
      nameInputId={nameInputId}
      valueInputId={valueInputId}
      openOrder={openOrder}
      onRemove={() => {
        setValue(paths.value, "", {
          shouldDirty: true,
          shouldValidate: Boolean(getValueError({ errors, index, position })),
        });

        const isAnyValueLeft = getValues("items").some((item, itemIndex) => {
          if (itemIndex === index) {
            return false;
          }

          const value =
            position === 0
              ? item.typeOfGTU
              : item.extraCustomColumnValues?.[position - 1];

          return Boolean(value?.trim());
        });

        trackEvent({
          event: "remove_item_custom_column",
          data: { column_position: position + 1 },
        });

        // The last value gone, the column goes too. The first one leaves the PDF and
        // forgets its name, so the other items' pills go back to "+ Custom column"; a
        // later one is removed altogether, which unmounts this card on every item.
        if (!isAnyValueLeft) {
          if (position === 0) {
            setValue(paths.isVisible, false, { shouldDirty: true });
            // re-checked, so a name over the limit doesn't leave its error behind on
            // the empty name the card shows when it is opened again
            setValue(paths.label, "", {
              shouldDirty: true,
              shouldValidate: Boolean(
                position === 0
                  ? errors.customColumnLabel
                  : errors.extraCustomColumns?.[position - 1]?.label,
              ),
            });
          } else {
            onColumnEmptied?.();

            // this card and its pill are gone, so hand focus to the item's next pill
            requestAnimationFrame(() => {
              document
                .querySelector<HTMLElement>(
                  `[data-testid="addAnotherItemCustomColumn${index}"], [data-testid="addItemCustomColumn${index}"]`,
                )
                ?.focus();
            });

            return;
          }
        }

        setIsOpen(false);

        // the card unmounts with the focused button in it, so hand focus to the pill
        requestAnimationFrame(() => {
          pillRef.current?.focus();
        });
      }}
    />
  );
}

/**
 * The "+ Custom column" pill that adds another column, after the first. It shows while
 * there is room for one and every column so far has a name, so it never sits next to an
 * unnamed column's own "+ Custom column" pill.
 */
function AddAnotherCustomColumnPill({
  control,
  index,
  onAdd,
}: AddAnotherCustomColumnPillProps) {
  const [firstColumnName, extraColumns] = useWatch({
    control,
    name: ["customColumnLabel", "extraCustomColumns"],
  });

  const columns = extraColumns ?? [];

  const hasRoom = columns.length < MAX_EXTRA_CUSTOM_COLUMNS;

  const isEveryColumnNamed =
    Boolean(firstColumnName?.trim()) &&
    columns.every((column) => {
      return Boolean(column.label?.trim());
    });

  if (!hasRoom || !isEveryColumnNamed) {
    return null;
  }

  return (
    <AddPillButton
      testId={`addAnotherItemCustomColumn${index}`}
      onClick={onAdd}
    >
      Custom column
    </AddPillButton>
  );
}

/**
 * The open card. Its own component so only an item with the card open subscribes to the
 * column switch.
 */
function OpenItemCustomColumnField({
  control,
  index,
  position,
  errors,
  setValue,
  columnName,
  asksForName,
  nameInputId,
  valueInputId,
  openOrder,
  onRemove,
}: OpenItemCustomColumnFieldProps) {
  const switchId = useId();
  const headingId = useId();
  // the name when its field got focus, to report only a name that changed
  const nameAtFocusRef = useRef("");
  const paths = customColumnPaths({ index, position });
  const valueError = getValueError({ errors, index, position });
  const nameError =
    position === 0
      ? errors.customColumnLabel
      : errors.extraCustomColumns?.[position - 1]?.label;

  // The column switch is shared by every item. Watched and set rather than a second
  // `Controller` on the same field, as every open card shows it.
  const isColumnVisible = useWatch({ control, name: paths.isVisible });

  const isFirstColumn = position === 0;

  // a card that asks for the name is the column's own card; the others are its value
  const title = asksForName
    ? isFirstColumn
      ? "Custom column"
      : `Custom column ${position + 1}`
    : columnName || unnamedColumnTitle(position);

  // the first column keeps its original wording, which tests and the atlas look up
  const columnDescription = isFirstColumn
    ? "the custom column"
    : `custom column ${position + 1}`;

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-lg border border-gray-200 bg-white p-3",
        hiddenInPdfClassName(!isColumnVisible),
      )}
      style={{ order: openOrder }}
      data-testid={
        isFirstColumn
          ? `itemCustomColumn${index}`
          : `itemCustomColumn${index}-${position}`
      }
    >
      <div className="-my-1 -me-1.5 flex items-center justify-between gap-2">
        {/* wraps rather than cutting off: the switch and Remove leave it little room on phones */}
        <span id={headingId} className="min-w-0 break-words font-semibold">
          {title}
        </span>
        <div className="flex items-center gap-1">
          <div className="inline-flex shrink-0 items-center gap-1.5">
            <Switch
              id={switchId}
              checked={isColumnVisible}
              onCheckedChange={(checked) => {
                setValue(paths.isVisible, checked, { shouldDirty: true });
              }}
              size="sm"
              aria-label={`Show ${columnDescription} in the PDF for item ${index + 1}`}
            />
            <CustomTooltip
              trigger={
                <Label
                  htmlFor={switchId}
                  className="cursor-pointer whitespace-nowrap text-xs font-normal text-slate-600"
                >
                  In PDF
                </Label>
              }
              content="Show this column in the PDF, for every item"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[13px] font-normal text-slate-500 max-md:h-11"
            aria-label={`Remove ${columnDescription} value from item ${index + 1}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      {asksForName ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameInputId}>Column name</Label>
          <Controller
            name={paths.label}
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={nameInputId}
                  type="text"
                  placeholder="e.g. Project code, SKU, PO line"
                  onFocus={() => {
                    nameAtFocusRef.current = (field.value ?? "").trim();
                  }}
                  onBlur={() => {
                    field.onBlur();

                    const name = (field.value ?? "").trim();
                    const isNewName =
                      Boolean(name) && name !== nameAtFocusRef.current;

                    // the name the column got, once it is typed: `add_item_custom_column`
                    // fires on the pill, before the column has one. A name over the limit
                    // is rejected, so it isn't reported either.
                    if (isNewName && name.length <= MAX_COLUMN_NAME_LENGTH) {
                      trackEvent({
                        event: "name_item_custom_column",
                        data: {
                          column_name: name,
                          column_position: position + 1,
                        },
                      });
                    }
                  }}
                  className={cn(
                    "h-[34px] max-md:h-11 max-md:text-base",
                    inputErrorClassName(!!nameError),
                  )}
                />
              );
            }}
          />
          {nameError ? (
            <ErrorMessage>{nameError.message}</ErrorMessage>
          ) : columnName ? (
            <p className="text-xs text-slate-500">
              Heads the column in the PDF, for every item.
            </p>
          ) : isFirstColumn ? (
            <p className="text-xs text-slate-500">
              Heads the column in the PDF, for every item. Left empty, it prints
              &ldquo;Type of GTU&rdquo;.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Heads the column in the PDF, for every item.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        {asksForName ? <Label htmlFor={valueInputId}>Value</Label> : null}
        <Controller
          name={paths.value}
          control={control}
          render={({ field }) => {
            return (
              <Input
                {...field}
                value={field.value ?? ""}
                id={valueInputId}
                type="text"
                aria-label={asksForName ? undefined : title}
                placeholder="This item's value"
                className={cn(
                  "h-[34px] max-md:h-11 max-md:text-base",
                  inputErrorClassName(!!valueError),
                )}
              />
            );
          }}
        />
        {valueError ? <ErrorMessage>{valueError.message}</ErrorMessage> : null}
      </div>
    </div>
  );
}

/**
 * Where a custom column's fields live in the form. The first column keeps the fields it had
 * before there could be more than one; a later one is an entry of `extraCustomColumns`,
 * with each item's value in `extraCustomColumnValues`.
 */
function customColumnPaths({ index, position }: CustomColumnLocation) {
  if (position === 0) {
    return {
      label: "customColumnLabel",
      value: `items.${index}.typeOfGTU`,
      isVisible: "items.0.typeOfGTUFieldIsVisible",
    } as const;
  }

  const extraIndex = position - 1;

  return {
    label: `extraCustomColumns.${extraIndex}.label`,
    value: `items.${index}.extraCustomColumnValues.${extraIndex}`,
    isVisible: `extraCustomColumns.${extraIndex}.isVisible`,
  } as const;
}

/** Longest custom column name, as the schema allows it. */
const MAX_COLUMN_NAME_LENGTH = 30;

interface GetValueErrorArgs extends CustomColumnLocation {
  errors: FieldErrors<InvoiceData>;
}

/** The validation error on the item's value in the column, if any. */
function getValueError({ errors, index, position }: GetValueErrorArgs) {
  const itemErrors = errors.items?.[index];

  return position === 0
    ? itemErrors?.typeOfGTU
    : itemErrors?.extraCustomColumnValues?.[position - 1];
}

/** A column's pill text while it has no name. */
function unnamedColumnPillText(position: number) {
  return position === 0 ? "Custom column" : `Custom column ${position + 1}`;
}

/** A column's card title, on a card that doesn't ask for the name, while it has none. */
function unnamedColumnTitle(position: number) {
  return position === 0 ? "Type of GTU" : `Custom column ${position + 1}`;
}

interface CustomColumnLocation {
  /** Position of the item in the `items` field array. */
  index: number;
  /** Which custom column: 0 is the first, 1 the first of `extraCustomColumns`... */
  position: number;
}

interface ItemCustomColumnsProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  errors: FieldErrors<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  /** What `useCustomColumns` returned. */
  customColumns: CustomColumnsState;
}

interface UseCustomColumnsArgs {
  control: Control<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  clearErrors: UseFormClearErrors<InvoiceData>;
}

interface CustomColumnsState {
  /** The custom columns after the first, keyed for rendering. */
  extraColumnFields: FieldArrayWithId<InvoiceData, "extraCustomColumns">[];
  /** The column just added and the item it was added on, whose card mounts open. */
  columnToOpen: CustomColumnLocation | null;
  addColumn: (index: number) => void;
  removeColumn: (position: number) => void;
}

interface ItemCustomColumnFieldProps extends CustomColumnLocation {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  /** Mount with the card open and asking for the name: the column was just added here. */
  opensOnMount?: boolean;
  /**
   * The last value of a column after the first was removed: drop the column. Not called
   * for the first column, which stays and is only switched off.
   */
  onColumnEmptied?: () => void;
}

interface AddAnotherCustomColumnPillProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  /** Adds the column and opens its card on this item. */
  onAdd: () => void;
}

interface OpenItemCustomColumnFieldProps extends Omit<
  ItemCustomColumnFieldProps,
  "getValues" | "opensOnMount" | "onColumnEmptied"
> {
  /** The column's name, trimmed; "" while it has none. */
  columnName: string;
  /** This card asks for the column's name, on top of the item's value. */
  asksForName: boolean;
  /** The name input's id, focused when the card opens on an unnamed column. */
  nameInputId: string;
  /** The value input's id, focused when the card opens on a named column. */
  valueInputId: string;
  /** The card's CSS `order` among the item's open cards, from `takeOpenOrder`. */
  openOrder: number;
  /** Clears the value and collapses the card. */
  onRemove: () => void;
}
