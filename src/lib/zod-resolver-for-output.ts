import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * `zodResolver` for a form whose state is typed on the schema's **output** type.
 *
 * Since @hookform/resolvers v5 the resolver is typed on the schema's *input*
 * type. For our schemas that is a poor description of the actual form state:
 * `.default()` makes fields optional that the form always populates, and
 * `z.coerce.number()` widens its input to `unknown` in zod v4, which would
 * erase the type of every calculated amount field (`total`, `netAmount`,
 * `vatAmount`, `preTaxAmount`) across the whole form tree.
 *
 * Our forms are seeded with fully-populated `defaultValues` of the output type
 * and every component reads and writes that shape, so the output type is the
 * accurate description. This bridges the resolver's generics to it; the runtime
 * behaviour is exactly that of a plain `zodResolver` call.
 */
export function zodResolverForOutput<TOutput extends FieldValues, TInput>(
  schema: z.ZodType<TOutput, TInput>,
): Resolver<TOutput> {
  // Re-declares the schema as one whose input is also `TOutput` - that is the
  // bridge described above, and it is what makes the resolver line up with a
  // `useForm<TOutput>`.
  return zodResolver(schema as unknown as z.ZodType<TOutput, TOutput>);
}
