// Not a module on purpose (no top-level import/export): a module augmentation
// cannot add new declarations, only an ambient declaration merges with the
// shorthand `declare module 'next/root-params'` that ships with Next.js.

/**
 * `next typegen` (16.3.4) leaves `next/root-params` untyped for this app: it works
 * on normalized routes, where the `(main)` root layout becomes `/` and is then
 * treated as an ancestor of the `[locale]` root layout, so "no root params" are
 * emitted (`.next/types/root-params.d.ts`) and every import is `any`. The runtime
 * detects root layouts from the file system and does resolve `locale`; this only
 * restores the type. `string | undefined` because the `(main)` root layout has no
 * such param. Drop this file once the generated one declares `locale` itself.
 */
declare module "next/root-params" {
  export function locale(): Promise<string | undefined>;
}
