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
          className="group relative inline-flex h-9 items-center overflow-hidden rounded-full bg-black bg-gradient-to-r from-stone-800 via-stone-900 to-stone-950 text-sm font-medium text-white shadow-sm shadow-black/10 transition-[transform,opacity] duration-200 ease-out hover:opacity-95 active:scale-[0.96]"
          onClick={handleStarClick}
          aria-label="Star project on GitHub"
          data-testid="github-star-cta-button"
        >
          <span className="flex items-center gap-1.5 px-4">
            {/* Icon container with relative positioning for layered animation */}
            <span className="relative size-4">
              {/* GitHub icon - visible by default, fades out and shrinks on hover */}
              <GithubIcon className="absolute inset-0 size-4 fill-white transition-[opacity,transform,filter] duration-200 ease-out group-hover:scale-75 group-hover:opacity-0 group-hover:blur-[4px]" />
              {/* Star icon - hidden by default, scales up and fades in on hover to replace GitHub icon */}
              <Star className="absolute inset-0 size-4 scale-[0.25] fill-yellow-400 text-yellow-400 opacity-0 blur-[4px] transition-[opacity,transform,filter] duration-200 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:blur-0" />
            </span>
            {githubStarsCount > 0 ? (
              <>
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
