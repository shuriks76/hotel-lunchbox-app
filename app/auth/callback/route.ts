import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Колбэк после Google OAuth (и после подтверждения email при
 * email/password регистрации). Supabase редиректит сюда с ?code=...,
 * мы обмениваем код на сессию и уводим человека на главную.
 *
 * Живёт вне [locale], потому что на момент колбэка мы ещё не знаем
 * язык — редиректим на "/", а middleware сам подставит нужную локаль.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
