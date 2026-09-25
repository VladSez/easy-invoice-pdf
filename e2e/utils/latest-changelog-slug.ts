import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const CHANGELOG_CONTENT_DIR = path.resolve(
  __dirname,
  "../../src/app/(main)/changelog/content",
);

/** The `date: "YYYY-MM-DD"` field of a post's `metadata` export. */
const METADATA_DATE_REGEX = /^\s*date:\s*"(\d{4}-\d{2}-\d{2})"/m;

/**
 * The slug of the newest changelog post -- what the app stores once its "What's new"
 * popup has been seen, so `playwright.config.ts` can mark it seen up front.
 *
 * The app imports each MDX post to read its metadata, which the Playwright config cannot
 * do, so this reads the `date` field as text instead. The ordering is the app's own, see
 * `getChangelogEntries`: newest date first, and `Array#sort` is stable, so posts sharing a
 * date keep directory order in both places.
 *
 * Throws on a post without a readable date, rather than quietly picking the wrong slug
 * and letting the popup back into every test.
 */
export function getLatestChangelogSlug() {
  const posts = readdirSync(CHANGELOG_CONTENT_DIR)
    .filter((file) => {
      return file.endsWith(".mdx");
    })
    .map((file) => {
      const source = readFileSync(
        path.join(CHANGELOG_CONTENT_DIR, file),
        "utf8",
      );
      const date = METADATA_DATE_REGEX.exec(source)?.[1];

      if (!date) {
        throw new Error(`Changelog post ${file} has no readable metadata date`);
      }

      return { slug: file.replace(".mdx", ""), time: new Date(date).getTime() };
    })
    .sort((a, b) => {
      return b.time - a.time;
    });

  const [latest] = posts;

  if (!latest) {
    throw new Error(`No changelog posts found in ${CHANGELOG_CONTENT_DIR}`);
  }

  return latest.slug;
}
