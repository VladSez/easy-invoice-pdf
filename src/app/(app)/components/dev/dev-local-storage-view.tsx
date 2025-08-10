"use client";

import { Button } from "@/components/ui/button";
import { CustomTooltip, TooltipProvider } from "@/components/ui/tooltip";
import { initializeLocalStorageDebugger } from "@/lib/localStorage-debug-listener";
import ReactJsonView from "@microlink/react-json-view";
import {
  ChevronDown,
  ChevronUp,
  Database,
  Move,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface DraggablePosition {
  x: number;
  y: number;
}

/**
 * This component is used to view the localStorage data in a draggable window.
 * It is only visible in development mode.
 *
 */
export function DevLocalStorageView() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localStorageData, setLocalStorageData] = useState<
    Record<string, unknown>
  >({});
  const [position, setPosition] = useState<DraggablePosition>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const windowRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const getLocalStorageData = useCallback(() => {
    const data: Record<string, unknown> = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // we only want to show the keys from localStorage that starts with EASY_INVOICE
        if (key?.startsWith("EASY_INVOICE")) {
          const value = localStorage.getItem(key);
          try {
            // Try to parse as JSON first
            data[key] = JSON.parse(value || "");
          } catch {
            // If not JSON, store as string
            data[key] = value;
          }
        }
      }
    } catch (error) {
      return { error: "Failed to access localStorage", details: error };
    }

    return data;
  }, []);

  // Function to update localStorage data
  const updateLocalStorageReactState = useCallback(() => {
    setLocalStorageData(getLocalStorageData() || {});
    setLastUpdated(new Date().toLocaleTimeString());
  }, [getLocalStorageData]);

  // Initialize localStorage data and set up listeners
  useEffect(() => {
    // Initialize the localStorage debugger for listening to localStorage changes in the same tab
    initializeLocalStorageDebugger();

    updateLocalStorageReactState();

    // Listen for storage events (changes from other tabs/windows)
    const handleStorageChange = () => {
      updateLocalStorageReactState();
    };

    // Listen for custom localStorage events (changes from same tab)
    const handleCustomStorageChange = () => {
      updateLocalStorageReactState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage-change", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "local-storage-change",
        handleCustomStorageChange
      );
    };
  }, [updateLocalStorageReactState]);

  // Mouse event handlers for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragHandleRef.current?.contains(e.target as Node)) return;

    setIsDragging(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging, dragOffset]);

  return (
    <TooltipProvider>
      {/* Toggle Button */}
      <CustomTooltip
        trigger={
          <Button
            onClick={() => setIsOpen(!isOpen)}
            _size="sm"
            _variant="outline"
            className="fixed right-2 top-2 isolate z-[50] border border-gray-300 bg-gray-100 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-200 hover:shadow-md"
          >
            <Database className="h-4 w-4 text-gray-600" />
          </Button>
        }
        content="View localStorage data"
      />

      {/* Draggable Window */}
      {isOpen ? (
        <div
          ref={windowRef}
          className={`fixed isolate z-[52] rounded-lg border border-gray-300 bg-white shadow-lg ${
            isDragging ? "cursor-grabbing" : ""
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: isExpanded ? "650px" : "500px",
            height: isExpanded ? "550px" : "400px",
            minWidth: "300px",
            minHeight: "200px",
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Header with drag handle */}
          <div
            ref={dragHandleRef}
            className="flex cursor-grab items-center justify-between rounded-t-lg border-b border-gray-200 bg-gray-50 p-3 active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <Move className="h-4 w-4 text-gray-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  localStorage Viewer
                </span>
                <span className="text-xs text-gray-500">
                  {Object.keys(localStorageData).length} items
                  {lastUpdated && ` • Last updated: ${lastUpdated}`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <CustomTooltip
                trigger={
                  <Button
                    onClick={updateLocalStorageReactState}
                    _size="sm"
                    _variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                }
                content="Refresh data"
              />
              <CustomTooltip
                trigger={
                  <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    _size="sm"
                    _variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </Button>
                }
                content={isExpanded ? "Collapse" : "Expand"}
              />
              <CustomTooltip
                trigger={
                  <Button
                    onClick={() => setIsOpen(false)}
                    _size="sm"
                    _variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                }
                content="Close"
              />
            </div>
          </div>

          {/* Content */}
          <div className="h-full overflow-hidden p-3">
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              <ReactJsonView
                src={localStorageData}
                theme="rjv-default"
                collapsed={isExpanded ? false : 1}
                displayDataTypes={false}
                displayObjectSize={true}
                enableClipboard={false}
                style={{
                  fontSize: "12px",
                  lineHeight: "1.4",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </TooltipProvider>
  );
}
