import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
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
      global: {
        // Next.js по умолчанию может закешировать fetch-запросы (Data Cache),
        // из-за чего данные "залипают" даже после обычного обновления
        // страницы (F5) — это не браузерный кеш, обычный reload его не
        // сбрасывает. Явно отключаем кеш для всех запросов к Supabase.
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}
