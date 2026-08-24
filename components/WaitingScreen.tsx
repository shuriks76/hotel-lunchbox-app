'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

// Насколько часто перепроверяем, не назначили ли уже комнату.
// Без Supabase Realtime, просто мягкий поллинг через router.refresh() —
// это дешево и для экрана ожидания более чем достаточно.
const POLL_INTERVAL_MS = 30_000;

export default function WaitingScreen() {
  const t = useTranslations('waiting');
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

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
          <p className="text-ink-muted text-xs">{t('checking')}</p>
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
