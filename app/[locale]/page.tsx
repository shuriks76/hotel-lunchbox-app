import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import WaitingScreen from '@/components/WaitingScreen';
import MainScreen from '@/components/MainScreen';
import { copenhagenTodayISO, getTwoWeekRange } from '@/lib/date/copenhagen';

type StayWithRoom = {
  id: string;
  room_id: string;
  rooms: { room_number: string; is_family: boolean; capacity: number } | null;
};

/**
 * Диспетчер главной страницы.
 * - не вошёл -> /login
 * - admin/owner -> заглушка админ-панели (соберём отдельным шагом позже)
 * - guest без активного проживания -> экран ожидания
 * - guest с активным проживанием -> главный экран с календарём
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
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
    redirect({ href: '/admin', locale });
    return;
  }

  const { data: stay } = await supabase
    .from('stays')
    .select('id, room_id, rooms(room_number, is_family, capacity)')
    .eq('user_id', user.id)
    .eq('active', true)
    .maybeSingle<StayWithRoom>();

  if (!stay || !stay.rooms) {
    return <WaitingScreen />;
  }

  const todayISO = copenhagenTodayISO();
  const dates = getTwoWeekRange(todayISO);

  const [{ data: orderRows }, { data: settings }] = await Promise.all([
    supabase
      .from('orders')
      .select('order_date, meal_type, stay_id, issued_at')
      .gte('order_date', dates[0])
      .lte('order_date', dates[dates.length - 1])
      .is('cancelled_at', null),
    supabase
      .from('settings')
      .select('order_cutoff_hour, order_cutoff_minute')
      .eq('id', 1)
      .single(),
  ]);

  return (
    <MainScreen
      guestName={profile?.full_name ?? user.email ?? ''}
      roomNumber={stay.rooms.room_number}
      isFamily={stay.rooms.is_family}
      capacity={stay.rooms.capacity}
      ownStayId={stay.id}
      dates={dates}
      initialOrders={orderRows ?? []}
      todayISO={todayISO}
      cutoffHour={settings?.order_cutoff_hour ?? 12}
      cutoffMinute={settings?.order_cutoff_minute ?? 0}
    />
  );
}
