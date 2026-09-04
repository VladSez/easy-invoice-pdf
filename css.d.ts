// TypeScript 6 reports TS2882 for side-effect imports of modules that carry no
// type declarations. Next.js ships declarations for `*.module.css` but not for
// plain global stylesheets, which we import in `src/app/layout.tsx` (our own
// `globals.css` plus react-pdf's annotation/text layer styles).
declare module "*.css";
