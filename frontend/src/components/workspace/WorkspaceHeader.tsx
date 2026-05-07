'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export function WorkspaceHeader({
  title,
  reportLabel,
}: {
  title?: string;
  reportLabel?: string;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const displayTitle = title ?? (isArabic ? 'جلسة جديدة' : 'New Session');
  const displaySub = isArabic
    ? 'اسأل عن التقرير المرفق بهذه الجلسة.'
    : 'Ask questions about the report attached to this session.';

  return (
    <div className="px-6 py-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col items-start text-start">
        <h1 className={`text-2xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
          {displayTitle}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{displaySub}</p>

        {reportLabel ? (
          <div className="mt-3 flex w-fit max-w-full flex-wrap items-center justify-start gap-2">
            <span dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand)]">
              {reportLabel}
            </span>
            <span dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)]">
              {isArabic ? 'المحادثة جاهزة' : 'Chat ready'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
