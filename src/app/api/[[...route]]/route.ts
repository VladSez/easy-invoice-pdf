import { handle } from "hono/vercel";
import { NextResponse } from "next/server";

import { sendInvoiceFlag } from "@/flags";
import { app } from "@/server/api/app";

export const runtime = "nodejs";
export const maxDuration = 30;

const handler = handle(app);

async function dispatch(request: Request) {
  if (!(await sendInvoiceFlag()))
    return new NextResponse(null, { status: 404 });
  return handler(request);
}

export const GET = dispatch;
export const POST = dispatch;
export const DELETE = dispatch;
