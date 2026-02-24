import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { GitHubStarCTA } from "@/components/github-star-cta";

export async function GithubStarCtaMarketingPageHeader() {
  const githubStarsCount = await fetchGithubStars();

  return (
    <div className="overflow-hidden duration-500 animate-in fade-in slide-in-from-top-4">
      <GitHubStarCTA githubStarsCount={githubStarsCount} />
    </div>
  );
}
