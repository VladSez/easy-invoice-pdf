import Link from "next/link";

/**
 * Displays author information for changelog entries.
 * Shows avatar, name, and role with links to social profiles.
 *
 * @returns Author byline component with avatar and text information
 */
export function ChangelogAuthorByline() {
  return (
    <div className="flex items-center space-x-3" data-testid="author-info-img">
      <Link
        href="https://x.com/vladsazonau"
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <img
          alt="Vlad Sazonau"
          loading="lazy"
          width="36"
          height="36"
          decoding="async"
          className="rounded-full blur-0 transition-all group-hover:brightness-95"
          src="https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459"
        />
      </Link>
      <div className="flex flex-col" data-testid="author-info-text">
        <Link
          href="https://x.com/vladsazonau"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-neutral-800 no-underline hover:underline hover:underline-offset-2 dark:text-neutral-300"
        >
          Vlad Sazonau
        </Link>
        <span className="text-sm text-slate-500 dark:text-neutral-400">
          Founder,{" "}
          <Link
            href="/?template=default"
            className="text-slate-500 no-underline hover:underline hover:underline-offset-2 dark:text-neutral-400"
          >
            {" "}
            EasyInvoicePDF
          </Link>
        </span>
      </div>
    </div>
  );
}
