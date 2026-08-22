import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSupabaseSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Обновляем сессию Supabase (refresh токена, актуальные cookies).
  const { response: supabaseResponse } = await updateSupabaseSession(request);

  // 2. Прогоняем next-intl роутинг (определение/подстановка локали в путь).
  const intlResponse = intlMiddleware(request);

  // 3. Переносим cookies, выставленные Supabase, в финальный ответ.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
