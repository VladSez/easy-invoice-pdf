export function ProjectLogoDescription({
  title,
  description,
}: {
  title?: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="flex flex-col -space-y-0.5">
      <a
        href="https://easyinvoicepdf.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        {title || (
          <h1 className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
            EasyInvoicePDF
          </h1>
        )}
      </a>
      {description || (
        <h2 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
          Free & Open-Source Invoice Generator
        </h2>
      )}
    </div>
  );
}
