import { createClient } from '@/lib/supabase/server';
import AdminRoomsScreen from '@/components/admin/AdminRoomsScreen';

// Данные меняются каждым действием админа — никакого статического
// кеширования этой страницы, всегда свежий рендер на каждый запрос.
export const dynamic = 'force-dynamic';

type Room = {
  id: string;
  room_number: string;
  capacity: number;
  is_family: boolean;
};

type ActiveStayRow = {
  id: string;
  room_id: string;
  user_id: string;
  checked_in_at: string;
  profiles: { full_name: string }[] | null;
};

type ProfileRow = {
  id: string;
  full_name: string;
};

type ArchivedStayRow = {
  id: string;
  user_id: string;
  checked_out_at: string | null;
  profiles: { full_name: string }[] | null;
  rooms: { room_number: string }[] | null;
};

export default async function AdminRoomsPage() {
  const supabase = createClient();

  const [{ data: rooms }, { data: activeStays }, { data: guestProfiles }, { data: archived }] =
    await Promise.all([
      supabase.from('rooms').select('id, room_number, capacity, is_family').order('room_number'),
      supabase
        .from('stays')
        .select('id, room_id, user_id, checked_in_at, profiles(full_name)')
        .eq('active', true),
      supabase.from('profiles').select('id, full_name').eq('role', 'guest'),
      supabase
        .from('stays')
        .select('id, user_id, checked_out_at, profiles(full_name), rooms(room_number)')
        .eq('active', false)
        .order('checked_out_at', { ascending: false })
        .limit(50),
    ]);

  const typedRooms = (rooms ?? []) as Room[];
  const typedActiveStays = (activeStays ?? []) as ActiveStayRow[];
  const typedGuestProfiles = (guestProfiles ?? []) as ProfileRow[];
  const typedArchived = (archived ?? []) as ArchivedStayRow[];

  const activeUserIds = new Set(typedActiveStays.map((s) => s.user_id));
  const unassigned = typedGuestProfiles.filter((p) => !activeUserIds.has(p.id));

  return (
    <AdminRoomsScreen
      rooms={typedRooms}
      residents={typedActiveStays.map((s) => ({
        stayId: s.id,
        roomId: s.room_id,
        userId: s.user_id,
        fullName: s.profiles?.[0]?.full_name ?? null,
      }))}
      unassigned={unassigned.map((p) => ({ id: p.id, fullName: p.full_name }))}
      archived={typedArchived.map((s) => ({
        stayId: s.id,
        fullName: s.profiles?.[0]?.full_name ?? null,
        roomNumber: s.rooms?.[0]?.room_number ?? null,
        checkedOutAt: s.checked_out_at,
      }))}
    />
  );
}
