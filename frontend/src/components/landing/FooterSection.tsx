'use client';

import Link from 'next/link';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { siteCopy } from '@/lib/site-copy';

export function FooterSection() {
  const { locale, theme } = useAppPreferences();
  const copy     = siteCopy[locale].footer;
  const isArabic = locale === 'ar';

  const logoSrc = theme === 'dark'
    ? `/brand/${isArabic ? 'GP logo dark english name horizontal text right.svg' : 'GP logo dark english name horizontal text left.svg'}`
    : `/brand/${isArabic ? 'GP logo light english name horizontal text right.svg' : 'GP logo light english name horizontal text left.svg'}`;

  return (
    <footer className="border-t border-[var(--border)] bg-[color:var(--card-strong)]/92 backdrop-blur-xl">
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10"
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img src={logoSrc} alt={copy.siteName} className="h-12 w-auto object-contain" />
        </Link>

        {/* Copyright — centred */}
        <p className="text-sm text-[var(--muted-foreground)]">{copy.copyright}</p>

        {/* Nav links */}
        <nav className="flex items-center gap-5 flex-shrink-0">
          <Link
            href="/about"
            className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            {copy.about}
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            {copy.contact}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
