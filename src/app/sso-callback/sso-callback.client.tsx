"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export function SsoCallback() {
  return <AuthenticateWithRedirectCallback />;
}
