import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function GoToAppButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Button
      _size="lg"
      _variant="outline"
      className={cn(
        "group relative overflow-hidden border-slate-200 px-8 shadow-sm transition-all duration-300 hover:border-slate-200/80 hover:shadow-lg",
        className,
      )}
      asChild
    >
      <Link href="/?template=default" scroll={false}>
        <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
        {children}
      </Link>
    </Button>
  );
}

export function BlackGoToAppButton({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <GoToAppButton
      className={cn(
        "relative overflow-hidden bg-zinc-900 text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-800 hover:text-white active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </GoToAppButton>
  );
}
