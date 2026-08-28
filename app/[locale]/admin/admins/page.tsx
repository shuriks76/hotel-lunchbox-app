import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminAdminsScreen from '@/components/admin/AdminAdminsScreen';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  id: string;
  full_name: string;
  role: 'guest' | 'admin' | 'owner';
  wants_admin: boolean;
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

  const [{ data: profiles, error }, { data: activeStays }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, wants_admin').order('full_name'),
    supabase.from('stays').select('user_id').eq('active', true),
  ]);

  if (error) {
    console.error('AdminAdminsPage query error:', error.message);
  }

  const typedProfiles = (profiles ?? []) as ProfileRow[];
  const activeUserIds = new Set((activeStays ?? []).map((s) => s.user_id));

  // Кандидат виден владельцу, только если сам отметил желание в профиле
  // И прямо сейчас не заселён — как только его заселяют или назначают
  // ролью, он естественным образом пропадает из этого списка.
  const candidates = typedProfiles.filter(
    (p) => p.role === 'guest' && p.wants_admin && !activeUserIds.has(p.id)
  );

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
        candidates={candidates}
      />
    </>
  );
}
