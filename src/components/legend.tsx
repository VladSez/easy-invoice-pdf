export const Legend = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) => {
  return (
    <legend className="text-lg font-semibold text-gray-900" {...props}>
      {children}
    </legend>
  );
};
