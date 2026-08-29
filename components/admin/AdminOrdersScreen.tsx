'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { isOrderOpen } from '@/lib/date/copenhagen';
import ConfirmModal from './ConfirmModal';

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
};

export default function AdminOrdersScreen({ dates, todayISO, initialOrders }: Props) {
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

      const logoUrl = `${window.location.origin}/logo/profil-hotels-logo-white-bg.png`;

      const blob = await pdf(
        <OrdersPdfDocument
          logoUrl={logoUrl}
          dateLabel={selectedDateLabel}
          mealLabels={mealLabels}
          noNameLabel={tAdmin('guestNoName')}
          issuedLabel={t('issuedBadge')}
          groupedByRoom={groupedByRoom}
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
          печати браузера. */}
      <div className="hidden print:block p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/profil-hotels-logo-white-bg.png"
          alt=""
          className="h-16 w-auto mb-4"
        />
        <h1 className="text-xl font-bold mb-6 capitalize">
          {selectedDateLabel}
        </h1>
        {groupedByRoom.map(([roomNumber, items]) => (
          <div key={roomNumber} className="mb-4 break-inside-avoid">
            <p className="font-bold border-b border-black pb-1 mb-1">
              № {roomNumber}
            </p>
            {items
              .sort((a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType))
              .map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-0.5">
                  <span>
                    {mealLabels[item.mealType]} — {item.guestName || tAdmin('guestNoName')}
                  </span>
                  {item.issuedAt && <span>✓ {t('issuedBadge')}</span>}
                </div>
              ))}
          </div>
        ))}
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
            const open = isOrderOpen(date);

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

      {/* Заголовок даты + сводка по типам питания + печать/PDF */}
      <div className="rounded-2xl bg-surface border border-border p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-ink capitalize">
          {selectedDateLabel}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-3 text-sm text-ink-muted">
            {MEAL_TYPES.map((m) => (
              <span key={m} className="flex items-center gap-1">
                <span aria-hidden="true">{mealIcons[m]}</span> {mealTotals[m]}
              </span>
            ))}
          </div>
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
      </div>

      {/* Список по комнатам */}
      {groupedByRoom.length === 0 ? (
        <div className="rounded-2xl bg-surface border border-border p-6 text-center">
          <p className="text-ink-muted text-sm">{t('emptyForDate')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByRoom.map(([roomNumber, items]) => (
            <div
              key={roomNumber}
              className="rounded-2xl bg-surface border border-border p-4 space-y-2"
            >
              <p className="font-display text-base font-semibold text-ink">
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
                        <span className="text-xs px-3 py-1.5 rounded-full bg-open-bg text-open font-medium">
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
