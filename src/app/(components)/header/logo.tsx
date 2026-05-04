import { FinalProjectLogo } from "@/components/etc/final-project-logo";
import { ProjectLogoDescription } from "@/app/(components)/project-logo-description";

export function Logo({ text }: { text: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <FinalProjectLogo className="size-6 md:size-7" />

        {/* show app logo and description on desktop */}
        <div className="hidden sm:block">
          <ProjectLogoDescription text={text} />
        </div>

        {/* show only app name on mobile (to save space) */}
        <div className="block sm:hidden">
          <p className="text-balance text-center text-base font-bold text-zinc-800 min-[375px]:text-xl sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left">
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
