"use client";

import { GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { Star } from "lucide-react";
import { GithubIcon } from "./etc/github-logo";
import { CountUpNumber } from "./ui/count-up-number";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function GitHubStarCTA({
  githubStarsCount,
}: {
  githubStarsCount: number;
}) {
  const handleStarClick = () => {
    umamiTrackEvent("github_star_cta_clicked");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex h-9 items-center overflow-hidden rounded-lg bg-slate-900 text-sm font-medium text-white shadow-sm shadow-black/5 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-900/90 active:scale-[0.96]"
          onClick={handleStarClick}
          aria-label="Star project on GitHub"
          data-testid="github-star-cta-button"
        >
          <span className="flex items-center gap-1.5 px-4">
            <span className="relative size-4">
              <GithubIcon className="absolute inset-0 size-4 fill-white transition-[opacity,transform,filter] duration-200 ease-out group-hover:scale-75 group-hover:opacity-0 group-hover:blur-[4px]" />
              <Star className="absolute inset-0 size-4 scale-[0.25] fill-yellow-400 text-yellow-400 opacity-0 blur-[4px] transition-[opacity,transform,filter] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:blur-0" />
            </span>
            {githubStarsCount > 0 ? (
              <>
                <span className="h-3.5 w-px bg-white/25" aria-hidden="true" />
                <CountUpNumber number={githubStarsCount} />
              </>
            ) : (
              <span>Star on GitHub</span>
            )}
          </span>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="flex items-center gap-1.5">
          <Star className="size-4 fill-yellow-400 text-yellow-500" />
          Star on GitHub
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
