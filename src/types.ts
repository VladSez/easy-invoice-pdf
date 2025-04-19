export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonReadonly<T> = {
  -readonly [P in keyof T]: T[P] extends object ? NonReadonly<T[P]> : T[P];
};
