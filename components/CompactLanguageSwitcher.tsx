'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Компактный переключатель языка — просто ряд кодов (RU/EN/UK/DA) в
 * пилюле. Используется там, где нет места на полноразмерный вариант
 * с подписями (профиль): экран входа, шапка админки.
 */
export default function CompactLanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex gap-1 bg-surface/80 backdrop-blur rounded-full p-1 border border-border">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          className={
            'px-2.5 py-1 rounded-full text-xs font-medium uppercase transition-colors ' +
            (loc === locale
              ? 'bg-gold text-surface'
              : 'text-ink-muted hover:text-ink')
          }
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
