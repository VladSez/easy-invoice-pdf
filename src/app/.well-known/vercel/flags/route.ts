import { getProviderData } from "@flags-sdk/vercel";
import { createFlagsDiscoveryEndpoint } from "flags/next";

import * as flags from "@/flags";

/**
 * Exposes the flag definitions to the Flags Explorer in the Vercel Toolbar, so
 * a flag can be read and overridden for one session on a preview deployment
 * without changing what anyone else sees. Vercel also reads this to surface a
 * flag declared in code as a draft in the dashboard.
 */
export const GET = createFlagsDiscoveryEndpoint(async () =>
  getProviderData(flags),
);
