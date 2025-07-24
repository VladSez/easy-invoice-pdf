import { memo } from "react";

export const InputHelperMessage = memo(function InputHelperMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      className="mt-1 text-xs text-balance text-zinc-700/90"
      role="region"
      aria-live="polite"
    >
      {children}
    </p>
  );
});
