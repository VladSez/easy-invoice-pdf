import { readdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";

interface ChangelogMetadata {
  title: string;
  description: string;
  date: string;
  version?: string;
  type?: "major" | "minor" | "patch";
  slug?: string;
}

export interface ChangelogEntry {
  slug: string;
  metadata: ChangelogMetadata;
  Component: React.ComponentType;
}

// Validate metadata with Zod schema
const changelogEntryMetadataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  date: z.string().date(),
  version: z.string().optional(),
  type: z.enum(["major", "minor", "patch"]).optional(),
});

/**
 * Gets all MDX files from the content/changelog directory
 */
async function getChangelogFiles(): Promise<string[]> {
  try {
    const changelogDir = join(
      process.cwd(),
      "src",
      "app",
      "changelog",
      "content",
    );
    const files = await readdir(changelogDir);
    return files.filter((file) => file.endsWith(".mdx"));
  } catch (error) {
    console.error("Failed to read changelog directory:", error);
    return [];
  }
}

/**
 * Converts filename to slug (removes .mdx extension)
 */
function filenameToSlug(filename: string): string {
  return filename.replace(".mdx", "");
}

/**
 * Dynamically imports a changelog MDX file
 */
async function importChangelogFile(filename: string) {
  const slug = filenameToSlug(filename);
  try {
    const dynamicModule = (await import(`./content/${filename}`)) as {
      metadata: ChangelogMetadata;
      default: React.ComponentType;
    };

    // Validate metadata and throw error if invalid
    try {
      changelogEntryMetadataSchema.parse(dynamicModule.metadata);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `Invalid metadata in changelog file ${filename}:`,
          error.errors,
        );
        return null;
      }
      throw error;
    }

    return {
      slug,
      module: {
        metadata: dynamicModule.metadata,
        default: dynamicModule.default,
      },
    };
  } catch (error) {
    console.error(`Failed to import changelog file ${filename}:`, error);
    return null;
  }
}

/**
 * Loads all changelog entries and returns them sorted by date (newest first)
 */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  const files = await getChangelogFiles();
  const entries: ChangelogEntry[] = [];

  for (const filename of files) {
    const imported = await importChangelogFile(filename);

    if (!imported) {
      throw new Error(
        `\n\n __________ ERROR: Failed to import changelog file ${filename} __________\n\n`,
      );
    }

    const { slug, module } = imported;
    const { metadata, default: Component } = module as {
      metadata: ChangelogMetadata;
      default: React.ComponentType;
    };

    entries.push({
      slug,
      metadata: {
        ...metadata,
        slug, // Ensure slug is always available in metadata
      },
      Component,
    });
  }

  // Sort by date (newest first)
  return entries.sort(
    (a, b) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
}

/**
 * Gets a specific changelog entry by slug
 */
export async function getChangelogEntry(
  slug: string,
): Promise<ChangelogEntry | null> {
  const files = await getChangelogFiles();
  const filename = files.find((file) => filenameToSlug(file) === slug);

  if (!filename) {
    return null;
  }

  const imported = await importChangelogFile(filename);
  if (!imported) {
    return null;
  }

  const { module } = imported;
  const { metadata, default: Component } = module as {
    metadata: ChangelogMetadata;
    default: React.ComponentType;
  };

  return {
    slug,
    metadata: {
      ...metadata,
      slug, // Ensure slug is always available in metadata
    },
    Component,
  };
}

/**
 * Formats a date for display
 */
export function formatChangelogDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Gets the next changelog entry after the current one (based on date order)
 */
export async function getNextChangelogEntry(
  currentSlug: string,
): Promise<ChangelogEntry | null> {
  const allEntries = await getChangelogEntries();
  const currentIndex = allEntries.findIndex(
    (entry) => entry.slug === currentSlug,
  );

  // If current entry is not found or is the first one (newest), return null
  if (currentIndex === -1 || currentIndex === 0) {
    return null;
  }

  // Return the previous entry (newer entry since they're sorted newest first)
  return allEntries[currentIndex - 1];
}

/**
 * Gets the previous changelog entry before the current one (based on date order)
 */
export async function getPreviousChangelogEntry(
  currentSlug: string,
): Promise<ChangelogEntry | null> {
  const allEntries = await getChangelogEntries();
  const currentIndex = allEntries.findIndex(
    (entry) => entry.slug === currentSlug,
  );

  // If current entry is not found or is the last one (oldest), return null
  if (currentIndex === -1 || currentIndex === allEntries.length - 1) {
    return null;
  }

  // Return the next entry (older entry since they're sorted newest first)
  return allEntries[currentIndex + 1];
}
