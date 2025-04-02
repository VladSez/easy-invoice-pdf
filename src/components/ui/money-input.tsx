import * as React from "react";
import { Input } from "./input";
import { SUPPORTED_CURRENCIES, type InvoiceData } from "@/app/schema";
import { cn } from "@/lib/utils";

export const CURRENCY_SYMBOLS = {
  [SUPPORTED_CURRENCIES[0]]: "€", // Euro
  [SUPPORTED_CURRENCIES[1]]: "$", // US Dollar
  [SUPPORTED_CURRENCIES[2]]: "£", // British Pound
  [SUPPORTED_CURRENCIES[3]]: "zł", // Polish Złoty
  [SUPPORTED_CURRENCIES[4]]: "₽", // Russian Ruble
  [SUPPORTED_CURRENCIES[5]]: "₴", // Ukrainian Hryvnia
  [SUPPORTED_CURRENCIES[6]]: "Br", // Belarusian Ruble
  [SUPPORTED_CURRENCIES[7]]: "R$", // Brazilian Real
  [SUPPORTED_CURRENCIES[8]]: "$", // Mexican Peso
  [SUPPORTED_CURRENCIES[9]]: "$", // Argentine Peso
} as const satisfies Record<InvoiceData["currency"], string>;

const MoneyInput = React.memo(
  React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input"> & {
      currency: InvoiceData["currency"];
      dataTestId?: string;
    }
  >(({ currency, dataTestId, ...props }, ref) => {
    const shownCurrencyText = currency || SUPPORTED_CURRENCIES[0];
    const currencySymbol = CURRENCY_SYMBOLS[shownCurrencyText] || null;

    return (
      <div>
        <div
          className="relative flex rounded-lg shadow-sm shadow-black/5"
          data-testid={dataTestId}
        >
          {currencySymbol ? (
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm">
              {currencySymbol}
            </span>
          ) : null}
          <Input
            {...props}
            ref={ref}
            className={cn(
              "-me-px rounded-e-none ps-6 shadow-none",
              currencySymbol === "Br" || currencySymbol === "R$"
                ? "ps-8"
                : currencySymbol
                  ? "ps-6"
                  : "ps-3",
              props.className
            )}
            placeholder="0.00"
          />
          <span className="inline-flex items-center rounded-e-lg border border-gray-300 bg-background px-3 text-sm text-slate-950 shadow-sm shadow-black/5 transition-shadow">
            {shownCurrencyText}
          </span>
        </div>
      </div>
    );
  })
);
MoneyInput.displayName = "MoneyInput";

const ReadOnlyMoneyInput = React.memo(
  React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<"input"> & {
      currency: InvoiceData["currency"];
      dataTestId?: string;
    }
  >(({ currency, dataTestId, ...props }, ref) => {
    const shownCurrencyText = currency || SUPPORTED_CURRENCIES[0];
    const currencySymbol = CURRENCY_SYMBOLS[shownCurrencyText] || null;

    return (
      <div>
        <div
          className="relative flex rounded-lg shadow-sm shadow-black/5"
          data-testid={dataTestId}
        >
          {currencySymbol ? (
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm">
              {currencySymbol}
            </span>
          ) : null}
          <Input
            {...props}
            ref={ref}
            className={cn(
              "-me-px block w-full cursor-not-allowed rounded-md rounded-e-none border border-gray-300 bg-gray-100 px-3 py-2 ps-6",
              currencySymbol === "Br" || currencySymbol === "R$"
                ? "ps-8"
                : currencySymbol
                  ? "ps-6"
                  : "ps-3",
              "focus-visible:border-indigo-500 focus-visible:ring focus-visible:ring-indigo-200 focus-visible:ring-opacity-50",
              props.className
            )}
            placeholder="0.00"
            type="text"
            readOnly
            title="This field is read-only"
          />
          <span className="inline-flex cursor-default items-center rounded-e-lg border border-gray-300 bg-gray-100 px-3 text-sm text-slate-950 shadow-sm shadow-black/5 transition-shadow">
            {shownCurrencyText}
          </span>
        </div>
      </div>
    );
  })
);
ReadOnlyMoneyInput.displayName = "ReadOnlyMoneyInput";

export { MoneyInput, ReadOnlyMoneyInput };
