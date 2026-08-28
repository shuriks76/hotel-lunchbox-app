'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'lunchbox-theme';

/**
 * Переключатель тёмная/светлая тема. Тема хранится в localStorage и
 * применяется как класс на <html> (см. инлайн-скрипт в
 * app/[locale]/layout.tsx, который читает то же значение при первой
 * отрисовке, чтобы не было "мигания" не той темой).
 */
export default function ThemeToggle() {
  const t = useTranslations('profile');
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'dark';
    setTheme(stored);
  }, []);

  function applyTheme(next: Theme) {
    const html = document.documentElement;
    html.classList.remove('theme-dark', 'theme-light');
    html.classList.add(next === 'light' ? 'theme-light' : 'theme-dark');
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  // До монтирования не знаем реальную тему (чтобы не мигнуть неверным
  // состоянием переключателя) — просто ничего не рендерим долю секунды.
  if (theme === null) return <div className="h-10" />;

  return (
    <div className="flex gap-1 bg-surface-raised rounded-full p-1 w-fit">
      <button
        type="button"
        onClick={() => applyTheme('dark')}
        className={
          'px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' +
          (theme === 'dark'
            ? 'bg-gold text-surface'
            : 'text-ink-muted hover:text-ink')
        }
      >
        {t('themeDark')}
      </button>
      <button
        type="button"
        onClick={() => applyTheme('light')}
        className={
          'px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' +
          (theme === 'light'
            ? 'bg-gold text-surface'
            : 'text-ink-muted hover:text-ink')
        }
      >
        {t('themeLight')}
      </button>
    </div>
  );
}
