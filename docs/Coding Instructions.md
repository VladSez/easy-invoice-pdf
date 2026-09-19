# Coding Instructions

## General

- Write clear, readable, maintainable production-quality code.
- Prefer simplicity over abstraction.
- Avoid unnecessary indirection, factories, wrappers, dependency containers, configuration objects, or "enterprise" patterns unless they solve a real problem.
- Optimize for readability first, performance second unless performance is explicitly relevant.
- Prefer explicit code over clever code.
- Keep functions small and focused.
- Extract reusable logic only when it is genuinely reused or makes the main flow easier to understand.
- Do not introduce abstractions preemptively.
- Avoid TODOs, placeholders, incomplete implementations, and pseudocode in final code.
- Preserve existing project conventions unless there is a strong reason to improve them.

## TypeScript

Use the latest stable TypeScript and modern best practices.

### Prefer inference

Prefer type inference whenever TypeScript can infer the type accurately.

```ts
const user = await getUser(userId);
const users = await getUsers();
const isAdmin = user.role === "admin";
```

Avoid redundant annotations:

```ts
// Avoid
const isLoading: boolean = false;
const users: User[] = await getUsers();

// Prefer
const isLoading = false;
const users = await getUsers();
```

Add explicit types when they:

- improve a public API
- constrain behavior
- prevent widening
- document non-obvious domain concepts
- are required at module boundaries
- make complex return values easier to understand

### Prefer `as const`

Use `as const` for literal configuration and immutable value definitions.

```ts
const EMAIL_PROVIDERS = ["gmail", "outlook"] as const;

type EmailProvider = (typeof EMAIL_PROVIDERS)[number];
```

Prefer deriving types from values instead of maintaining duplicate unions manually.

```ts
// Avoid
type EmailProvider = "gmail" | "outlook";

const EMAIL_PROVIDERS = ["gmail", "outlook"];

// Prefer
const EMAIL_PROVIDERS = ["gmail", "outlook"] as const;

type EmailProvider = (typeof EMAIL_PROVIDERS)[number];
```

### Prefer `satisfies`

Use `satisfies` when validating an object against a type while preserving narrow inference.

```ts
const providerConfig = {
  gmail: {
    label: "Gmail",
  },
  outlook: {
    label: "Outlook",
  },
} as const satisfies Record<EmailProvider, { label: string }>;
```

Prefer:

```ts
const config = {
  foo: "bar",
} satisfies SomeConfig;
```

over unnecessarily widening it:

```ts
const config: SomeConfig = {
  foo: "bar",
};
```

Use `as const satisfies` when both literal preservation and structural validation are useful.

### Avoid unsafe assertions

Avoid `as SomeType` unless TypeScript cannot reasonably prove something that is already guaranteed by runtime logic.

Never use assertions simply to silence a compiler error.

Avoid:

```ts
value as SomeType;
value!;
```

Prefer runtime validation, narrowing, discriminated unions, type guards, or improved type definitions.

### Avoid `any`

Never introduce `any` unless interacting with an API that genuinely cannot be typed.

Prefer:

```ts
unknown;
```

and narrow it explicitly.

### Derive types

Prefer deriving types from:

- schemas
- constants
- functions
- database definitions
- API contracts

instead of duplicating them.

```ts
type User = Awaited<ReturnType<typeof getUser>>;
```

Use this only when the derived type remains understandable. Prefer named domain types when they improve readability.

### Prefer discriminated unions

Model mutually exclusive states with discriminated unions instead of several loosely related optional properties.

```ts
type SendEmailResult =
  | {
      status: "success";
      messageId: string;
    }
  | {
      status: "error";
      error: string;
    };
```

### Prefer `type`

Prefer `type` for most TypeScript definitions.

Use `interface` when interface-specific behavior is useful, such as declaration merging or a deliberately extensible public contract.

### Avoid enums

Prefer literal objects or readonly arrays over TypeScript enums.

```ts
const EMAIL_STATUS = {
  pending: "pending",
  sent: "sent",
  failed: "failed",
} as const;

type EmailStatus = (typeof EMAIL_STATUS)[keyof typeof EMAIL_STATUS];
```

## Functions

Prefer function declarations over function expressions.

