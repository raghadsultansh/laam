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
        className="mx-auto max-w-[1440px] px-6 py-6 lg:px-10"
      >
        {/* Mobile: stacked · Desktop: single row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link href="/" className="flex-shrink-0">
            <img src={logoSrc} alt={copy.siteName} className="h-10 w-auto object-contain md:h-12" />
          </Link>

          <p className="text-center text-sm text-[var(--muted-foreground)]">{copy.copyright}</p>

          <nav className="flex items-center gap-5 flex-shrink-0">
            <Link
              href="/about"
              className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              {copy.about}
            </Link>
            <Link
              href="/about#contact"
              className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              {copy.contact}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
