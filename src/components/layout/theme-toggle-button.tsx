'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed right-4 top-4 z-50 h-10 w-10" aria-hidden="true" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md text-foreground opacity-60 hover:opacity-100 transition-opacity duration-300 ease-out cursor-pointer"
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      data-test="theme-toggle-button"
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
          isDark
            ? 'opacity-0 scale-50 -rotate-45'
            : 'opacity-100 scale-100 rotate-0'
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
          isDark
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-50 rotate-45'
        }`}
      />
    </button>
  );
}
