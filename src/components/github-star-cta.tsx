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
          className="relative flex items-center gap-2 overflow-visible rounded-full border border-slate-300/70 bg-white px-3 py-1.5 text-sm shadow-sm transition-colors hover:border-slate-400/50 hover:bg-slate-50 hover:text-black"
          onClick={handleStarClick}
          aria-label="Star project on GitHub"
          data-testid="github-star-cta-button"
        >
          <div className="border-glow-mask z-10" aria-hidden="true">
            <div className="border-glow-shine animate-rotate-shine" />
          </div>
          <GithubIcon className="size-4 transition-all duration-300 ease-in-out" />
          {githubStarsCount > 0 ? (
            <span className="inline-flex items-center">
              <CountUpNumber number={githubStarsCount} />
            </span>
          ) : (
            "View on GitHub"
          )}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p className="flex items-center gap-1.5">
          <Star className="size-4 fill-yellow-400 text-yellow-500" />
          Give us a star on GitHub
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
