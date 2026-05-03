'use client';

import Link from 'next/link';
import { Globe, Moon, Sun } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { siteCopy } from '@/lib/site-copy';

export function Navbar() {
  const { locale, theme, mounted, toggleLocale, toggleTheme } = useAppPreferences();
  const copy = siteCopy[locale];
  // Logo files are named by the mode they should be used in.
  // Arabic uses the text-right lockup, English uses text-left.
  const logoSrc = theme === 'dark'
    ? `/brand/${locale === 'ar' ? 'GP logo dark english name horizontal text right.svg' : 'GP logo dark english name horizontal text left.svg'}`
    : `/brand/${locale === 'ar' ? 'GP logo light english name horizontal text right.svg' : 'GP logo light english name horizontal text left.svg'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color:var(--card-strong)]/92 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoSrc} alt={copy.nav.siteName} className="h-16 w-auto object-contain md:h-[4.6rem]" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]" href="#hero">
              {copy.nav.home}
            </Link>
            <Link className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]" href="/reports">
              {copy.nav.reports}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLocale}
            className="inline-flex items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            <Globe className="h-4 w-4" />
            <span>{locale === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-transparent text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            aria-label={copy.nav.themeToggle}
          >
            {mounted ? theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] md:inline-flex"
          >
            {copy.nav.signIn}
          </Link>

          <Link
            href="/register"
            className="inline-flex rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]"
          >
            {copy.nav.tryNow}
          </Link>
        </div>
      </div>
    </header>
  );
}
