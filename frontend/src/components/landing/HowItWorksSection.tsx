'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';
import Image from 'next/image';
import { Search, Send } from 'lucide-react';

// ── Step-specific mockup visuals ─────────────────────────────────────────────

function BrowseMockup({ isArabic }: { isArabic: boolean }) {
  const companies = isArabic
    ? [
        { logo: '/company-logos/Saudi Aramco Logo.png', name: 'أرامكو السعودية', sector: 'الطاقة', years: ['2024', '2023', '2022'] },
        { logo: '/company-logos/Al_Rajhi_Bank_Logo.png', name: 'مصرف الراجحي', sector: 'البنوك', years: ['2024', '2023'] },
      ]
    : [
        { logo: '/company-logos/Saudi Aramco Logo.png', name: 'Saudi Aramco', sector: 'Energy', years: ['2024', '2023', '2022'] },
        { logo: '/company-logos/Al_Rajhi_Bank_Logo.png', name: 'Al Rajhi Bank', sector: 'Banking', years: ['2024', '2023'] },
      ];

  return (
    <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)]">
      {/* Mini top bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--card-strong)]/60 px-3 py-2">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-red-400/70" />
          <div className="h-2 w-2 rounded-full bg-yellow-400/70" />
          <div className="h-2 w-2 rounded-full bg-green-400/70" />
        </div>
        <div className="mx-auto flex h-5 w-3/5 items-center gap-1.5 rounded bg-[var(--card)] px-2">
          <Search className="h-2.5 w-2.5 shrink-0 text-[var(--muted-foreground)]" />
          <div className="h-1.5 flex-1 rounded-full bg-[var(--muted-foreground)]/25" />
        </div>
      </div>

      {/* Company cards */}
      <div className="grid grid-cols-2 gap-2 p-3" dir={isArabic ? 'rtl' : 'ltr'}>
        {companies.map((c) => (
          <div key={c.name} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-white">
                <Image src={c.logo} alt={c.name} fill className="object-contain p-1" />
              </div>
              <div className={isArabic ? 'text-right' : ''}>
                <p className="text-[10px] font-bold leading-tight text-[var(--foreground)]">{c.name}</p>
                <p className="text-[9px] text-[var(--muted-foreground)]">{c.sector}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {c.years.map((y) => (
                <span key={y} className="rounded-full bg-[var(--brand-soft)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
                  {y}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upload strip */}
      <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-dashed border-[var(--brand)]/40 bg-[var(--brand-soft)] px-3 py-2">
        <div className="h-4 w-4 rounded bg-[var(--brand)]/30" />
        <div className="h-1.5 flex-1 rounded-full bg-[var(--brand)]/30" />
        <div className="h-5 rounded-lg bg-[var(--brand)] px-2" />
      </div>
    </div>
  );
}

function ChatMockup({ isArabic }: { isArabic: boolean }) {
  const userMsg  = isArabic ? 'ما هي إيرادات أرامكو لعام 2024؟' : "What are Aramco's 2024 revenues?";
  const aiLine1  = isArabic ? 'بلغت إيرادات أرامكو السعودية...' : 'Saudi Aramco reported revenues of...';
  const aiLine2  = isArabic ? '٤٠٧ مليار دولار، بانخفاض طفيف' : '$407 billion, a slight decrease';
  const inputPh  = isArabic ? 'اطرح سؤالك...' : 'Ask a question...';

  return (
    <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)]">
      {/* Workspace header strip */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--card-strong)]/60 px-3 py-2" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="h-4 w-4 rounded-md bg-[var(--brand-soft)]" />
        <div className="flex gap-1">
          <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
            {isArabic ? 'الدردشة' : 'Chat'}
          </span>
          <span className="rounded-md px-2 py-0.5 text-[9px] font-semibold text-[var(--muted-foreground)]">
            {isArabic ? 'لوحة البيانات' : 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 p-3" dir={isArabic ? 'rtl' : 'ltr'}>
        {/* User bubble */}
        <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'}`}>
          <div
            className="max-w-[78%] rounded-2xl px-3 py-2 text-[10px] font-medium leading-relaxed text-white"
            style={{ background: 'linear-gradient(135deg,#18a078,#12705a)' }}
          >
            {userMsg}
          </div>
        </div>

        {/* AI bubble */}
        <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)]">
            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--brand)]" />
          </div>
          <div className="max-w-[78%] rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2">
            <p className="text-[10px] font-semibold leading-relaxed text-[var(--foreground)]">{aiLine1}</p>
            <p className="text-[10px] leading-relaxed text-[var(--muted-foreground)]">{aiLine2}</p>
            {/* Citation chip */}
            <div className="mt-1.5 inline-flex rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[9px] font-semibold text-[var(--brand)]">
              {isArabic ? 'ص. ٤٢' : 'p. 42'}
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-[var(--card-strong)] px-3 py-1.5">
          <span className="flex-1 text-[9px] text-[var(--muted-foreground)]">{inputPh}</span>
        </div>
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--brand)]">
          <Send className="h-3 w-3 text-white" />
        </div>
      </div>
    </div>
  );
}

