import { toast } from "sonner";

export function ErrorGeneratingPdfToast() {
  return toast.error(
    <span>
      <strong>Error Generating PDF Document</strong>
      <br />
      Please try the following:
      <br />
      1. Reload the page
      <br />
      2. Try using a different browser (Chrome or Firefox recommended)
      <br />
      3. Contact support at{" "}
      <a
        href="mailto:vladsazon27@gmail.com"
        className="underline hover:text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        vladsazon27@gmail.com
      </a>{" "}
      or{" "}
      <a
        href="https://pdfinvoicegenerator.userjot.com/board/bugs"
        className="underline hover:text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        submit a bug report
      </a>
    </span>,
    {
      duration: Infinity,
    }
  );
}
