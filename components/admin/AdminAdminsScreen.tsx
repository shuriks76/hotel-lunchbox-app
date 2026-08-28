'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import ConfirmModal from './ConfirmModal';

type Role = 'guest' | 'admin' | 'owner';
type ProfileRow = { id: string; full_name: string; role: Role };

type Props = {
  currentUserId: string;
  staff: ProfileRow[];
  guests: ProfileRow[];
};

export default function AdminAdminsScreen({ currentUserId, staff, guests }: Props) {
  const t = useTranslations('adminAdmins');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Модалка смены роли (и для существующих admin/owner, и для повышения гостя)
  const [target, setTarget] = useState<ProfileRow | null>(null);
  const [newRole, setNewRole] = useState<Role>('admin');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Поле повышения гостя
  const [guestInput, setGuestInput] = useState('');

  function findGuestByName(input: string): ProfileRow | null {
    const needle = input.trim().toLowerCase();
    if (!needle) return null;
    return guests.find((g) => g.full_name.trim().toLowerCase() === needle) ?? null;
  }

  function openChangeRole(profile: ProfileRow, suggestedRole: Role) {
    setTarget(profile);
    setNewRole(suggestedRole);
    setError(null);
  }

  async function confirmRoleChange() {
    if (!target) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.rpc('admin_set_role', {
      p_user_id: target.id,
      p_role: newRole,
    });
    if (error) {
      setError(error.message || tAdmin('errorGeneric'));
      setSaving(false);
      return;
    }
    setSaving(false);
    setTarget(null);
    setGuestInput('');
    router.refresh();
  }

  const roleLabels: Record<Role, string> = {
    guest: t('roleGuest'),
    admin: t('roleAdmin'),
    owner: t('roleOwner'),
  };

  return (
    <div className="space-y-6">
      {/* Текущие администраторы/владельцы */}
      <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h2 className="font-semibold text-ink">{t('staffTitle')}</h2>
        <ul className="space-y-2">
          {staff.map((p) => {
            const isSelf = p.id === currentUserId;
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink">
                    {p.full_name || tAdmin('guestNoName')}
                  </span>
                  <span
                    className={
                      'text-[11px] px-2 py-0.5 rounded-full font-medium ' +
                      (p.role === 'owner'
                        ? 'bg-gold-bg text-gold'
                        : 'bg-open-bg text-open')
                    }
                  >
                    {roleLabels[p.role]}
                  </span>
                  {isSelf && (
                    <span className="text-[11px] text-ink-muted">
                      {t('thatsYou')}
                    </span>
                  )}
                </div>
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() =>
                      openChangeRole(p, p.role === 'owner' ? 'admin' : 'guest')
                    }
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-ink-muted hover:border-gold hover:text-gold transition-colors"
                  >
                    {t('changeRoleButton')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Повышение гостя до администратора */}
      <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h2 className="font-semibold text-ink">{t('promoteTitle')}</h2>
        <p className="text-sm text-ink-muted">{t('promoteHint')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            list="guest-names-list"
            value={guestInput}
            onChange={(e) => setGuestInput(e.target.value)}
            placeholder={t('promotePlaceholder')}
            className="flex-1 min-w-[160px] rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          />
          <datalist id="guest-names-list">
            {guests.map((g) => (
              <option key={g.id} value={g.full_name} />
            ))}
          </datalist>
          <button
            type="button"
            disabled={!guestInput.trim()}
            onClick={() => {
              const guest = findGuestByName(guestInput);
              if (!guest) {
                setError(t('guestNotFound'));
                return;
              }
              openChangeRole(guest, 'admin');
            }}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {t('promoteButton')}
          </button>
        </div>
        {error && !target && (
          <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </section>

      <ConfirmModal
        open={!!target}
        title={t('modalTitle')}
        description={
          target
            ? t('modalDescription', { name: target.full_name || tAdmin('guestNoName') })
            : undefined
        }
        loading={saving}
        error={error}
        onConfirm={confirmRoleChange}
        onCancel={() => setTarget(null)}
      >
        <div className="flex gap-2">
          {(['guest', 'admin', 'owner'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setNewRole(r)}
              className={
                'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ' +
                (newRole === r
                  ? 'border-gold bg-gold-bg text-gold'
                  : 'border-border text-ink hover:border-gold/60')
              }
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      </ConfirmModal>
    </div>
  );
}
