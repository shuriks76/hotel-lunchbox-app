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

type ProfileRef = { full_name: string } | { full_name: string }[] | null;

function extractFullName(profiles: ProfileRef): string | null {
  if (!profiles) return null;
  if (Array.isArray(profiles)) return profiles[0]?.full_name ?? null;
  return profiles.full_name ?? null;
}

type ActiveStayRow = {
  id: string;
  room_id: string;
  user_id: string;
  checked_in_at: string;
  profiles: ProfileRef;
};

type ProfileRow = {
  id: string;
  full_name: string;
};

type ArchivedStayRow = {
  id: string;
  user_id: string;
  checked_out_at: string | null;
  profiles: ProfileRef;
  rooms: { room_number: string } | { room_number: string }[] | null;
};

function extractRoomNumber(
  rooms: { room_number: string } | { room_number: string }[] | null
): string | null {
  if (!rooms) return null;
  if (Array.isArray(rooms)) return rooms[0]?.room_number ?? null;
  return rooms.room_number ?? null;
}

export default async function AdminRoomsPage() {
  const supabase = createClient();

  const [
    { data: rooms, error: roomsError },
    { data: activeStays, error: activeStaysError },
    { data: guestProfiles, error: guestProfilesError },
    { data: archived, error: archivedError },
    { data: retentionSetting },
  ] = await Promise.all([
    supabase.from('rooms').select('id, room_number, capacity, is_family').order('room_number'),
    supabase
      .from('stays')
      .select('id, room_id, user_id, checked_in_at, profiles!user_id(full_name)')
      .eq('active', true),
    supabase.from('profiles').select('id, full_name').eq('role', 'guest'),
    supabase
      .from('stays')
      .select('id, user_id, checked_out_at, profiles!user_id(full_name), rooms(room_number)')
      .eq('active', false)
      .order('checked_out_at', { ascending: false })
      .limit(50),
    supabase
      .from('settings')
      .select('data_retention_months')
      .eq('id', 1)
      .single(),
  ]);

  const retentionMonths = retentionSetting?.data_retention_months ?? 12;

  const queryErrors = [
    roomsError && `rooms: ${roomsError.message}`,
    activeStaysError && `stays (active): ${activeStaysError.message}`,
    guestProfilesError && `profiles: ${guestProfilesError.message}`,
    archivedError && `stays (archive): ${archivedError.message}`,
  ].filter(Boolean) as string[];

  if (queryErrors.length > 0) {
    // Логируем в серверные логи (видно в Vercel -> Deployments -> Functions/Logs)
    // и одновременно показываем прямо на странице — раньше эти ошибки
    // молча проглатывались, из-за чего было невозможно понять,
    // что именно пошло не так.
    console.error('AdminRoomsPage query errors:', queryErrors);
  }

  const typedRooms = (rooms ?? []) as Room[];
  const typedActiveStays = (activeStays ?? []) as ActiveStayRow[];
  const typedGuestProfiles = (guestProfiles ?? []) as ProfileRow[];
  const typedArchived = (archived ?? []) as ArchivedStayRow[];

  const activeUserIds = new Set(typedActiveStays.map((s) => s.user_id));
  const unassigned = typedGuestProfiles.filter((p) => !activeUserIds.has(p.id));

  return (
    <>
      {queryErrors.length > 0 && (
        <div className="mb-4 rounded-xl border border-warn-border bg-warn-bg text-warn text-sm p-3 space-y-1">
          <p className="font-medium">Ошибка загрузки данных:</p>
          {queryErrors.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}
      <AdminRoomsScreen
        rooms={typedRooms}
        residents={typedActiveStays.map((s) => ({
          stayId: s.id,
          roomId: s.room_id,
          userId: s.user_id,
          fullName: extractFullName(s.profiles),
        }))}
        unassigned={unassigned.map((p) => ({ id: p.id, fullName: p.full_name }))}
        archived={typedArchived.map((s) => ({
          stayId: s.id,
          fullName: extractFullName(s.profiles),
          roomNumber: extractRoomNumber(s.rooms),
          checkedOutAt: s.checked_out_at,
        }))}
        retentionMonths={retentionMonths}
      />
    </>
  );
}
