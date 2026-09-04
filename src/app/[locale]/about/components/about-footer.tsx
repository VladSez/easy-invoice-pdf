import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { Footer, FooterLinkGroup } from "@/app/(components)/footer";
import {
  DISCORD_COMMUNITY_URL,
  GITHUB_URL,
  PRODUCT_TWITTER_URL,
  REDDIT_COMMUNITY_URL,
} from "@/config";

/**
 * Footer of the about page.
 *
 * Shared by the page and its loading state: the footer is fully static, so the
 * loading state renders the real thing instead of a placeholder, and keeping it
 * in one place is what guarantees both render the exact same links and height.
 */
export function AboutFooter() {
  const locale = useLocale();
  const t = useTranslations("About");

  return (
    <Footer
      translations={{
        tagline: t("tagline"),
        aboutHeading: t("footer.headings.about"),
        solutionsHeading: t("footer.headings.solutions"),
        footerDescription: t.rich("footer.description", {
          br: () => {
            return <br />;
          },
          tosLink: (chunks) => {
            return (
              <Link
                href="/tos"
                className="text-slate-700 underline hover:text-slate-900"
              >
                {chunks}
              </Link>
            );
          },
        }),
        footerCreatedBy: t("footer.createdBy"),
        resources: t("footer.links.resources"),
      }}
      links={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FooterLinkGroup
            heading={t("footer.headings.product")}
            links={[
              {
                href: "/?template=default",
                label: t("footer.links.invoiceGenerator"),
              },
              {
                href: GITHUB_URL,
                label: t("footer.links.github"),
                external: true,
              },
              { href: "#features", label: t("footer.links.features") },
              { href: "#faq", label: "FAQ" },
              {
                href: "/how-it-works",
                label: t("footer.links.howItWorks"),
              },
              { href: "/changelog", label: t("footer.links.changelog") },
              { href: "/llms.txt", label: "llms.txt" },
            ]}
          />
          <FooterLinkGroup
            heading={t("footer.headings.company")}
            links={[
              {
                href: `/${locale}/about`,
                label: t("buttons.home"),
              },
              { href: "/founder", label: t("footer.links.founder") },
              { href: "/tos", label: t("footer.links.termsOfService") },
            ]}
          />
          <FooterLinkGroup
            heading={t("footer.headings.community")}
            links={[
              {
                href: DISCORD_COMMUNITY_URL,
                label: t("buttons.shareFeedback"),
                external: true,
              },
              {
                href: DISCORD_COMMUNITY_URL,
                label: "Discord",
                external: true,
              },
              {
                href: REDDIT_COMMUNITY_URL,
                label: "Reddit",
                external: true,
              },
              {
                href: PRODUCT_TWITTER_URL,
                label: "X (Twitter)",
                external: true,
              },
            ]}
          />
        </div>
      }
    />
  );
}
