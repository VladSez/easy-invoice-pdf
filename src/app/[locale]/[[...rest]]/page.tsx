import { notFound } from "next/navigation";

/**
 * Optional catch-all under the `[locale]` root layout.
 *
 * Besides `/en/whatever`, this also catches every single-segment URL that no other
 * route claims (`/en`, `/non-existent-page`): with two root layouts there is no
 * top-level `not-found.tsx` any more, so without this Next.js would answer those
 * with its built-in 404 document instead of `src/app/[locale]/not-found.tsx`.
 */
export default function CatchAllPage() {
  notFound();
}
