export type Prettify<T> = {
  [K in keyof T]: T[K];
  // `& {}` is what flattens the mapped type into a single readable object in
  // editor tooltips - that is the whole point of Prettify
  // oxlint-disable-next-line typescript/ban-types
} & {};

export type NonReadonly<T> = {
  -readonly [P in keyof T]: T[P] extends object ? NonReadonly<T[P]> : T[P];
};
