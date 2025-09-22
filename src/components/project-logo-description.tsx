export function ProjectLogoDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col -space-y-0.5">
      <h1 className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
        <a
          href="https://easyinvoicepdf.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          EasyInvoicePDF
        </a>
      </h1>
      <h2 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
        {children || "Free Invoice Generator with Live PDF Preview"}
      </h2>
    </div>
  );
}
