import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminAdminsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  // Вкладка только для owner — если admin зайдёт по прямой ссылке, увести его.
  if (!profile || profile.role !== 'owner') {
    redirect({ href: '/admin/rooms', locale });
    return;
  }

  const t = await getTranslations('admin');
  return (
    <div className="rounded-2xl bg-surface border border-border p-6 text-center">
      <p className="text-ink-muted text-sm">{t('comingSoon')}</p>
    </div>
  );
}
