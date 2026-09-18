import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

import type { AppEnv } from "../context";

export const healthRouter = new Hono<AppEnv>().get(
  "/api/health",
  describeRoute({
    tags: ["System"],
    summary: "Health check",
    responses: { 200: { description: "Service is healthy" } },
  }),
  (c) => c.json({ status: "ok" as const }),
);

export default healthRouter;
