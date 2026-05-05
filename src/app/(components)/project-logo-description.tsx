export function ProjectLogoDescription({ text = "" }: { text: string }) {
  return (
    <div className="flex flex-col -space-y-0.5">
      <p className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
        <a
          href="https://easyinvoicepdf.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          EasyInvoicePDF
        </a>
      </p>
      <h1 className="text-balance text-[12px] text-slate-700 sm:text-[13px]">
        {text}
      </h1>
    </div>
  );
}
