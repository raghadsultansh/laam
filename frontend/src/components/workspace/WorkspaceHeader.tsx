'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export function WorkspaceHeader() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  // Session header is static right now.
  // Later it should read the workspace id and show the actual attached reports.
  const copy = isArabic
    ? {
        title: 'جلسة: أرامكو 2024 + إس تي سي 2023',
        subtitle: 'اسأل عن تقرير واحد أو قارن بين التقارير المرفقة داخل نفس الجلسة.',
        reports: ['أرامكو 2024', 'إس تي سي 2023'],
        status: 'تقريران مرفقان • المحادثة جاهزة',
      }
    : {
        title: 'Session: Aramco 2024 + STC 2023',
        subtitle: 'Ask about one report or compare attached reports inside the same session.',
        reports: ['Aramco 2024', 'STC 2023'],
        status: '2 reports attached • Chat ready',
      };

  return (
    <div className="px-6 py-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col items-start text-start">
        <h1 className={`text-2xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
          {copy.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>

        <div className="mt-3 flex w-fit max-w-full flex-wrap items-center justify-start gap-2">
          {copy.reports.map((report) => (
            <span key={report} dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)]">
              {report}
            </span>
          ))}
          <span dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)]">
            {copy.status}
          </span>
        </div>
      </div>
    </div>
  );
}
