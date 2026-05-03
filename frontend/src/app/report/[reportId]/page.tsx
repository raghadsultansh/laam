'use client';

import type React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Calendar, FileText, Sparkles } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export default function ReportPage({
  params,
}: {
  params: { reportId: string };
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const copy = isArabic
    ? {
        title: 'معاينة التقرير',
        subtitle: 'صفحة جاهزة لعرض بيانات التقرير قبل فتحه داخل جلسة التحليل.',
        company: 'الشركة',
        year: 'السنة',
        type: 'نوع التقرير',
        open: 'فتح جلسة تحليل',
        browse: 'العودة للتقارير',
      }
    : {
        title: 'Report Preview',
        subtitle: 'A backend-ready report detail page for reviewing a report before opening it inside a session.',
        company: 'Company',
        year: 'Year',
        type: 'Report Type',
        open: 'Open Analysis Session',
        browse: 'Back to Reports',
      };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <section className={`rounded-[2rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-semibold text-[var(--brand)]">Report ID: {params.reportId}</p>
          <h1 className={`mt-3 text-4xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetaCard icon={Building2} label={copy.company} value="Aramco" />
            <MetaCard icon={Calendar} label={copy.year} value="2024" />
            <MetaCard icon={FileText} label={copy.type} value="Annual Report" />
          </div>

          <div className={`mt-8 flex flex-wrap gap-3 ${isArabic ? 'justify-end' : ''}`}>
            <Link href="/workspace/demo" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
              <Sparkles className="h-4 w-4" />
              {copy.open}
            </Link>
            <Link href="/reports" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--background)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)]">
              {copy.browse}
              <ArrowRight className="h-4 w-4 text-[var(--brand)]" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-[var(--card-strong)]/78 p-5 shadow-[var(--shadow-sm)]">
      <Icon className="h-5 w-5 text-[var(--brand)]" />
      <p className="mt-4 text-xs font-semibold uppercase text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