function DashboardMockup({ isArabic }: { isArabic: boolean }) {
  const kpis = isArabic
    ? [
        { label: 'الإيرادات',   value: '٤٠٧B',  up: true  },
        { label: 'صافي الربح',  value: '١٢١B',  up: false },
        { label: 'إجمالي الأصول', value: '٦٨٢B', up: true  },
      ]
    : [
        { label: 'Revenue',     value: '$407B', up: true  },
        { label: 'Net Income',  value: '$121B', up: false },
        { label: 'Total Assets',value: '$682B', up: true  },
      ];

  const bars = [55, 70, 60, 85, 72, 90, 78];

  return (
    <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)]">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 p-3" dir={isArabic ? 'rtl' : 'ltr'}>
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2">
            <p className="text-[9px] text-[var(--muted-foreground)]">{k.label}</p>
            <p className="mt-0.5 text-[11px] font-extrabold text-[var(--foreground)]">{k.value}</p>
            <div className={`mt-1 flex items-center gap-0.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path
                  d={k.up ? 'M4 6L1 3h6z' : 'M4 2L7 5H1z'}
                  fill={k.up ? '#18a078' : '#ef4444'}
                />
              </svg>
              <span className={`text-[9px] font-semibold ${k.up ? 'text-[#18a078]' : 'text-red-400'}`}>
                {k.up ? '+3.2%' : '−1.8%'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="mx-3 mb-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="mb-2 flex items-center justify-between" dir={isArabic ? 'rtl' : 'ltr'}>
          <p className="text-[9px] font-semibold text-[var(--muted-foreground)]">
            {isArabic ? 'الإيرادات السنوية (بالمليار)' : 'Annual Revenue (Billion)'}
          </p>
          <div className="flex gap-1">
            {['2020','2021','2022','2023','2024'].map((y) => (
              <span key={y} className="text-[8px] text-[var(--muted-foreground)]">{y.slice(2)}</span>
            ))}
          </div>
        </div>
        <div className="flex h-14 items-end gap-1">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background: i === bars.length - 1
                  ? 'linear-gradient(to top, #12705a, #18a078)'
                  : 'var(--brand-soft)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

const mockups = [BrowseMockup, ChatMockup, DashboardMockup];

export function HowItWorksSection() {
  const { locale } = useAppPreferences();
  const copy     = siteCopy[locale].howItWorks;
  const isArabic = locale === 'ar';

  return (
    <section id="how-it-works" className="section-anchor px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className={`section-title mt-6 ${
              isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
            }`}
          >
            {copy.title}
          </h2>
          <p className="section-subtitle mt-4">{copy.description}</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {copy.steps.map((step, index) => {
            const Mockup = mockups[index];
            return (
              <article key={step.title} className="surface-card card-hover rounded-[1.75rem] p-6">
                <div className={`flex items-center ${isArabic ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                  <div className="grid h-12 w-12 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <span className="text-lg font-extrabold">0{index + 1}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                    {isArabic ? 'خطوة' : 'Step'} {index + 1}
                  </span>
                </div>

                <h3
                  className={`mt-6 text-xl font-extrabold tracking-tight ${
                    isArabic ? `${xbShafigh.className} arabic-display text-right` : 'display-heading'
                  }`}
                >
                  {step.title}
                </h3>
                <p className={`mt-3 text-sm leading-7 text-[var(--muted-foreground)] ${isArabic ? 'text-right' : ''}`}>
                  {step.description}
                </p>

                {/* Live UI mockup */}
                <Mockup isArabic={isArabic} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
