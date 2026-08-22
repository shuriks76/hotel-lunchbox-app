import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase-клиент для серверных компонентов и route-обработчиков.
 * Работает через cookies() из next/headers, поэтому знает
 * о сессии текущего пользователя на сервере.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll вызван из Server Component — это нормально,
            // если рядом есть middleware, обновляющий сессию.
          }
        },
      },
    }
  );
}
