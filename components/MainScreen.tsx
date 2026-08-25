'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { isOrderOpen, orderCutoffMs } from '@/lib/date/copenhagen';

type MealType = 'breakfast' | 'lunch' | 'dinner';
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

type OrderRow = {
  order_date: string;
  meal_type: MealType;
  stay_id: string;
  issued_at: string | null;
};

type Props = {
  guestName: string;
  roomNumber: string;
  isFamily: boolean;
  capacity: number;
  ownStayId: string;
  dates: string[];
  initialOrders: OrderRow[];
  todayISO: string;
};

export default function MainScreen({
  guestName,
  roomNumber,
  isFamily,
  capacity,
  ownStayId,
  dates,
  initialOrders,
  todayISO,
}: Props) {
  const t = useTranslations('main');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const firstOpen = dates.find((d) => isOrderOpen(d));
    return firstOpen ?? dates[0];
  });
  const [pendingMeal, setPendingMeal] = useState<MealType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekdayKeys = [
    'weekdayMon',
    'weekdayTue',
    'weekdayWed',
    'weekdayThu',
    'weekdayFri',
    'weekdaySat',
    'weekdaySun',
  ] as const;

  function countFor(date: string, meal: MealType): number {
    const rows = orders.filter(
      (o) => o.order_date === date && o.meal_type === meal
    );
    return isFamily ? rows.length : rows.filter((o) => o.stay_id === ownStayId).length;
  }

  function totalFor(date: string): number {
    return MEAL_TYPES.reduce((sum, m) => sum + countFor(date, m), 0);
  }

  const selectedIsOpen = isOrderOpen(selectedDate);

  const deadlineTimeLabel = useMemo(() => {
    const cutoff = orderCutoffMs(selectedDate);
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Copenhagen',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(cutoff));
  }, [selectedDate, locale]);

  async function refetchOrdersForDate(date: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('order_date, meal_type, stay_id, issued_at')
      .eq('order_date', date)
      .is('cancelled_at', null);

    if (error) return;

    setOrders((prev) => [
      ...prev.filter((o) => o.order_date !== date),
      ...((data as OrderRow[]) ?? []),
    ]);
  }

  async function handleAdd(meal: MealType) {
    setError(null);
    setPendingMeal(meal);
    const { error } = await supabase.rpc('guest_add_order', {
      p_date: selectedDate,
      p_meal_type: meal,
    });
    if (error) {
      setError(error.message || t('errorGeneric'));
    } else {
      await refetchOrdersForDate(selectedDate);
    }
    setPendingMeal(null);
  }

  async function handleRemove(meal: MealType) {
    setError(null);
    setPendingMeal(meal);
    const { error } = await supabase.rpc('guest_remove_order', {
      p_date: selectedDate,
      p_meal_type: meal,
    });
    if (error) {
      setError(error.message || t('errorGeneric'));
    } else {
      await refetchOrdersForDate(selectedDate);
    }
    setPendingMeal(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const mealLabels: Record<MealType, string> = {
    breakfast: t('mealBreakfast'),
    lunch: t('mealLunch'),
    dinner: t('mealDinner'),
  };
  const mealIcons: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
  };

  const selectedDateLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(`${selectedDate}T12:00:00Z`));

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex justify-center py-2">
          <Image
            src="/logo/profil-hotels-logo-transparent.png"
            alt=""
            width={160}
            height={118}
            className="w-28 h-auto"
          />
        </div>

        {/* Карточка гостя */}
        <div className="rounded-card bg-surface border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {t('guestLabel')}
            </p>
            <p className="text-ink font-medium">{guestName}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-pill border border-border px-3 py-1.5 text-sm text-ink-muted hover:border-gold hover:text-gold transition-colors"
          >
            {t('signOut')}
          </button>
        </div>

        {/* Карточка комнаты */}
        <div className="rounded-card bg-surface border border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true">🔑</span>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {t('roomLabel')}
              </p>
              <p className="font-display text-xl text-ink">
                {t('roomNumber', { room: roomNumber })}
              </p>
            </div>
          </div>
          {isFamily && (
            <span className="rounded-pill border border-gold text-gold text-xs px-3 py-1 uppercase tracking-wide">
              {t('familyBadge')}
            </span>
          )}
        </div>

        {/* Календарь */}
        <div className="rounded-card bg-surface border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-ink text-sm flex items-center gap-2">
              <span aria-hidden="true">📅</span> {t('chooseDate')}
            </p>
            <p className="text-ink-muted text-xs">
              {t('daysCount', { count: dates.length })}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekdayKeys.map((k) => (
              <span key={k} className="text-[11px] text-ink-muted uppercase">
                {t(k)}
              </span>
            ))}

            {dates.map((date) => {
              const dayNum = Number(date.slice(8, 10));
              const open = isOrderOpen(date);
              const total = totalFor(date);
              const isSelected = date === selectedDate;
              const isToday = date === todayISO;

              let cellClasses =
                'rounded-lg border px-1 py-2 flex flex-col items-center gap-1 transition-colors ';
              if (isSelected) {
                cellClasses += 'border-gold bg-surface-raised ';
              } else if (isToday && open) {
                cellClasses += 'border-open/40 bg-open-bg ';
              } else {
                cellClasses += 'border-border bg-surface hover:border-gold/60 ';
              }
              if (!open) cellClasses += 'opacity-60 ';

              let badgeClasses = 'text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none ';
              if (isSelected) badgeClasses += 'bg-gold text-surface';
              else if (open) badgeClasses += 'bg-open text-surface';
              else badgeClasses += 'bg-warn text-surface';

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={cellClasses}
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

        {/* Заказ на выбранную дату */}
        <div className="rounded-card bg-surface border border-border p-4 space-y-4">
          <div className="text-center space-y-1">
            <p className="text-gold text-xs uppercase tracking-wide">
              {t('addOrderLabel')}
            </p>
            <p className="font-display text-xl text-ink">{selectedDateLabel}</p>
          </div>

          <div className="h-px bg-border" />

          {!selectedIsOpen ? (
            <div className="rounded-lg border border-warn-border bg-warn-bg p-4 text-center space-y-1">
              <p className="text-warn text-sm flex items-center justify-center gap-2">
                <span aria-hidden="true">🕐</span> {t('deadlinePassed')}
              </p>
              <p className="text-ink-muted text-xs">{t('deadlinePassedSub')}</p>
            </div>
          ) : (
            <p className="text-ink-muted text-xs text-center">
              {t('deadlineOpenUntil', { time: deadlineTimeLabel })}
            </p>
          )}

          {error && (
            <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-2">
            {MEAL_TYPES.map((meal) => {
              const count = countFor(selectedDate, meal);
              const max = isFamily ? capacity : 1;
              const canAdd = selectedIsOpen && count < max;
              const canRemove = selectedIsOpen && count > 0;
              const isPending = pendingMeal === meal;

              return (
                <div
                  key={meal}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true">{mealIcons[meal]}</span>
                    <div>
                      <p className="text-ink text-sm">{mealLabels[meal]}</p>
                      {isFamily && (
                        <p className="text-ink-muted text-[11px]">
                          {t('familyCounterHint')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleRemove(meal)}
                      disabled={!canRemove || isPending}
                      className="w-7 h-7 rounded-full border border-border text-ink disabled:opacity-30 hover:border-gold transition-colors"
                    >
                      −
                    </button>
                    <span className="text-ink w-6 text-center tabular-nums">
                      {count}
                      {isFamily && (
                        <span className="text-ink-muted">/{max}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdd(meal)}
                      disabled={!canAdd || isPending}
                      className="w-7 h-7 rounded-full border border-gold text-gold disabled:opacity-30 hover:bg-gold hover:text-surface transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
