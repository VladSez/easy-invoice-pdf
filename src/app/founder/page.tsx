"use client";

import {
  AnimatedDiv,
  blockEnterSpring,
} from "@/app/founder/components/animated-div";
import { AnimatedSignature } from "@/app/founder/components/animated-signature";
import { LINKEDIN_URL, TWITTER_URL } from "@/config";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-12 md:py-24 lg:min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          <AnimatedDiv className="mb-8" transition={blockEnterSpring(0)}>
            <div className="overflow-hidden rounded-full border-4 border-slate-200 shadow-lg">
              <img
                src="https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459"
                alt="Vlad Sazonau"
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="size-40 object-cover"
              />
            </div>
          </AnimatedDiv>

          <AnimatedDiv transition={blockEnterSpring(0.05)}>
            <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Vlad Sazonau
            </h1>
            <p className="mt-3 text-center text-xl text-slate-600 md:text-2xl">
              Product Engineer & Design Enthusiast
            </p>
            <p className="mt-2 text-center text-base text-slate-500 md:text-lg">
              Founder of EasyInvoicePDF
            </p>
          </AnimatedDiv>

          <AnimatedDiv
            className="mt-8 w-full max-w-xl"
            transition={blockEnterSpring(0.1)}
          >
            <p className="mx-auto text-center text-lg leading-relaxed text-slate-700">
              I&apos;m a product-minded generalist with 8+ years of experience
              building beautiful, functional products. I enjoy solving complex
              problems at the intersection of engineering and design.
            </p>
          </AnimatedDiv>

          <AnimatedDiv
            className="mt-12 flex flex-wrap justify-center gap-4 md:gap-6"
            transition={blockEnterSpring(0.15)}
          >
            <Link
              href="https://vladsazon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline transition-all hover:opacity-80"
              aria-label="Visit website"
            >
              Website
            </Link>

            <Link
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline transition-all hover:opacity-80"
              aria-label="Visit Twitter"
            >
              Twitter
            </Link>

            <Link
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline transition-all hover:opacity-80"
              aria-label="Visit LinkedIn"
            >
              LinkedIn
            </Link>

            <Link
              href={"https://github.com/VladSez"}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black underline transition-all hover:opacity-80"
              aria-label="Visit GitHub"
            >
              GitHub
            </Link>
          </AnimatedDiv>

          <AnimatedDiv
            className="mt-8 md:mt-12"
            transition={blockEnterSpring(0.2)}
          >
            <AnimatedSignature />
          </AnimatedDiv>
        </div>
      </div>
    </div>
  );
}
