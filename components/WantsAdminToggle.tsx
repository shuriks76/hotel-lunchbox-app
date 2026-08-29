'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

/**
 * Переключатель "Хочу стать администратором отеля" в профиле гостя.
 * Сам по себе не даёт никаких прав — просто помечает человека как
 * кандидата в списке владельца (раздел "Администраторы"). Финальное
 * назначение роли всё равно только через admin_set_role, владельцем,
 * с подтверждением.
 */
export default function WantsAdminToggle() {
  const t = useTranslations('profile');
  const [supabase] = useState(() => createClient());
  const [checked, setChecked] = useState<boolean | null>(null);
  const [hasActiveStay, setHasActiveStay] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: stay }] = await Promise.all([
        supabase.from('profiles').select('wants_admin').eq('id', user.id).single(),
        supabase
          .from('stays')
          .select('id')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle(),
      ]);

      if (!active) return;
      setChecked(profile?.wants_admin ?? false);
      setHasActiveStay(!!stay);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleToggle() {
    if (checked === null || saving) return;
    const next = !checked;
    setSaving(true);
    setChecked(next); // оптимистично, откатим при ошибке
    const { error } = await supabase.rpc('guest_set_wants_admin', {
      p_wants: next,
    });
    if (error) setChecked(!next);
    setSaving(false);
  }

  if (checked === null || hasActiveStay === null) return <div className="h-16" />;
  if (hasActiveStay) return null;

  return (
    <div className="rounded-card bg-surface border border-border p-4 space-y-1.5">
      <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
        <span className="text-sm text-ink">{t('wantsAdminLabel')}</span>
        <input
          type="checkbox"
          checked={checked}
          disabled={saving}
          onChange={handleToggle}
          className="accent-gold w-5 h-5 shrink-0"
        />
      </label>
      <p className="text-xs text-ink-muted">{t('wantsAdminHint')}</p>
    </div>
  );
}
