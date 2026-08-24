import { useTranslations } from 'next-intl';
import SignOutButton from './SignOutButton';

/**
 * Временная заглушка для admin/owner — сама админ-панель
 * будет собрана позже, по плану, после гостевых экранов.
 */
export default function AdminPlaceholder() {
  const t = useTranslations('root');

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-surface border border-border p-6 text-center space-y-3">
        <p className="text-gold text-xs uppercase tracking-wide">
          {t('stepDone')}
        </p>
        <h1 className="font-display text-2xl text-ink">{t('adminTitle')}</h1>
        <p className="text-ink-muted text-sm">{t('adminComingSoon')}</p>
        <SignOutButton />
      </div>
    </main>
  );
}
