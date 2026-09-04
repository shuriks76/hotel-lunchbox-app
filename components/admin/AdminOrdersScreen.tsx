'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { isOrderOpen } from '@/lib/date/copenhagen';
import ConfirmModal from './ConfirmModal';
import MealRing from './MealRing';

type MealType = 'breakfast' | 'lunch' | 'dinner';
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

type OrderItem = {
  id: string;
  orderDate: string;
  mealType: MealType;
  issuedAt: string | null;
  roomNumber: string;
  guestName: string | null;
};

type Props = {
  dates: string[];
  todayISO: string;
  initialOrders: OrderItem[];
  totalResidents: number;
  cutoffHour: number;
  cutoffMinute: number;
};

export default function AdminOrdersScreen({
  dates,
  todayISO,
  initialOrders,
  totalResidents,
  cutoffHour,
  cutoffMinute,
}: Props) {
  const t = useTranslations('adminOrders');
  const tAdmin = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [selectedDate, setSelectedDate] = useState<string>(
    dates.includes(todayISO) ? todayISO : dates[0]
  );

  // Живое обновление: как только гость добавляет/убирает заказ (или другой
  // администратор отмечает выдачу), пересчитываем список — без перезагрузки
  // страницы. Пересобираем данные через router.refresh() (а не патчим
  // локальный state вручную), т.к. только сервер знает имя гостя и номер
  // комнаты — Realtime присылает только сырые колонки таблицы orders.
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const [issueTarget, setIssueTarget] = useState<OrderItem | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const weekdayKeys = [
    'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu',
    'weekdayFri', 'weekdaySat', 'weekdaySun',
  ] as const;

  const totalsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of initialOrders) {
      map.set(o.orderDate, (map.get(o.orderDate) ?? 0) + 1);
    }
    return map;
  }, [initialOrders]);

  const ordersForDate = useMemo(
    () => initialOrders.filter((o) => o.orderDate === selectedDate),
    [initialOrders, selectedDate]
  );

  const mealTotals = useMemo(() => {
    const totals: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const o of ordersForDate) totals[o.mealType]++;
    return totals;
  }, [ordersForDate]);

  const groupedByRoom = useMemo(() => {
    const map = new Map<string, OrderItem[]>();
    for (const o of ordersForDate) {
      const list = map.get(o.roomNumber) ?? [];
      list.push(o);
      map.set(o.roomNumber, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  }, [ordersForDate]);

  // Фильтр по номеру комнаты — только для отображения на экране.
  // Печать и PDF всегда показывают все комнаты за выбранную дату
  // целиком, независимо от того, что сейчас введено в поиске.
  const [roomFilter, setRoomFilter] = useState('');
  const visibleGroupedByRoom = useMemo(() => {
    const needle = roomFilter.trim().toLowerCase();
    if (!needle) return groupedByRoom;
    return groupedByRoom.filter(([roomNumber]) =>
      roomNumber.toLowerCase().includes(needle)
    );
  }, [groupedByRoom, roomFilter]);

  // Таблицы по этажам — для печати и PDF. Этаж = первая цифра номера
  // комнаты (комнаты 201-225 -> этаж 2, и т.д.), так и подтвердили —
  // отдельного поля "этаж" в базе нет и не нужно.
  const floorTables = useMemo(() => {
    type RoomRow = {
      roomNumber: string;
      namesLabel: string;
      counts: Record<MealType, number>;
    };

    const byRoom = new Map<string, OrderItem[]>();
    for (const o of ordersForDate) {
      const list = byRoom.get(o.roomNumber) ?? [];
      list.push(o);
      byRoom.set(o.roomNumber, list);
    }

    const rows: RoomRow[] = Array.from(byRoom.entries()).map(
      ([roomNumber, items]) => {
        const names = Array.from(
          new Set(items.map((i) => i.guestName || tAdmin('guestNoName')))
        );
        const counts: Record<MealType, number> = {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        };
        for (const i of items) counts[i.mealType]++;
        return { roomNumber, namesLabel: names.join(', '), counts };
      }
    );

    const byFloor = new Map<string, RoomRow[]>();
    for (const row of rows) {
      const floor = row.roomNumber.trim().charAt(0) || '?';
      const list = byFloor.get(floor) ?? [];
      list.push(row);
      byFloor.set(floor, list);
    }
    for (const list of byFloor.values()) {
      list.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'ru', { numeric: true }));
    }

    return Array.from(byFloor.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'ru', { numeric: true }))
      .map(([floor, rows]) => ({ floor, rows }));
  }, [ordersForDate, tAdmin]);

  // Распределяем этажи по 2 колонкам для печати/PDF — не строго один
  // этаж на колонку, а сбалансированно по числу строк, чтобы обе
  // колонки получались примерно одинаковой высоты. Этажи внутри
  // колонки идут подряд, каждый как отдельный блок-разделитель.
  const printColumns = useMemo(() => {
    const columnCount = 2;
    const totalRows = floorTables.reduce((sum, f) => sum + f.rows.length, 0);
    const target = totalRows / columnCount;
    const columns: typeof floorTables[] = Array.from({ length: columnCount }, () => []);
    let colIndex = 0;
    let accInCol = 0;
    for (const ft of floorTables) {
      columns[colIndex].push(ft);
      accInCol += ft.rows.length;
      if (accInCol >= target && colIndex < columnCount - 1) {
        colIndex++;
        accInCol = 0;
      }
    }
    return columns;
  }, [floorTables]);

  const mealLabels: Record<MealType, string> = {
    breakfast: t('mealBreakfast'),
    lunch: t('mealLunch'),
    dinner: t('mealDinner'),
  };
  const mealIcons: Record<MealType, string> = {
    breakfast: '🌅', lunch: '☀️', dinner: '🌙',
  };

  const selectedDateLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Copenhagen',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date(`${selectedDate}T12:00:00Z`));

  async function confirmIssue() {
    if (!issueTarget) return;
    setIssuing(true);
    setIssueError(null);
    const { error } = await supabase.rpc('admin_issue_order', {
      p_order_id: issueTarget.id,
    });
    if (error) {
      setIssueError(error.message || tAdmin('errorGeneric'));
      setIssuing(false);
      return;
    }
    setIssuing(false);
    setIssueTarget(null);
    router.refresh();
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      // Динамический импорт — react-pdf/renderer довольно тяжёлая
      // библиотека, незачем грузить её в общий бандл страницы, если
      // человек ни разу не нажмёт "Скачать PDF".
      const [{ pdf }, { default: OrdersPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./OrdersPdfDocument'),
      ]);

      const blob = await pdf(
        <OrdersPdfDocument
          dateLabel={selectedDateLabel}
          mealLabels={mealLabels}
          floorLabel={t('floorLabel')}
          printColumns={printColumns}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lunchbox-orders-${selectedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <>
      {/* Печатная версия — видна только при печати (window.print() /
          "Сохранить как PDF" из диалога печати браузера), на экране
          скрыта. Отдельно от неё есть кнопка "Скачать PDF" ниже —
          та генерирует файл через react-pdf/renderer, без диалога
          печати браузера. Таблицы по этажам, по 3 в ширину — для
          экономии бумаги. Без логотипов, простой заголовок. */}
      <div className="hidden print:block p-6">
        <h1 className="text-lg font-bold mb-4 capitalize">
          {selectedDateLabel}
        </h1>
        <div className="grid grid-cols-2 gap-6">
          {printColumns.map((column, colIdx) => (
            <div key={colIdx} className="space-y-3">
              {column.map(({ floor, rows }) => (
                <table
                  key={floor}
                  className="w-full text-[9px] border-collapse break-inside-avoid"
                >
                  <thead>
                    <tr>
                      <th
                        colSpan={4}
                        className="text-left font-bold border-b-2 border-black pb-1 text-[10px]"
                      >
                        {t('floorLabel')} {floor}
                      </th>
                    </tr>
                    <tr className="border-b border-black">
                      <th className="text-left py-0.5 pr-1">№</th>
                      <th className="text-center py-0.5 px-0.5">🌅</th>
                      <th className="text-center py-0.5 px-0.5">☀️</th>
                      <th className="text-center py-0.5 px-0.5">🌙</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.roomNumber} className="border-b border-gray-300">
                        <td className="py-0.5 pr-1 align-top">
                          <div className="font-semibold">{row.roomNumber}</div>
                          <div className="text-[8px] text-gray-600 leading-tight">
                            {row.namesLabel}
                          </div>
                        </td>
                        <td className="text-center py-0.5 px-0.5 align-top">
                          {row.counts.breakfast}
                        </td>
                        <td className="text-center py-0.5 px-0.5 align-top">
                          {row.counts.lunch}
                        </td>
                        <td className="text-center py-0.5 px-0.5 align-top">
                          {row.counts.dinner}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 print:hidden">
      {/* Календарь */}
      <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdayKeys.map((k) => (
            <span key={k} className="text-[11px] text-ink-muted uppercase">
              {t(k)}
            </span>
          ))}

          {dates.map((date) => {
            const dayNum = Number(date.slice(8, 10));
            const total = totalsByDate.get(date) ?? 0;
            const isSelected = date === selectedDate;
            const isToday = date === todayISO;
            const open = isOrderOpen(date, cutoffHour, cutoffMinute);

            let cellClasses =
              'rounded-lg border px-1 py-2 flex flex-col items-center gap-1 transition-colors ';
            if (isSelected) cellClasses += 'border-gold bg-gold-bg ';
            else if (isToday) cellClasses += 'border-open/40 bg-open-bg ';
            else cellClasses += 'border-border bg-surface-raised hover:border-gold/60 ';

            let badgeClasses =
              'text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none ';
            badgeClasses += isSelected ? 'bg-gold text-white' : 'bg-ink-muted text-white';

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cellClasses}
                title={open ? undefined : t('closedHint')}
              >
                <span className="text-sm text-ink">{dayNum}</span>
                {total > 0 ? (
                  <span className={badgeClasses}>{total}</span>
                ) : (
                  <span className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Заголовок даты + печать/PDF */}
      <div className="rounded-2xl bg-surface border border-border p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-ink capitalize">
          {selectedDateLabel}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            disabled={groupedByRoom.length === 0}
            className="text-xs px-3 py-1.5 rounded-full border border-border text-ink-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            {t('printButton')}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={groupedByRoom.length === 0 || generatingPdf}
            className="text-xs px-3 py-1.5 rounded-full bg-gold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {generatingPdf ? t('generatingPdf') : t('downloadPdfButton')}
          </button>
        </div>
      </div>

      {/* Круговая сводка — сколько заказано каждого типа питания, в
          процентах от всех текущих жильцов отеля */}
      <div className="rounded-2xl bg-surface border border-border p-4 flex justify-center gap-6 sm:gap-10">
        {MEAL_TYPES.map((m) => (
          <MealRing
            key={m}
            icon={mealIcons[m]}
            label={mealLabels[m]}
            count={mealTotals[m]}
            percent={totalResidents > 0 ? (mealTotals[m] / totalResidents) * 100 : 0}
            color={m === 'breakfast' ? 'gold' : m === 'lunch' ? 'open' : 'warn'}
          />
        ))}
      </div>

      {/* Фильтр по номеру комнаты — на экране, не влияет на печать/PDF */}
      {groupedByRoom.length > 0 && (
        <div className="rounded-2xl bg-surface border border-border p-4">
          <input
            type="text"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            placeholder={t('roomFilterPlaceholder')}
            className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          />
        </div>
      )}

      {/* Список по комнатам */}
      {groupedByRoom.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-border p-6 text-center">
          <p className="text-ink-muted text-sm">{t('emptyForDate')}</p>
        </div>
      ) : visibleGroupedByRoom.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-border p-6 text-center">
          <p className="text-ink-muted text-sm">{t('roomFilterEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroupedByRoom.map(([roomNumber, items]) => (
            <div
              key={roomNumber}
              className="rounded-2xl bg-surface border border-border p-4 space-y-2"
            >
              <p className="font-display text-2xl font-semibold text-ink">
                № {roomNumber}
              </p>
              <ul className="space-y-2">
                {items
                  .sort((a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType))
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true">{mealIcons[item.mealType]}</span>
                        <div>
                          <p className="text-sm text-ink">
                            {mealLabels[item.mealType]}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {item.guestName || tAdmin('guestNoName')}
                          </p>
                        </div>
                      </div>

                      {item.issuedAt ? (
                        <span className="animate-pop-in text-xs px-3 py-1.5 rounded-full bg-open-bg text-open font-medium">
                          {t('issuedBadge')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIssueTarget(item);
                            setIssueError(null);
                          }}
                          className="text-xs px-3 py-1.5 rounded-full bg-gold text-white hover:opacity-90 transition-opacity"
                        >
                          {t('issueButton')}
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!issueTarget}
        title={t('issueModalTitle')}
        description={
          issueTarget
            ? t('issueModalDescription', {
                meal: mealLabels[issueTarget.mealType],
                room: issueTarget.roomNumber,
              })
            : undefined
        }
        loading={issuing}
        error={issueError}
        onConfirm={confirmIssue}
        onCancel={() => setIssueTarget(null)}
      />
      </div>
    </>
  );
}
