import { FinalProjectLogo } from "@/components/etc/final-project-logo";
import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";
import { cn } from "@/lib/utils";

export function Logo({
  description,
  className,
}: {
  description: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <FinalProjectLogo className="size-6 md:size-7" />

        {/* show app logo and description on desktop */}
        <div className="hidden sm:block">
          <ProjectLogoDescription
            title={
              <p className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
                EasyInvoicePDF
              </p>
            }
            description={description}
          />
        </div>

        {/* show only app name on mobile (to save space) */}
        <div className="block sm:hidden">
          <p
            className={cn(
              "text-balance text-center text-base font-bold text-zinc-800 min-[375px]:text-xl sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left",
              className,
            )}
          >
            <a
              href="https://easyinvoicepdf.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              EasyInvoicePDF
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
