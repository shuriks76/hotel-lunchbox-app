import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

const displayFont = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sansFont = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Profil Hotels — Lunchbox',
  description: 'Заказ ланчбоксов для гостей отеля',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Включаем статический рендер этого сегмента для данной локали.
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${displayFont.variable} ${sansFont.variable}`}>
      <head>
        {/* Ставим класс темы до отрисовки, чтобы не было "мигания" не той темы.
            Тема хранится в localStorage; ключ и умолчание пока фиксированы —
            переключатель в профиле добавим отдельным шагом. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('lunchbox-theme') || 'dark';
                document.documentElement.classList.add(t === 'light' ? 'theme-light' : 'theme-dark');
              } catch (e) {
                document.documentElement.classList.add('theme-dark');
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