```ts
function getUser() {
  // ...
}
```

Prefer this over:

```ts
const getUser = () => {
  // ...
};
```

Arrow functions are fine for:

- callbacks
- inline handlers
- array methods
- cases where lexical `this` matters

Use descriptive function names.

Prefer early returns to deeply nested conditions.

```ts
function getDisplayName(user: User) {
  if (!user.firstName) {
    return user.email;
  }

  return user.firstName;
}
```

Avoid boolean parameters when they make call sites ambiguous.

```ts
// Avoid
sendEmail(message, true);

// Prefer
sendEmail(message, {
  includeAttachment: true,
});
```

For very small internal functions, do not create option objects unnecessarily if a direct argument is clearer.

## Error handling

Handle expected failure modes explicitly.

Prefer domain-specific errors or structured results when callers need to distinguish between error cases.

Do not wrap code in `try/catch` unless:

- the error can be handled
- context needs to be added
- an external error needs translating into a domain/API error

Avoid catches that merely log and rethrow.

Do not silently swallow errors.

## Nullability

Prefer `undefined` for optional JavaScript values unless an API or database explicitly uses `null`.

Use optional chaining and nullish coalescing where appropriate.

```ts
const name = user.profile?.name ?? "Unknown";
```

Do not confuse `||` with `??`.

Use `??` when `0`, `false`, or `''` are valid values.

## Objects and arrays

Prefer immutable transformations where practical.

Use:

- `map`
- `filter`
- `find`
- `some`
- `every`

when they make the intent clearer.

Do not force functional patterns when a normal loop is more readable.

Avoid unnecessary object spreading, especially in hot paths or when it obscures mutations.

## Comments

Use comments deliberately.

Comments should explain:

- why something exists
- non-obvious business rules
- important constraints
- surprising implementation details
- external API quirks
- security considerations
- performance tradeoffs
- behavior that future maintainers may otherwise "simplify" incorrectly

Do not comment obvious code.

```ts
// Avoid
// Get the user
const user = await getUser(userId);
```

Prefer:

```ts
// Gmail rejects encoded messages above its raw message size limit,
// so validate before building the MIME payload.
if (pdf.byteLength > MAX_EMAIL_PDF_BYTES) {
  // ...
}
```

Keep comments accurate when changing code.

Delete stale comments.

## JSDoc

Use JSDoc for exported functions, reusable utilities, public APIs, complicated domain logic, and behavior that is not obvious from the TypeScript signature.

Do not add verbose JSDoc to trivial functions.

Good:

```ts
/**
 * Sanitizes a filename before inserting it into a MIME attachment header.
 *
 * Removes characters that could break header formatting while preserving
 * common Unicode filename characters.
 */
export function sanitizeAttachmentFilename(filename: string) {
  // ...
}
```

Document important:

- invariants
- side effects
- assumptions
- thrown errors
- units
- limits
- API behavior

Do not repeat information already obvious from TypeScript.

Avoid redundant JSDoc like:

```ts
/**
 * Gets a user.
 *
 * @param userId - The user ID.
 * @returns The user.
 */
function getUser(userId: string): Promise<User> {
  // ...
}
```

Prefer documenting why or unusual behavior instead.

## React

Use modern React best practices.

Prefer Server Components by default in Next.js when client-side behavior is not needed.

Only add `'use client'` when necessary.

Keep state as close as possible to where it is used.

Avoid unnecessary:

- `useEffect`
- `useMemo`
- `useCallback`
- derived state
- global state

Do not use `useEffect` to derive data that can be calculated during render.

Prefer:

```tsx
const fullName = `${firstName} ${lastName}`;
```

over synchronizing derived state.

Use semantic HTML.

Prefer composition over large components with many configuration props.

Extract components when they:

- have a clear responsibility
- are reused
- significantly improve readability

Do not split every small piece of JSX into a component.

## JSX

Prefer explicit conditional expressions.

```tsx
{
  isLoading ? <Spinner /> : null;
}
```

Avoid:

```tsx
{
  isLoading && <Spinner />;
}
```

especially when values may not strictly be booleans.

Prefer readable JSX over clever abstractions.

Avoid deeply nested ternaries.

Extract complex conditions into descriptively named variables.

