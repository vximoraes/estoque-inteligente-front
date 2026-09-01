import ThemeToggleButton from '@/components/layout/theme-toggle-button';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeToggleButton />
      {children}
    </>
  );
}
