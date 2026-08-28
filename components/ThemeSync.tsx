'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'lunchbox-theme';

/**
 * Подстраховка от рассинхронизации темы при смене языка.
 *
 * Смена локали меняет верхний сегмент маршрута (/ru/... -> /en/...),
 * где у нас объявлен <html> (см. layout.tsx). React пересобирает эту
 * часть дерева по JSX (там только классы шрифтов), а разовый инлайн-
 * скрипт в <head>, который выставляет класс темы при самой первой
 * отрисовке, в момент такого пересоздания не гарантированно
 * перезапускается — из-за этого класс темы мог "теряться".
 *
 * Этот компонент рендерится в каждом [locale]-дереве и на каждое
 * монтирование (в том числе при пересоздании после смены языка)
 * принудительно сверяет class на <html> с тем, что реально сохранено
 * в localStorage — какая бы часть дерева ни пересобралась, тема
 * всегда останется верной.
 */
export default function ThemeSync() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || 'dark';
      const html = document.documentElement;
      html.classList.remove('theme-dark', 'theme-light');
      html.classList.add(stored === 'light' ? 'theme-light' : 'theme-dark');
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — тёмная тема
      // по умолчанию и так уже стоит через инлайн-скрипт в <head>.
    }
  });

  return null;
}
