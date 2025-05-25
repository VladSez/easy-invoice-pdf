"use client";

/**
 * React-scan is a tool for detecting and fixing issues with React
 * components https://github.com/aidenybai/react-scan#readme
 */
export function ReactScan() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-head-element
    <head>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        crossOrigin="anonymous"
        src="//unpkg.com/react-scan/dist/auto.global.js"
      />
    </head>
  );
}
