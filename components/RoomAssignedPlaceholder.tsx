import { useTranslations } from 'next-intl';
import SignOutButton from './SignOutButton';

/**
 * Временная заглушка для гостя, которому уже назначили комнату —
 * до тех пор, пока не собран настоящий главный экран с календарём
 * (шаг 3 по плану).
 */
export default function RoomAssignedPlaceholder({
  roomNumber,
}: {
  roomNumber: string | null;
}) {
  const t = useTranslations('root');

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-surface border border-border p-6 text-center space-y-3">
        <p className="text-gold text-xs uppercase tracking-wide">
          {t('stepDone')}
        </p>
        <h1 className="font-display text-2xl text-ink">
          {roomNumber ? t('roomAssigned', { room: roomNumber }) : t('roomAssignedUnknown')}
        </h1>
        <p className="text-ink-muted text-sm">{t('calendarComingSoon')}</p>
        <SignOutButton />
      </div>
    </main>
  );
}
