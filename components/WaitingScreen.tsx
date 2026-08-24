'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function WaitingScreen() {
  const t = useTranslations('waiting');
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    // Сбрасываем индикатор через секунду — router.refresh() не даёт
    // явного колбэка о завершении, а сама навигация обычно быстрая.
    setTimeout(() => setRefreshing(false), 1000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <Image
          src="/logo/profil-hotels-logo-transparent.png"
          alt=""
          width={180}
          height={132}
          className="w-32 h-auto mx-auto"
        />

        <div className="rounded-card bg-surface border border-border p-8 space-y-4">
          <span className="text-3xl" aria-hidden="true">
            🔑
          </span>
          <h1 className="font-display text-2xl text-ink">{t('title')}</h1>
          <p className="text-ink text-sm">{t('body')}</p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full rounded-pill bg-gold text-surface font-medium px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {refreshing ? t('refreshing') : t('refreshButton')}
          </button>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-ink-muted hover:text-gold transition-colors"
        >
          {t('signOut')}
        </button>
      </div>
    </main>
  );
}
