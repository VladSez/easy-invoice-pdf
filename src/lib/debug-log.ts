/**
 * Whether the development traces below are printed.
 *
 * Off by default, and deliberately a plain constant rather than an env var: flipping it is a
 * one-character edit while you are already in the editor chasing something, and it costs the
 * app no configuration surface. `next.config.mjs` strips `console` calls from production
 * builds anyway -- this switch is about the *development* console, which the invoice page's
 * data-flow traces otherwise fill on every keystroke, burying anything else you were watching.
 */
// The annotation is the point: without it `false` narrows to a literal type, and every call
// below becomes statically dead code -- which is exactly what breaks the moment you flip this.
// oxlint-disable-next-line typescript/no-inferrable-types
const DEBUG_LOGS_ENABLED: boolean = false;

/**
 * Traces the invoice page's data flow: which source the invoice was initialized from, when the
 * URL is rewritten, when a change is detected against a shared link.
 *
 * These read as a narrative when you are debugging that flow and as noise the rest of the time,
 * which is why they are gated rather than deleted. `console.warn` (not `log`) because the repo
 * bans `console.log`.
 *
 * @param args - Anything `console.warn` accepts.
 */
export function debugLog(...args: unknown[]) {
  if (!DEBUG_LOGS_ENABLED) {
    return;
  }

  console.warn(...args);
}
