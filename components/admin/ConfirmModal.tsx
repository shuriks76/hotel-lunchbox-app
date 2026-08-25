'use client';

import { useTranslations } from 'next-intl';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Универсальное модальное окно подтверждения. Используется для всех
 * действий, требующих подтверждения по ТЗ: выселение, восстановление,
 * смена комнаты, отметка "выдан", назначение роли.
 */
export default function ConfirmModal({
  open,
  title,
  description,
  children,
  confirmLabel,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const t = useTranslations('admin');
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 space-y-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description && (
            <p className="text-sm text-ink-muted">{description}</p>
          )}
        </div>

        {children}

        {error && (
          <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-medium text-ink-muted hover:bg-surface-raised transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '…' : confirmLabel ?? t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
