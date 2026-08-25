/**
 * Утилиты для работы с датами по времени отеля (Europe/Copenhagen),
 * независимо от часового пояса браузера гостя — так решили осознанно:
 * дедлайн 12:00 и границы календарных недель всегда считаются по
 * времени отеля в Дании.
 *
 * Без внешних библиотек (date-fns-tz и т.п.) — обходимся Intl API.
 */

const HOTEL_TZ = 'Europe/Copenhagen';

/** 'YYYY-MM-DD' на сегодня по времени Копенгагена. */
export function copenhagenTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HOTEL_TZ }).format(
    new Date()
  );
}

/**
 * Переводит "гражданское" время в конкретной таймзоне в точный момент
 * (UTC-миллисекунды), корректно учитывая летнее/зимнее время (DST).
 * Стандартный трюк без библиотек: дважды форматируем один и тот же
 * UTC-момент, сравниваем со смещением.
 */
function zonedTimeToUtcMs(
  dateISO: string,
  hour: number,
  minute: number,
  timeZone: string
): number {
  const naiveUtc = new Date(
    `${dateISO}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`
  );
  const asIfUtc = new Date(
    naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' })
  );
  const asIfZoned = new Date(
    naiveUtc.toLocaleString('en-US', { timeZone })
  );
  const offsetMs = asIfUtc.getTime() - asIfZoned.getTime();
  return naiveUtc.getTime() + offsetMs;
}

/** Прибавляет/вычитает дни к 'YYYY-MM-DD' (чистая календарная арифметика, без TZ). */
export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Понедельник календарной недели, в которую входит dateISO. */
export function mondayOfWeekISO(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=вс,1=пн,...6=сб
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysISO(dateISO, diff);
}

/**
 * Дедлайн приёма заказов на дату D — 12:00 дня, предшествующего D,
 * по времени Копенгагена. Возвращает UTC-миллисекунды.
 */
export function orderCutoffMs(dateISO: string): number {
  const dayBefore = addDaysISO(dateISO, -1);
  return zonedTimeToUtcMs(dayBefore, 12, 0, HOTEL_TZ);
}

/** Открыт ли ещё приём заказов на dateISO (сравнение с текущим моментом). */
export function isOrderOpen(dateISO: string, nowMs: number = Date.now()): boolean {
  return nowMs < orderCutoffMs(dateISO);
}

/** 14 дат: текущая и следующая календарная неделя, Пн-Вс, выровнено по неделям. */
export function getTwoWeekRange(todayISO: string): string[] {
  const monday = mondayOfWeekISO(todayISO);
  return Array.from({ length: 14 }, (_, i) => addDaysISO(monday, i));
}
