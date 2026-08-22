import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'da', 'uk', 'ru'],
  defaultLocale: 'en',
  // localeDetection: true — по умолчанию next-intl сам определяет
  // язык браузера при первом визите (Accept-Language), как просили в ТЗ.
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
