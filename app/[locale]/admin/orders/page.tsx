import { createClient } from '@/lib/supabase/server';
import AdminOrdersScreen from '@/components/admin/AdminOrdersScreen';
import { copenhagenTodayISO, getTwoWeekRange } from '@/lib/date/copenhagen';

export const dynamic = 'force-dynamic';

type MealType = 'breakfast' | 'lunch' | 'dinner';

type OneOrMany<T> = T | T[] | null;

function one<T>(value: OneOrMany<T>): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type RawOrderRow = {
  id: string;
  order_date: string;
  meal_type: MealType;
  issued_at: string | null;
  stay_id: string;
  stays: OneOrMany<{
    room_id: string;
    rooms: OneOrMany<{ room_number: string }>;
    profiles: OneOrMany<{ full_name: string }>;
  }>;
};

export default async function AdminOrdersPage() {
  const supabase = createClient();

  const todayISO = copenhagenTodayISO();
  const dates = getTwoWeekRange(todayISO);

  const [{ data, error }, { count: totalResidents }] = await Promise.all([
    supabase
      .from('orders')
      .select(
        'id, order_date, meal_type, issued_at, stay_id, stays(room_id, rooms(room_number), profiles!user_id(full_name))'
      )
      .gte('order_date', dates[0])
      .lte('order_date', dates[dates.length - 1])
      .is('cancelled_at', null)
      .order('order_date'),
    supabase.from('stays').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  if (error) {
    console.error('AdminOrdersPage query error:', error.message);
  }

  const rows = (data ?? []) as RawOrderRow[];

  const orders = rows.map((row) => {
    const stay = one(row.stays);
    const room = stay ? one(stay.rooms) : null;
    const profile = stay ? one(stay.profiles) : null;
    return {
      id: row.id,
      orderDate: row.order_date,
      mealType: row.meal_type,
      issuedAt: row.issued_at,
      roomNumber: room?.room_number ?? '—',
      guestName: profile?.full_name ?? null,
    };
  });

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-warn-border bg-warn-bg text-warn text-sm p-3">
          Ошибка загрузки данных: {error.message}
        </div>
      )}
      <AdminOrdersScreen
        dates={dates}
        todayISO={todayISO}
        initialOrders={orders}
        totalResidents={totalResidents ?? 0}
      />
    </>
  );
}
