import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { GITHUB_URL } from "@/config";

export async function GithubStarCtaMarketingPageBody() {
  const githubStarsCount = await fetchGithubStars();

  return (
    <div className="">
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full border border-slate-800 bg-slate-900 px-6 font-medium text-white transition-all duration-300 hover:border-slate-700 hover:bg-slate-800 active:scale-95"
        aria-label="Star project on GitHub"
        data-testid="github-star-cta-about-page-button"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 fill-current text-white transition-all duration-500 group-hover:scale-110 group-hover:fill-yellow-400 group-hover:text-yellow-400"
            aria-hidden="true"
          >
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
          </svg>
          <span>Star on GitHub</span>
        </div>
        <div className="mx-2 h-4 w-[1px] bg-slate-300" />
        <div className="flex items-center gap-1 text-slate-50 transition-colors group-hover:text-white">
          <span className="font-medium tabular-nums">{githubStarsCount}</span>
        </div>
      </a>
    </div>
  );
}
