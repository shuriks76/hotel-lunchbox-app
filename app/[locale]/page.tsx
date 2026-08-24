import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import WaitingScreen from '@/components/WaitingScreen';
import RoomAssignedPlaceholder from '@/components/RoomAssignedPlaceholder';
import AdminPlaceholder from '@/components/AdminPlaceholder';

type StayWithRoom = {
  room_id: string;
  rooms: { room_number: string } | null;
};

/**
 * Диспетчер главной страницы.
 * - не вошёл -> /login
 * - admin/owner -> заглушка админ-панели (соберём отдельным шагом позже)
 * - guest без активного проживания -> экран ожидания ("подойдите на ресепшен")
 * - guest с активным проживанием -> временная заглушка,
 *   реальный календарь с заказами будет в шаге 3.
 */
export default async function RootPage({
  params,
}: {
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

  if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
    return <AdminPlaceholder />;
  }

  const { data: stay } = await supabase
    .from('stays')
    .select('room_id, rooms(room_number)')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle<StayWithRoom>();

  if (!stay) {
    return <WaitingScreen />;
  }

  return (
    <RoomAssignedPlaceholder roomNumber={stay.rooms?.room_number ?? null} />
  );
}
