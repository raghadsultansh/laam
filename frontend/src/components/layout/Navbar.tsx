'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Menu, Moon, Sun, X } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { siteCopy } from '@/lib/site-copy';
import { supabase } from '@/lib/supabase';
import { listSessions } from '@/lib/api';

export function Navbar() {
  const { locale, theme, mounted, toggleLocale, toggleTheme } = useAppPreferences();
  const copy = siteCopy[locale];
  const isArabic = locale === 'ar';
  const [userName, setUserName] = useState('');
  const [workspaceHref, setWorkspaceHref] = useState('/reports');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserName(data.user.user_metadata?.full_name || data.user.email || '');
      const sessions = await listSessions().catch(() => []);
      setWorkspaceHref(sessions.length > 0 ? `/workspace/${sessions[0].id}` : '/reports');
    });
  }, []);

  const logoSrc = theme === 'dark'
    ? `/brand/${locale === 'ar' ? 'GP logo dark english name horizontal text right.svg' : 'GP logo dark english name horizontal text left.svg'}`
    : `/brand/${locale === 'ar' ? 'GP logo light english name horizontal text right.svg' : 'GP logo light english name horizontal text left.svg'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--card-strong)]/92 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      {/* ── Main bar ── */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 md:h-20 md:px-6 lg:h-24 lg:gap-6 lg:px-10">

        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center">
            <img
              src={logoSrc}
              alt={copy.nav.siteName}
              className="h-10 w-auto object-contain md:h-14 lg:h-[4.6rem]"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              href="/"
            >
              {copy.nav.home}
            </Link>
            <Link
              className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
              href="/reports"
            >
              {copy.nav.reports}
            </Link>
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 rounded-xl bg-transparent px-2.5 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            <Globe className="h-4 w-4" />
            <span>{locale === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-transparent text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] md:h-11 md:w-11"
            aria-label={copy.nav.themeToggle}
          >
            {mounted
              ? theme === 'dark'
                ? <Sun className="h-4 w-4 md:h-5 md:w-5" />
                : <Moon className="h-4 w-4 md:h-5 md:w-5" />
              : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
          </button>

          {userName ? (
            <>
              <span
                className="hidden text-sm font-medium text-[var(--muted-foreground)] lg:inline"
                dir={isArabic ? 'rtl' : 'ltr'}
              >
                {isArabic ? `مرحبًا، ${userName}` : `Welcome, ${userName}`}
              </span>
              <Link
                href={workspaceHref}
                className="inline-flex rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)] md:px-4 md:py-2.5"
              >
                {isArabic ? 'مساحة العمل' : 'Workspace'}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] md:inline-flex"
              >
                {copy.nav.signIn}
              </Link>
              <Link
                href="/register"
                className="inline-flex rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)] md:px-4 md:py-2.5"
              >
                {copy.nav.tryNow}
              </Link>
            </>
          )}

          {/* Hamburger — hidden on desktop */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="border-t border-[var(--border)] bg-[color:var(--card-strong)]/96 px-4 py-3 lg:hidden"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--foreground)]"
            >
              {copy.nav.home}
            </Link>
            <Link
              href="/reports"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--foreground)]"
            >
              {copy.nav.reports}
            </Link>
            {!userName && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--muted-foreground)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--foreground)]"
              >
                {copy.nav.signIn}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
