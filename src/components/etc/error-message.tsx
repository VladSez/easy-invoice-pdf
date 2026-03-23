export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-5 max-w-2xl text-balance text-center text-sm text-gray-600">
      {children}
    </p>
  );
}