```tsx
const canSendInvoice = hasMailbox && hasValidInvoice && !isSending;
```

## Next.js

Use the latest stable Next.js conventions.

Prefer:

- Server Components
- Server Actions when appropriate
- Route Handlers for HTTP APIs
- explicit caching behavior
- framework-native primitives

Do not introduce client components simply to access data that can be loaded on the server.

Be explicit about caching when correctness depends on fresh data.

Avoid unnecessary framework wrappers around straightforward functionality.

## API code

Keep route handlers easy to follow.

Prefer code shaped like:

```ts
app.get("/protected", async (context) => {
  const { userId } = getAuth(context);

  if (!userId) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const result = await doSomething(userId);

  return context.json(result);
});
```

The main route should make the request flow obvious.

Extract:

- reusable business logic
- external API clients
- validation helpers
- parsing
- complex transformations

Do not hide the entire route behind generic controller/service/repository abstractions without a concrete benefit.

Avoid dependency injection containers or `defaultDependencies`-style objects unless testing or runtime substitution genuinely requires them.

Prefer direct imports and explicit dependencies.

## Validation

Treat external input as untrusted.

Validate:

- HTTP input
- environment variables
- external API responses when necessary
- persisted JSON
- webhook payloads

Prefer schema validation with the project's existing schema library.

Derive TypeScript types from schemas instead of duplicating them.

## Async code

Prefer `async`/`await`.

Run independent operations concurrently.

```ts
const [user, subscription] = await Promise.all([
  getUser(userId),
  getSubscription(userId),
]);
```

Do not parallelize operations that have ordering dependencies.

Avoid unnecessary `Promise.resolve`, manual Promise constructors, and nested `.then()` chains.

## Naming

Use descriptive names.

Prefer:

```ts
attachmentFilename;
authenticatedUserId;
gmailAccessToken;
invoicePdfBytes;
```

over:

```ts
filename;
id;
token;
data;
```

when additional specificity helps.

Avoid abbreviations unless they are universally understood in the domain.

Boolean names should generally read naturally:

```ts
isLoading;
hasAccess;
canSendEmail;
shouldRetry;
```

## Constants

Extract constants when they represent:

- domain rules
- limits
- reusable values
- meaningful configuration

Use uppercase names for true module-level constants.

```ts
const MAX_EMAIL_PDF_BYTES = 20 * 1024 * 1024;
```

Do not extract arbitrary one-off strings or numbers simply to avoid literals.

## Imports and exports

Prefer named exports.

```ts
export function sendEmail() {
  // ...
}
```

Avoid default exports unless required by the framework.

Keep imports organized and remove unused imports.

Prefer direct imports over barrel files when barrel files create unclear dependencies or circular-import risks.

## Formatting

Use this Prettier style:

```json
{
  "semi": false,
  "useTabs": true,
  "singleQuote": true
}
```

Do not add semicolons.

Use tabs for indentation.

Use single quotes.

## Refactoring

When refactoring existing code:

1. Understand the current behavior before changing structure.
2. Preserve behavior unless a behavior change is explicitly requested.
3. Remove unnecessary abstractions.
4. Reduce indirection.
5. Prefer fewer concepts and fewer layers.
6. Keep the primary execution path visible.
7. Avoid speculative extensibility.
8. Remove dead code created by the refactor.
9. Update types, comments, tests, and documentation affected by the change.
10. Run or recommend the relevant typecheck, lint, and tests.

Prefer:

```text
route → reusable function → external API
```

over:

```text
route → controller → service → dependency object → provider factory → adapter → external API
```

unless those layers provide actual value.

## Testing

Write tests around behavior rather than implementation details.

Prioritize:

- business rules
- edge cases
- validation
- authorization
- error handling
- regressions

Do not mock internal implementation details unnecessarily.

Prefer testing through stable public boundaries.

## Before finishing

Check the implementation for:

- type errors
- unnecessary type assertions
- duplicated types
- unnecessary abstractions
- hidden runtime assumptions
- missing validation
- race conditions
- incorrect async sequencing
- stale comments
- unnecessary React effects
- unnecessary client components
- naming clarity
- edge cases
- security issues

Prefer the simplest implementation that remains correct, explicit, and easy to maintain.
