import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Временная корневая страница — шаг 1.
 * Дальше здесь появится развилка: не заселён -> "ждите ресепшен",
 * заселён -> главный экран с календарём, admin/owner -> редирект в /admin.
 * Пока просто: не вошёл -> /login, вошёл -> заглушка с кнопкой "Выйти".
 */
export default async function RootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/login', locale });
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-surface border border-border p-6 text-center space-y-3">
        <p className="text-ink-muted text-sm uppercase tracking-wide">
          Шаг 1 готов
        </p>
        <h1 className="font-display text-2xl text-ink">
          Вход работает, {user!.email}
        </h1>
        <p className="text-ink-muted text-sm">
          Дальше соберём экран ожидания заселения и главный экран с
          календарём.
        </p>
      </div>
    </main>
  );
}
