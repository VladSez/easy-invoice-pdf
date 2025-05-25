"use client";
// react-scan must be imported before react
import { scan } from "react-scan";
import { useEffect, useRef } from "react";

/**
 * React-scan is a tool for detecting and fixing issues with React
 * components https://github.com/aidenybai/react-scan#readme
 */
export function ReactScan() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;

    try {
      scan({
        enabled: true,
      });
      hasInitialized.current = true;
    } catch (error) {
      console.error("Failed to initialize react-scan:", error);
    }
  }, []);

  return <></>;
}
