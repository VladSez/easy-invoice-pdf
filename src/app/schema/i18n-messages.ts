import { z } from "zod";

const metadataSchema = z.object({
  about: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.string(),
  }),
});

const notFoundSchema = z.object({
  error: z.string(),
  message: z.string(),
  returnHome: z.string(),
});

const aboutFeaturesItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const aboutFeaturesSchema = z.object({
  badge: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.object({
    livePreview: aboutFeaturesItemSchema,
    shareableLinks: aboutFeaturesItemSchema,
    instantDownload: aboutFeaturesItemSchema,
    multiLanguage: aboutFeaturesItemSchema,
    vatSupport: aboutFeaturesItemSchema,
    openSource: aboutFeaturesItemSchema,
  }),
});

const aboutSchema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.string(),
  }),
  hero: z.object({
    title: z.string(),
    description: z.string(),
    noSignup: z.string(),
  }),
  features: aboutFeaturesSchema,
  cta: z.object({
    title: z.string(),
    description: z.string(),
    noSignup: z.string(),
  }),
  footer: z.object({
    description: z.string(),
    product: z.string(),
    links: z.object({
      features: z.string(),
      github: z.string(),
    }),
    copyright: z.string(),
    createdBy: z.string(),
  }),
  buttons: z.object({
    goToApp: z.string(),
    viewOnGithub: z.string(),
  }),
});

export const messagesSchema = z.object({
  About: aboutSchema,
  NotFound: notFoundSchema,
  Metadata: metadataSchema,
});

export type Messages = z.infer<typeof messagesSchema>;
