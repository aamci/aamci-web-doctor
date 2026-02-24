'use client';

import { useEffect } from 'react';

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply saved theme
    const theme = localStorage.getItem('theme') || 'system';
    applyTheme(theme);

    // Watch system preference changes (for 'system' mode)
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = localStorage.getItem('theme') || 'system';
      if (current === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handleSystemChange);

    // Apply saved language
    const lang = localStorage.getItem('language') || 'fr';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    return () => mq.removeEventListener('change', handleSystemChange);
  }, []);

  return <>{children}</>;
}
