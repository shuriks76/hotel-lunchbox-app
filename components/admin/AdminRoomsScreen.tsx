'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import ConfirmModal from './ConfirmModal';

type RoomT = {
  id: string;
  room_number: string;
  capacity: number;
  is_family: boolean;
};
type Resident = {
  stayId: string;
  roomId: string;
  userId: string;
  fullName: string | null;
};
type UnassignedGuest = { id: string; fullName: string | null };
type ArchivedEntry = {
  stayId: string;
  fullName: string | null;
  roomNumber: string | null;
  checkedOutAt: string | null;
};

type Props = {
  rooms: RoomT[];
  residents: Resident[];
  unassigned: UnassignedGuest[];
  archived: ArchivedEntry[];
};

type Tab = 'rooms' | 'archive';

export default function AdminRoomsScreen({
  rooms,
  residents,
  unassigned,
  archived,
}: Props) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<Tab>('rooms');
  const [error, setError] = useState<string | null>(null);

  // Заселение незаселённых гостей
  const [assignInput, setAssignInput] = useState<Record<string, string>>({});
  const [assigningGuestId, setAssigningGuestId] = useState<string | null>(null);

  // Модалка "сменить комнату"
  const [changeRoomFor, setChangeRoomFor] = useState<Resident | null>(null);
  const [newRoomInput, setNewRoomInput] = useState<string>('');
  const [changingRoom, setChangingRoom] = useState(false);
  const [changeRoomError, setChangeRoomError] = useState<string | null>(null);

  // Модалка "выселить"
  const [checkoutFor, setCheckoutFor] = useState<Resident | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Модалка "восстановить"
  const [restoreFor, setRestoreFor] = useState<ArchivedEntry | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Переключатель "семейная"
  const [togglingRoomId, setTogglingRoomId] = useState<string | null>(null);

  const residentsByRoom = useMemo(() => {
    const map = new Map<string, Resident[]>();
    for (const r of residents) {
      const list = map.get(r.roomId) ?? [];
      list.push(r);
      map.set(r.roomId, list);
    }
    return map;
  }, [residents]);

  function roomHasFreeSlot(room: RoomT) {
    return (residentsByRoom.get(room.id)?.length ?? 0) < room.capacity;
  }

  function findRoomByNumber(input: string, excludeRoomId?: string) {
    const needle = input.trim().toLowerCase();
    if (!needle) return null;
    return (
      rooms.find(
        (room) =>
          room.room_number.trim().toLowerCase() === needle &&
          room.id !== excludeRoomId &&
          roomHasFreeSlot(room)
      ) ?? null
    );
  }

  async function handleAssign(guestId: string) {
    const room = findRoomByNumber(assignInput[guestId] ?? '');
    if (!room) {
      setError(t('roomNotFound'));
      return;
    }
    setAssigningGuestId(guestId);
    setError(null);
    const { error } = await supabase.rpc('admin_assign_room', {
      p_user_id: guestId,
      p_room_id: room.id,
    });
    if (error) {
      setError(error.message || t('errorGeneric'));
    } else {
      setAssignInput((prev) => ({ ...prev, [guestId]: '' }));
      router.refresh();
    }
    setAssigningGuestId(null);
  }

  async function handleToggleFamily(room: RoomT, checked: boolean) {
    setTogglingRoomId(room.id);
    const { error } = await supabase.rpc('admin_set_room_family', {
      p_room_id: room.id,
      p_is_family: checked,
    });
    if (error) setError(error.message || t('errorGeneric'));
    else router.refresh();
    setTogglingRoomId(null);
  }

  async function confirmChangeRoom() {
    if (!changeRoomFor) return;
    const room = findRoomByNumber(newRoomInput, changeRoomFor.roomId);
    if (!room) {
      setChangeRoomError(t('roomNotFound'));
      return;
    }
    setChangingRoom(true);
    setChangeRoomError(null);
    const { error } = await supabase.rpc('admin_change_room', {
      p_stay_id: changeRoomFor.stayId,
      p_new_room_id: room.id,
    });
    if (error) {
      setChangeRoomError(error.message || t('errorGeneric'));
      setChangingRoom(false);
      return;
    }
    setChangingRoom(false);
    setChangeRoomFor(null);
    setNewRoomInput('');
    router.refresh();
  }

  async function confirmCheckout() {
    if (!checkoutFor) return;
    setCheckingOut(true);
    setCheckoutError(null);
    const { error } = await supabase.rpc('admin_checkout_stay', {
      p_stay_id: checkoutFor.stayId,
    });
    if (error) {
      setCheckoutError(error.message || t('errorGeneric'));
      setCheckingOut(false);
      return;
    }
    setCheckingOut(false);
    setCheckoutFor(null);
    router.refresh();
  }

  async function confirmRestore() {
    if (!restoreFor) return;
    setRestoring(true);
    setRestoreError(null);
    const { error } = await supabase.rpc('admin_restore_stay', {
      p_stay_id: restoreFor.stayId,
    });
    if (error) {
      setRestoreError(error.message || t('errorGeneric'));
      setRestoring(false);
      return;
    }
    setRestoring(false);
    setRestoreFor(null);
    router.refresh();
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  }

  return (
    <div className="space-y-6">
      {/* Переключатель вкладок Комнаты / Архив */}
      <div className="flex gap-1 bg-surface-raised rounded-full p-1 w-fit">
        {(['rooms', 'archive'] as Tab[]).map((tb) => (
          <button
            key={tb}
            type="button"
            onClick={() => setTab(tb)}
            className={
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' +
              (tab === tb
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink')
            }
          >
            {tb === 'rooms' ? t('roomsTab') : t('archiveTab')}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {tab === 'rooms' && (
        <div className="space-y-6">
          {/* Незаселённые гости */}
          <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
            <h2 className="font-semibold text-ink">{t('unassignedTitle')}</h2>
            {unassigned.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('unassignedEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {unassigned.map((guest) => (
                  <li
                    key={guest.id}
                    className="flex flex-wrap items-center gap-2 justify-between rounded-xl bg-surface-raised px-3 py-2.5"
                  >
                    <span className="text-ink text-sm">
                      {guest.fullName || t('guestNoName')}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        list="free-rooms-list"
                        value={assignInput[guest.id] ?? ''}
                        onChange={(e) =>
                          setAssignInput((prev) => ({
                            ...prev,
                            [guest.id]: e.target.value,
                          }))
                        }
                        placeholder={t('assignRoomPlaceholder')}
                        className="w-28 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink"
                      />
                      <button
                        type="button"
                        disabled={
                          !assignInput[guest.id] ||
                          assigningGuestId === guest.id
                        }
                        onClick={() => handleAssign(guest.id)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-gold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        {t('assignButton')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Комнаты */}
          <section className="space-y-3">
            <h2 className="font-semibold text-ink">{t('roomsTitle')}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {rooms.map((room) => {
                const roomResidents = residentsByRoom.get(room.id) ?? [];
                return (
                  <div
                    key={room.id}
                    className="rounded-2xl bg-surface border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display text-lg font-semibold text-ink">
                          № {room.room_number}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {t('roomCapacity', { count: room.capacity })}
                        </p>
                      </div>
                      {room.capacity > 1 && (
                        <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
                          {t('familyToggleLabel')}
                          <input
                            type="checkbox"
                            checked={room.is_family}
                            disabled={togglingRoomId === room.id}
                            onChange={(e) =>
                              handleToggleFamily(room, e.target.checked)
                            }
                            className="accent-gold w-4 h-4"
                          />
                        </label>
                      )}
                    </div>

                    {roomResidents.length === 0 ? (
                      <p className="text-sm text-ink-muted">
                        {t('residentsEmpty')}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {roomResidents.map((res) => (
                          <li
                            key={res.stayId}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2"
                          >
                            <span className="text-sm text-ink">
                              {res.fullName || t('guestNoName')}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setChangeRoomFor(res);
                                  setNewRoomId('');
                                  setChangeRoomError(null);
                                }}
                                className="text-xs px-2.5 py-1 rounded-full border border-border text-ink-muted hover:border-gold hover:text-gold transition-colors"
                              >
                                {t('changeRoomButton')}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCheckoutFor(res);
                                  setCheckoutError(null);
                                }}
                                className="text-xs px-2.5 py-1 rounded-full border border-warn-border text-warn hover:bg-warn-bg transition-colors"
                              >
                                {t('checkoutButton')}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {tab === 'archive' && (
        <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
          {archived.length === 0 ? (
            <p className="text-sm text-ink-muted">{t('archiveEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {archived.map((entry) => (
                <li
                  key={entry.stayId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm text-ink">
                      {entry.fullName || t('guestNoName')}{' '}
                      <span className="text-ink-muted">
                        № {entry.roomNumber ?? '—'}
                      </span>
                    </p>
                    <p className="text-xs text-ink-muted">
                      {t('checkedOutOn', {
                        date: formatDate(entry.checkedOutAt),
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreFor(entry);
                      setRestoreError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-gold text-white hover:opacity-90 transition-opacity"
                  >
                    {t('restoreButton')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Модалка: сменить комнату */}
      <ConfirmModal
        open={!!changeRoomFor}
        title={t('changeRoomModalTitle')}
        description={t('changeRoomModalWarning')}
        loading={changingRoom}
        error={changeRoomError}
        confirmLabel={t('confirm')}
        onConfirm={confirmChangeRoom}
        onCancel={() => setChangeRoomFor(null)}
      >
        <input
          type="text"
          list="free-rooms-list"
          value={newRoomInput}
          onChange={(e) => setNewRoomInput(e.target.value)}
          placeholder={t('changeRoomModalSelectLabel')}
          className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
        />
      </ConfirmModal>

      {/* Общий список подсказок для полей ввода номера комнаты — переиспользуется
          и при заселении, и при смене комнаты (текущая комната жильца туда не
          попадает, т.к. фильтруем по roomHasFreeSlot вместе с исключением ниже). */}
      <datalist id="free-rooms-list">
        {rooms
          .filter(
            (room) =>
              room.id !== changeRoomFor?.roomId && roomHasFreeSlot(room)
          )
          .map((room) => (
            <option key={room.id} value={room.room_number} />
          ))}
      </datalist>

      {/* Модалка: выселить */}
      <ConfirmModal
        open={!!checkoutFor}
        title={t('checkoutModalTitle')}
        description={t('checkoutModalWarning')}
        loading={checkingOut}
        error={checkoutError}
        onConfirm={confirmCheckout}
        onCancel={() => setCheckoutFor(null)}
      />

      {/* Модалка: восстановить */}
      <ConfirmModal
        open={!!restoreFor}
        title={t('restoreModalTitle')}
        description={t('restoreModalDescription')}
        loading={restoring}
        error={restoreError}
        onConfirm={confirmRestore}
        onCancel={() => setRestoreFor(null)}
      />
    </div>
  );
}
