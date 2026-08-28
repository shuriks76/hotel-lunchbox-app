'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  da: 'Dansk',
  uk: 'Українська',
  ru: 'Русский',
};

/**
 * Переключатель языка интерфейса. Меняет только локаль в пути
 * (next-intl сам подставляет /en/, /ru/ и т.д.), оставаясь на той же
 * странице — гость не теряет место, где был.
 */
export default function LanguageSwitcher() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        {t('languageLabel')}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            className={
              'rounded-lg border px-3 py-2 text-sm text-center transition-colors ' +
              (loc === locale
                ? 'border-gold text-gold bg-gold-bg'
                : 'border-border text-ink hover:border-gold/60')
            }
          >
            {LANGUAGE_LABELS[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
