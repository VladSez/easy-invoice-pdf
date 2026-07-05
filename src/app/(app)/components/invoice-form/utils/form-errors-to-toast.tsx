import type { InvoiceData } from "@/app/schema";
import type { FieldErrors } from "react-hook-form";
import { toast } from "sonner";

/**
 * Show toast listing form validation errors.
 *
 * @param errors - FieldErrors object from react-hook-form for InvoiceData
 * @param isMobile - If true, UI adapted for mobile (unused here, but passed in)
 */
export function formErrorsToToast({
  errors,
  isMobile,
}: {
  errors: FieldErrors<InvoiceData>;
  isMobile: boolean;
}) {
  if (!errors || Object.keys(errors).length === 0) {
    return;
  }

  toast.error(
    <div>
      <p className="font-semibold">Please fix the following errors:</p>
      <ul className="mt-1 list-inside list-disc">
        {Object.entries(errors)
          .map(([key, error]) => {
            if (error && typeof error === "object" && "message" in error) {
              return (
                <li key={key} className="text-sm">
                  {error?.message || "Unknown error"}
                </li>
              );
            }

            if (Array.isArray(error)) {
              return error.map((item, index) =>
                Object.entries(
                  item as { [key: string]: { message?: string } },
                ).map(([fieldName, fieldError]) => (
                  <li key={`${key}.${index}.${fieldName}`} className="text-sm">
                    {fieldError?.message || "Unknown error"}
                  </li>
                )),
              );
            }

            if (error && typeof error === "object") {
              return Object.entries(
                error as { [key: string]: { message?: string } },
              ).map(([nestedKey, nestedError]) => {
                return (
                  <li key={`${key}.${nestedKey}`} className="text-sm">
                    {nestedError?.message || "Unknown error"}
                  </li>
                );
              });
            }

            return null;
          })
          .flat(Infinity)}
      </ul>
    </div>,
    {
      id: "form-errors-error-toast",
      duration: 15_000,
      position: isMobile ? "top-center" : "bottom-right",
    },
  );
}
