import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const ButtonHelper = ({
  children,
  className,
  ...props
}: { children: React.ReactNode; className?: string } & React.ComponentProps<
  typeof Button
>) => {
  return (
    <Button
      _variant="link"
      _size="sm"
      className={cn(
        "h-5 max-w-full p-0 text-left text-pretty whitespace-normal underline",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
