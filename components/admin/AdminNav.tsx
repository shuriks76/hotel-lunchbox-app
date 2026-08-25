'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminNav({ isOwner }: { isOwner: boolean }) {
  const t = useTranslations('admin');
  const tMain = useTranslations('main');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const tabs = [
    { href: '/admin/orders', label: t('navOrders') },
    { href: '/admin/rooms', label: t('navRooms') },
    ...(isOwner ? [{ href: '/admin/admins', label: t('navAdmins') }] : []),
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="bg-surface border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                  (active
                    ? 'bg-gold-bg text-gold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-raised')
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-ink-muted hover:text-gold transition-colors hidden sm:inline"
          >
            {t('backToApp')}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-pill border border-border px-3 py-1.5 text-sm text-ink-muted hover:border-gold hover:text-gold transition-colors"
          >
            {tMain('signOut')}
          </button>
        </div>
      </div>
    </nav>
  );
}
