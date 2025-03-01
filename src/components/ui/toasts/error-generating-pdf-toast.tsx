import { toast } from "sonner";

export function ErrorGeneratingPdfToast() {
  return toast.error(
    <span>
      Error generating document link. Please try to reload the page or contact
      support{" "}
      <a
        href="mailto:vladsazon27@gmail.com"
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        here
      </a>{" "}
      or fill a bug report{" "}
      <a
        href="https://pdfinvoicegenerator.userjot.com/board/bugs"
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        here
      </a>
    </span>,
    {
      duration: 10000,
    }
  );
}
