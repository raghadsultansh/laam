'use client';

import Link from 'next/link';
import { ArrowRight, Home } from 'lucide-react';
import { LaamLoader } from '@/components/ui/LaamLoader';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

export default function NotFound() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--background)] px-4 text-center"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Loader */}
      <LaamLoader size="large" />

      {/* 404 label */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-semibold uppercase tracking-[0.22em]" style={{ color: '#18a078' }}>
          404
        </span>
        <h1 className="display-heading text-4xl font-bold tracking-tight text-[var(--foreground)] md:text-5xl">
          {isArabic ? 'الصفحة غير موجودة' : 'Page not found'}
        </h1>
        <p className="max-w-sm text-sm leading-7 text-[var(--muted-foreground)]">
          {isArabic
            ? 'يبدو أن هذه الصفحة غير موجودة أو تم نقلها.'
            : "This page doesn't exist or has been moved."}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#18a078,#12705a)', boxShadow: '0 0 24px rgba(18,112,90,0.32)' }}
        >
          <Home className="h-4 w-4" />
          {isArabic ? 'الصفحة الرئيسية' : 'Go home'}
        </Link>
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
        >
          {isArabic ? 'تصفح التقارير' : 'Browse reports'}
          <ArrowRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
        </Link>
      </div>
    </div>
  );
}
