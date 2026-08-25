import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminNav from '@/components/admin/AdminNav';

/**
 * Общий layout для всей админ-панели (/admin/*).
 * - Пускает только admin/owner, остальных отправляет на главную.
 * - Оборачивает всё в тему "kitchen" (см. globals.css) — сознательно
 *   не в стиле отеля, светлая и современная.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login', locale });
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    redirect({ href: '/', locale });
    return;
  }

  return (
    <div className="theme-kitchen min-h-screen bg-bg text-ink">
      <AdminNav isOwner={profile.role === 'owner'} />
      <div className="max-w-5xl mx-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}
