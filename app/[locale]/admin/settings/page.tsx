import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminSettingsScreen from '@/components/admin/AdminSettingsScreen';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  // Настройки — только для owner, тот же порог важности, что и роли.
  if (!myProfile || myProfile.role !== 'owner') {
    redirect({ href: '/admin/rooms', locale });
    return;
  }

  const { data: settings, error } = await supabase
    .from('settings')
    .select('order_cutoff_hour, order_cutoff_minute, data_retention_months')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('AdminSettingsPage query error:', error.message);
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-warn-border bg-warn-bg text-warn text-sm p-3">
          Ошибка загрузки данных: {error.message}
        </div>
      )}
      <AdminSettingsScreen
        initialCutoffHour={settings?.order_cutoff_hour ?? 12}
        initialCutoffMinute={settings?.order_cutoff_minute ?? 0}
        initialRetentionMonths={settings?.data_retention_months ?? 12}
      />
    </>
  );
}
