/* eslint-disable @next/next/no-html-link-for-pages */
import { SEO_FOOTER_SOLUTION_LINKS } from "@/app/(seo-landings)/seo-landing-footer-links";
import { ProjectLogo } from "@/components/etc/project-logo";
import { GITHUB_URL, TWITTER_URL } from "@/config";
import Link from "next/link";

interface FooterProps {
  links?: React.ReactNode;
  translations?: {
    footerDescription: React.ReactNode;
    footerCreatedBy: string;
    resources: string;
  };
}

export function Footer({ links, translations }: FooterProps) {
  const footerLinks = links ?? <DefaultFooterLinks />;
  const footerDescription =
    translations?.footerDescription ?? DEFAULT_FOOTER_DESCRIPTION;

  const footerCreatedBy = translations?.footerCreatedBy ?? "Made by";
  const resources = translations?.resources ?? "Resources";

  return (
    <footer className="w-full border-t border-slate-200 bg-white py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <div className="space-y-4 md:w-1/3">
            <div className="flex items-center">
              <ProjectLogo className="size-8" />
              <p className="text-balance text-center text-xl font-bold text-slate-800 sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left">
                <a
                  href="https://easyinvoicepdf.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  EasyInvoicePDF
                </a>
              </p>
            </div>
            <p className="text-sm text-slate-700">{footerDescription}</p>
            <div className="flex gap-4" data-testid="footer-logos-social-links">
              <Link
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                href={TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-10 md:ml-20 md:flex-1 md:grid-cols-2">
            <div className="space-y-3" data-testid="footer-solutions-links">
              <h3 className="text-sm font-medium text-slate-900">Solutions</h3>
              <ul className="space-y-2">
                {SEO_FOOTER_SOLUTION_LINKS.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={`/${slug}`}
                      className="text-sm text-slate-500 hover:text-slate-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3" data-testid="footer-social-links">
              <h3 className="text-sm font-medium text-slate-900">
                {resources}
              </h3>
              {footerLinks}
            </div>
          </div>
        </div>
        {/* Badge for featured on Startup Fame */}
        <div className="my-5">
          <a
            href="https://startupfa.me/s/easyinvoicepdf?utm_source=easyinvoicepdf.com"
            target="_blank"
          >
            <img
              src="https://startupfa.me/badges/featured-badge-small.webp"
              alt="Featured on Startup Fame"
              width="224"
              height="36"
              loading="lazy"
              decoding="async"
            />
          </a>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="text-sm text-slate-700">
            © {new Date().getFullYear()} EasyInvoicePDF.com
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-700">
            <a href="/founder">
              <img
                src="https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459"
                alt="Vlad Sazonau"
                className="size-6 rounded-full"
                height="24"
                width="24"
                loading="lazy"
                decoding="async"
              />
            </a>
            <span>
              {footerCreatedBy}{" "}
              <a href="/founder" className="underline hover:text-black">
                Vlad Sazonau
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const DEFAULT_FOOTER_DESCRIPTION = (
  <>
    Create professional PDF invoices in seconds with our free, open-source
    invoice generator. 100% in-browser, no sign-up required, and no ads. Your
    data stays on your device. Includes live PDF preview, instant PDF download,
    and customizable templates, including a Stripe-style layout - ideal for
    freelancers, startups, and small businesses.
    <br /> <br />
    Not accounting software. No compliance guarantees. By using this tool, you
    agree to the{" "}
    <Link href="/tos" className="text-slate-700 underline hover:text-slate-900">
      Terms of Service
    </Link>
  </>
);

function DefaultFooterLinks() {
  return (
    <ul className="space-y-2">
      <li>
        <Link
          href="/?template=default"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Invoice Generator
        </Link>
      </li>
      <li>
        <Link
          href="/en/about"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Home
        </Link>
      </li>

      <li>
        <Link
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          GitHub
        </Link>
      </li>

      <li>
        <Link
          href="/tos"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Terms of Service
        </Link>
      </li>
      <li>
        <Link
          href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Share feedback
        </Link>
      </li>
      <li>
        <Link
          href="/founder"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Founder
        </Link>
      </li>
      <li>
        <Link
          href="/llms.txt"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          llms.txt
        </Link>
      </li>
    </ul>
  );
}
