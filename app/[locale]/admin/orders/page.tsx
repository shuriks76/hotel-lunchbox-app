import { getTranslations } from 'next-intl/server';

export default async function AdminOrdersPage() {
  const t = await getTranslations('admin');
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 text-center">
      <p className="text-ink-muted text-sm">{t('comingSoon')}</p>
    </div>
  );
}
