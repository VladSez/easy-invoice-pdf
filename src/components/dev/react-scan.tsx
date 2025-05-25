"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { useEffect } from "react";

/**
 * React-scan is a tool for detecting and fixing issues with React
 * components https://github.com/aidenybai/react-scan#readme
 */
export function ReactScan() {
  useEffect(() => {
    scan({
      enabled: true,
    });
  }, []);

  return <></>;
}
