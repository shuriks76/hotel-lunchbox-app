'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase-клиент для использования в клиентских компонентах
 * ('use client'). Читает публичные переменные окружения.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
