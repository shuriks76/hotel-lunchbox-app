'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import WantsAdminToggle from '@/components/WantsAdminToggle';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-center py-2">
          <Image
            src="/logo/profil-hotels-logo-transparent.png"
            alt=""
            width={160}
            height={118}
            className="w-28 h-auto"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-gold transition-colors"
          >
            ← {t('back')}
          </Link>
          <h1 className="font-display text-xl text-ink">{t('title')}</h1>
          <span className="w-12" aria-hidden="true" />
        </div>

        <div className="rounded-card bg-surface border border-border p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            {t('themeLabel')}
          </p>
          <ThemeToggle />
        </div>

        <div className="rounded-card bg-surface border border-border p-4">
          <LanguageSwitcher />
        </div>

        <div className="rounded-card bg-surface border border-border p-4">
          <WantsAdminToggle />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-pill border border-border px-4 py-2.5 text-sm text-ink-muted hover:border-gold hover:text-gold transition-colors"
        >
          {t('signOut')}
        </button>
      </div>
    </main>
  );
}
