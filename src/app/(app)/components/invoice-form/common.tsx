import { AlertTriangle } from "lucide-react";

export function inputErrorClassName(hasError?: boolean) {
  return hasError
    ? "border-red-500 focus-visible:outline-red-500 focus-visible:ring-red-500 placeholder:text-red-500"
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
