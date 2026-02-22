import { BUG_REPORT_URL, CONTACT_SUPPORT_EMAIL } from "@/config";
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
        href={`mailto:${CONTACT_SUPPORT_EMAIL}`}
        className="underline hover:text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        {CONTACT_SUPPORT_EMAIL}
      </a>{" "}
      or{" "}
      <a
        href={BUG_REPORT_URL}
        className="underline hover:text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        submit a bug report
      </a>
    </span>,
    {
      id: "error-generating-pdf-toast",
      duration: Infinity,
    },
  );
}
