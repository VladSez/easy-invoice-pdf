"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";

import { OPENAPI_DOCUMENT_PATH } from "@/lib/api-docs";

import { createRequestInterceptor } from "./request-interceptor";

import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react reaches for the DOM as it mounts, so it is loaded in the
// browser only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => <p style={{ padding: 20 }}>Loading API docs…</p>,
});

export function SwaggerDocs() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const requestInterceptor = useMemo(
    () =>
      createRequestInterceptor({
        getToken,
        // Only ever called from the browser, in response to Execute.
        getOrigin: () => window.location.origin,
      }),
    [getToken],
  );

  if (!isLoaded) {
    return <p style={{ padding: 20 }}>Loading…</p>;
  }

  if (!isSignedIn) {
    return (
      <p style={{ padding: 20 }}>
        <Link href="/">Sign in</Link> in this browser, then reload this page.
        Requests below are sent as the signed-in user.
      </p>
    );
  }

  return (
    <>
      <p style={{ font: "14px system-ui", padding: "12px 20px" }}>
        Signed in as {user?.primaryEmailAddress?.emailAddress ?? "your account"}{" "}
        — every request below carries a freshly minted Clerk token, so there is
        nothing to paste into <code>Authorize</code>.
      </p>
      <SwaggerUI
        url={OPENAPI_DOCUMENT_PATH}
        requestInterceptor={requestInterceptor}
        deepLinking
        displayRequestDuration
      />
    </>
  );
}
