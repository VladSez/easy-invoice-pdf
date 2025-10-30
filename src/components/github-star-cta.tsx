"use client";

import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import Link from "next/link";
import { CountUpNumber } from "./ui/count-up-number";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { GithubIcon } from "./etc/github-logo";

export function GitHubStarCTA({
  githubStarsCount,
}: {
  githubStarsCount: number;
}) {
  const handleStarClick = () => {
    umamiTrackEvent("github_star_cta_clicked");
  };

  return (
    <div className="fixed right-2 top-2 z-50 duration-500 animate-in fade-in slide-in-from-top-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              "group border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-slate-300",
              "text-slate-900 will-change-transform hover:bg-slate-50 hover:text-black",
            )}
            onClick={handleStarClick}
            data-testid="github-star-cta-button"
            aria-label="Star project on GitHub"
          >
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2"
            >
              {githubStarsCount > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="size-4 animate-star-hover fill-yellow-400 text-yellow-500" />
                  <CountUpNumber number={githubStarsCount} />
                </div>
              ) : (
                <GithubIcon className="size-4 transition-all duration-300 ease-in-out" />
              )}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="flex items-center gap-1.5">
            <Star className="size-4 fill-yellow-400 text-yellow-500" />
            Star us on GitHub!
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
