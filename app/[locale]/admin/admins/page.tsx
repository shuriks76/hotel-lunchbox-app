import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminAdminsScreen from '@/components/admin/AdminAdminsScreen';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  full_name: string;
  role: 'guest' | 'admin' | 'owner';
};

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

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();

  // Вкладка только для owner — если admin зайдёт по прямой ссылке, увести его.
  if (!myProfile || myProfile.role !== 'owner') {
    redirect({ href: '/admin/rooms', locale });
    return;
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');

  if (error) {
    console.error('AdminAdminsPage query error:', error.message);
  }

  const typedProfiles = (profiles ?? []) as ProfileRow[];

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-warn-border bg-warn-bg text-warn text-sm p-3">
          Ошибка загрузки данных: {error.message}
        </div>
      )}
      <AdminAdminsScreen
        currentUserId={user!.id}
        staff={typedProfiles.filter((p) => p.role === 'admin' || p.role === 'owner')}
        guests={typedProfiles.filter((p) => p.role === 'guest')}
      />
    </>
  );
}
