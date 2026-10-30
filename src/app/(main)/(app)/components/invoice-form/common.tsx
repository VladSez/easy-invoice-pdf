import { AlertTriangle } from "lucide-react";

export function inputErrorClassName(hasError?: boolean) {
  return hasError
    ? "border-red-500 focus-visible:outline-red-500 focus-visible:ring-red-500 placeholder:text-red-500"
    : "";
}

/**
 * Fades the inputs of a field whose "Show in PDF" switch is off, so what the PDF leaves out
 * reads as such. Goes on a wrapper that holds the field's one switch and its inputs, and
 * follows the switch's `data-state` in CSS, so nothing re-renders. Browsers without
 * `:has()` (Safari before 15.4) just show no fade.
 */
export const FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME =
  "[&:has([role=switch][data-state=unchecked])_:is(input,textarea,select)]:border-dashed [&:has([role=switch][data-state=unchecked])_:is(input,textarea,select)]:bg-slate-50 [&:has([role=switch][data-state=unchecked])_:is(input,textarea,select)]:text-slate-500";

/**
 * The same fade for a field whose switch sits outside its wrapper (the item columns are
 * switched on the first item only) or that depends on more than one switch.
 */
export function hiddenInPdfClassName(isHidden: boolean) {
  return isHidden
    ? "[&_:is(input,textarea,select)]:border-dashed [&_:is(input,textarea,select)]:bg-slate-50 [&_:is(input,textarea,select)]:text-slate-500"
    : "";
}

export const ErrorMessage = ({ children }: { children: React.ReactNode }) => {
  return <p className="mt-1 text-xs text-red-600">{children}</p>;
};

export const AlertIcon = () => {
  return (
    <AlertTriangle className="mr-1 inline-block size-3.5 shrink-0 text-amber-500" />
  );
};
