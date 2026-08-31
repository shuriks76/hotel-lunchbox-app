'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';

type Props = {
  initialCutoffHour: number;
  initialCutoffMinute: number;
  initialRetentionMonths: number;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function AdminSettingsScreen({
  initialCutoffHour,
  initialCutoffMinute,
  initialRetentionMonths,
}: Props) {
  const t = useTranslations('adminSettings');
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [cutoffHour, setCutoffHour] = useState(initialCutoffHour);
  const [cutoffMinute, setCutoffMinute] = useState(initialCutoffMinute);
  const [retentionMonths, setRetentionMonths] = useState(initialRetentionMonths);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase.rpc('admin_update_settings', {
      p_cutoff_hour: cutoffHour,
      p_cutoff_minute: cutoffMinute,
      p_retention_months: retentionMonths,
    });
    if (error) {
      setError(error.message || t('errorGeneric'));
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-lg">
      <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h2 className="font-semibold text-ink">{t('cutoffTitle')}</h2>
        <p className="text-sm text-ink-muted">{t('cutoffHint')}</p>
        <div className="flex items-center gap-2">
          <select
            value={cutoffHour}
            onChange={(e) => setCutoffHour(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-ink-muted">:</span>
          <select
            value={cutoffMinute}
            onChange={(e) => setCutoffMinute(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
          <span className="text-sm text-ink-muted">{t('cutoffTimezoneNote')}</span>
        </div>
      </section>

      <section className="rounded-2xl bg-surface border border-border p-4 space-y-3">
        <h2 className="font-semibold text-ink">{t('retentionTitle')}</h2>
        <p className="text-sm text-ink-muted">{t('retentionHint')}</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={120}
            value={retentionMonths}
            onChange={(e) => setRetentionMonths(Number(e.target.value))}
            className="w-24 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink"
          />
          <span className="text-sm text-ink-muted">{t('monthsLabel')}</span>
        </div>
      </section>

      {error && (
        <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-open bg-open-bg rounded-lg px-3 py-2">
          {t('savedMessage')}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 rounded-full text-sm font-medium bg-gold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? t('saving') : t('saveButton')}
      </button>
    </div>
  );
}
