'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

type Mode = 'signIn' | 'signUp';

export default function LoginPage() {
  const t = useTranslations('login');
  const tApp = useTranslations('app');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setInfo(t('checkEmail'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="fixed top-4 right-4 flex gap-1 bg-surface/80 backdrop-blur rounded-full p-1 border border-border">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => router.replace(pathname, { locale: loc })}
            className={
              'px-2.5 py-1 rounded-full text-xs font-medium uppercase transition-colors ' +
              (loc === locale
                ? 'bg-gold text-surface'
                : 'text-ink-muted hover:text-ink')
            }
          >
            {loc}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Логотип — светлая версия на прозрачном фоне, т.к. страница тёмная */}
        <div className="flex flex-col items-center gap-1">
          <Image
            src="/logo/profil-hotels-logo-transparent.png"
            alt={tApp('name')}
            width={220}
            height={162}
            priority
            className="w-40 h-auto"
          />
        </div>

        <div className="rounded-card bg-surface border border-border p-6 space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-2xl text-ink">{t('title')}</h1>
            <p className="text-ink-muted text-sm">{t('subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-pill border border-border bg-surface-raised px-4 py-2.5 text-sm font-medium text-ink hover:border-gold transition-colors flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            {t('googleButton')}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-ink-muted">
              {t('orDivider')}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs uppercase tracking-wide text-ink-muted"
              >
                {t('emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-surface-raised border border-border px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-gold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs uppercase tracking-wide text-ink-muted"
              >
                {t('passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-surface-raised border border-border px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-gold outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-warn bg-warn-bg border border-warn-border rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-open bg-open-bg rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-pill bg-gold text-surface font-medium px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {mode === 'signIn' ? t('signInButton') : t('signUpButton')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError(null);
              setInfo(null);
            }}
            className="w-full text-center text-sm text-ink-muted hover:text-gold transition-colors"
          >
            {mode === 'signIn' ? t('toggleToSignUp') : t('toggleToSignIn')}
          </button>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
