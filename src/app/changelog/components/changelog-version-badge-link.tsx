import { getChangelogReleaseNotesUrl } from "@/app/changelog/utils";

interface ChangelogVersionBadgeLinkProps {
  version: string;
}

export function ChangelogVersionBadgeLink({
  version,
}: ChangelogVersionBadgeLinkProps) {
  if (!version) {
    return null;
  }

  const versionUrl = getChangelogReleaseNotesUrl(version);

  if (!versionUrl) {
    return null;
  }

  return (
    <a
      href={versionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700"
    >
      v{version}
    </a>
  );
}
