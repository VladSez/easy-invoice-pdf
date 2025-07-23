import type { MDXComponents } from "mdx/types";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from your UI library.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Tailwind Typography plugin provides excellent defaults
    // We can override specific elements here if needed

    // Custom link styling for external links
    a: ({ children, href, ...props }) => {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          {...props}
          {...(isExternal && {
            target: "_blank",
            rel: "noopener noreferrer",
          })}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          {children}
        </a>
      );
    },

    // Enhanced code block styling
    pre: ({ children, ...props }) => (
      <pre
        {...props}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800"
      >
        {children}
      </pre>
    ),

    // Enhanced inline code styling
    code: ({ children, ...props }) => (
      <code
        {...props}
        className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      >
        {children}
      </code>
    ),

    // Custom blockquote with accent color
    blockquote: ({ children, ...props }) => (
      <blockquote
        {...props}
        className="border-l-4 border-blue-500 bg-blue-50 py-2 pl-6 italic dark:bg-blue-950/20"
      >
        {children}
      </blockquote>
    ),

    // Enhanced image styling with responsive design
    img: ({ alt, src, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        {...props}
        src={src}
        alt={alt}
        height={450}
        width={840}
        className="aspect-auto rounded-lg border border-gray-200 bg-slate-300 shadow-xs dark:border-gray-700"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    ),

    table: ({ children, ...props }) => (
      <table {...props} className="w-full border-collapse border">
        {children}
      </table>
    ),

    th: ({ children, ...props }) => (
      <th {...props} className="border p-2 text-center">
        {children}
      </th>
    ),

    td: ({ children, ...props }) => (
      <td {...props} className="border p-2">
        {children}
      </td>
    ),

    // Override any default components as needed
    ...components,
  };
}
