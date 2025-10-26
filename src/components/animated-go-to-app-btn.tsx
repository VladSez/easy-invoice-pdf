"use client";

import { ArrowRightIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function BlackAnimatedGoToAppBtn({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Button
      _size="lg"
      _variant="outline"
      className={
        "group relative overflow-hidden bg-zinc-900 px-3 text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-800 hover:text-white active:scale-[0.98] sm:px-8"
      }
      asChild
    >
      <Link
        href="/?template=default"
        scroll={false}
        className="flex items-center"
      >
        <ArrowRightIcon
          className="mr-2 size-5 transition-transform group-hover:scale-110"
          style={{
            animation: "pulse-arrow 5s infinite",
          }}
        />
        <style jsx global>{`
          @keyframes pulse-arrow {
            0%,
            70%,
            100% {
              transform: translateX(0);
            }
            75% {
              transform: translateX(4px);
            }
            80% {
              transform: translateX(0);
            }
            85% {
              transform: translateX(4px);
            }
            90% {
              transform: translateX(0);
            }
            95% {
              transform: translateX(4px);
            }
          }
        `}</style>
        {children}
      </Link>
    </Button>
  );
}
