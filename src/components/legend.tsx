import { cn } from "@/lib/utils";

export const Legend = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) => {
  return (
    <legend
      className={cn("text-lg font-semibold text-gray-900", className)}
      {...props}
    >
      {children}
    </legend>
  );
};
