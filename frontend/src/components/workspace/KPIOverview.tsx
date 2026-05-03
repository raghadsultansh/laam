'use client';

import { useState } from 'react';
import { BarChart3, Maximize2, X } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

const dashboardData = {
  en: [
    {
      title: 'Aramco Annual Report 2024',
      stats: [
        { label: 'Revenue', value: '$482B' },
        { label: 'Net Income', value: '$121B' },
        { label: 'Assets', value: '$660B' },
        { label: 'Cash Flow', value: '$135B' },
      ],
      highlights: ['Strong revenue scale across core operations', 'High absolute profitability', 'Energy-sector exposure remains central'],
    },
    {
      title: 'STC Annual Report 2023',
      stats: [
        { label: 'Revenue', value: '$19.7B' },
        { label: 'Net Income', value: '$3.4B' },
        { label: 'Assets', value: '$35B' },
        { label: 'Subscribers', value: '26M+' },
      ],
      highlights: ['Service-led revenue profile', 'Stable telecom cash generation', 'Digital-platform growth remains important'],
    },
  ],
  ar: [
    {
      title: 'لوحة أرامكو السنوية 2024',
      stats: [
        { label: 'الإيرادات', value: '$482B' },
        { label: 'صافي الدخل', value: '$121B' },
        { label: 'الأصول', value: '$660B' },
        { label: 'التدفق النقدي', value: '$135B' },
      ],
      highlights: ['حجم إيرادات قوي عبر العمليات الأساسية', 'ربحية مرتفعة على مستوى التقرير', 'يبقى التعرض لقطاع الطاقة عاملا رئيسيا'],
    },
    {
      title: 'لوحة إس تي سي السنوية 2023',
      stats: [
        { label: 'الإيرادات', value: '$19.7B' },
        { label: 'صافي الدخل', value: '$3.4B' },
        { label: 'الأصول', value: '$35B' },
        { label: 'المشتركون', value: '26M+' },
      ],
      highlights: ['نموذج إيرادات قائم على الخدمات', 'تدفقات نقدية مستقرة في قطاع الاتصالات', 'يبقى نمو المنصات الرقمية عنصرا مهما'],
    },
  ],
};

type DashboardReport = (typeof dashboardData.en)[number];

// One block = one report dashboard.
// When backend dashboard generation is ready, keep this shape and replace dashboardData.
function DashboardBlock({
  report,
  isArabic,
  isFullscreen = false,
  onOpenFullscreen,
}: {
  report: DashboardReport;
  isArabic: boolean;
  isFullscreen?: boolean;
  onOpenFullscreen?: () => void;
}) {
  return (
    <section dir={isArabic ? 'rtl' : 'ltr'} className={`rounded-[1.8rem] border border-[var(--border)] bg-[var(--card-strong)] p-5 shadow-[var(--shadow-md)] ${isFullscreen ? 'min-h-full' : ''}`}>
      <div className="flex items-start justify-between gap-4 text-start">
        <div>
          <p className="text-sm font-semibold text-[var(--brand)]">
            {isArabic ? 'لوحة تقرير' : 'Report Dashboard'}
          </p>
          <h2 className={`mt-2 text-2xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
            {report.title}
          </h2>
        </div>

        {onOpenFullscreen ? (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="inline-flex shrink-0 items-center gap-2 rounded-[1rem] bg-[var(--background)] px-3.5 py-2 text-xs font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)]"
          >
            <Maximize2 className="h-4 w-4 text-[var(--brand)]" />
            {isArabic ? 'ملء الشاشة' : 'Full screen'}
          </button>
        ) : null}
      </div>

      <div className={`mt-5 grid gap-4 md:grid-cols-2 ${isFullscreen ? '2xl:grid-cols-4' : 'xl:grid-cols-4'}`}>
        {report.stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-sm)]">
            <p className="text-start text-xs font-semibold uppercase text-[var(--muted-foreground)]">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-[var(--foreground)]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className={`mt-5 grid gap-4 ${isFullscreen ? 'xl:grid-cols-[1.15fr_0.85fr]' : 'xl:grid-cols-[1fr_1fr]'}`}>
        <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-start text-sm font-semibold text-[var(--foreground)]">
            {isArabic ? 'اتجاه الإيرادات' : 'Revenue Trend'}
          </p>
          <div className={`mt-5 flex ${isFullscreen ? 'h-72' : 'h-40'} items-end gap-3`}>
            {[45, 56, 62, 68, 74].map((height, index) => (
              <div key={height} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl bg-[linear-gradient(180deg,var(--brand),color-mix(in_oklab,var(--brand)_74%,white))]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-[var(--muted-foreground)]">{2020 + index}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-start text-sm font-semibold text-[var(--foreground)]">
            {isArabic ? 'ملخص سريع' : 'Quick Summary'}
          </p>
          <div className="mt-4 space-y-3">
            {report.highlights.map((item) => (
              <div key={item} className="rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-start text-sm leading-7 text-[var(--muted-foreground)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function KPIOverview() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [isGenerated, setIsGenerated] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const reports = dashboardData[locale];
  const fullscreenReport = fullscreenIndex === null ? null : reports[fullscreenIndex];

  if (!isGenerated) {
    return (
      <div className={`rounded-[1.8rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl ${isArabic ? 'text-right' : 'text-left'}`}>
        <div className="grid h-14 w-14 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h2 className={`mt-6 text-3xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
          {isArabic ? 'لا توجد لوحة معلومات بعد' : 'No dashboard generated yet'}
        </h2>
        <div className="mt-10 flex justify-center">
          {/* This only flips the UI state now. Later it should call dashboard generation. */}
          <button
            type="button"
            onClick={() => setIsGenerated(true)}
            className="generate-dashboard-orb"
            aria-label={isArabic ? 'إنشاء لوحة المعلومات' : 'Generate Dashboard'}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <span className="generate-dashboard-orb__glow" aria-hidden="true" />
            <span className="generate-dashboard-orb__label">{isArabic ? 'إنشاء اللوحة' : 'Generate'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div dir={isArabic ? 'rtl' : 'ltr'} className="space-y-6">
        {reports.map((report, index) => (
          <DashboardBlock
            key={report.title}
            report={report}
            isArabic={isArabic}
            onOpenFullscreen={() => setFullscreenIndex(index)}
          />
        ))}
      </div>

      {fullscreenReport ? (
        <div dir={isArabic ? 'rtl' : 'ltr'} className="fixed inset-0 z-[100] bg-[var(--background)]/92 p-4 backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1440px] flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="text-start">
                <p className="text-sm font-semibold text-[var(--brand)]">{isArabic ? 'عرض مكبر' : 'Expanded Dashboard'}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{fullscreenReport.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenIndex(null)}
                className="grid h-11 w-11 place-content-center rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)]"
                aria-label={isArabic ? 'إغلاق العرض المكبر' : 'Close fullscreen dashboard'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="clean-chat-scroll min-h-0 flex-1 overflow-y-auto rounded-[2rem]">
              <DashboardBlock report={fullscreenReport} isArabic={isArabic} isFullscreen />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
