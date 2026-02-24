"use client";

type Props = {
  number: number;
};

const formatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
});

export function CountUpNumber({ number }: Props) {
  const formattedNumber = formatter.format(number).toLowerCase();

  return (
    <span className="min-w-[27px] text-center text-sm font-medium tabular-nums text-slate-950">
      {formattedNumber}
    </span>
  );
}
