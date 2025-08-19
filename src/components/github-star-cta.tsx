"use client";

import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import Link from "next/link";

export function GitHubStarCTA() {
  const handleStarClick = () => {
    umamiTrackEvent("github_star_cta_clicked");
  };

  return (
    <div className="fixed right-2 top-2 z-50 duration-500 animate-in fade-in slide-in-from-top-4">
      <Button
        asChild
        _variant="outline"
        _size="sm"
        className={cn(
          "group border-slate-200 bg-white shadow-sm transition-all duration-300 hover:scale-105 hover:border-slate-300 hover:shadow-md",
          "text-slate-900 hover:text-slate-900",
        )}
        onClick={handleStarClick}
        data-testid="github-star-cta-button"
      >
        <Link
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2"
        >
          <Star className="h-4 w-4 text-slate-600 transition-all duration-300 ease-in-out group-hover:fill-yellow-400 group-hover:text-yellow-500" />
          <span className="text-sm font-medium">Star</span>
        </Link>
      </Button>
    </div>
  );
}
