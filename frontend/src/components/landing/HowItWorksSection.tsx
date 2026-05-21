'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';

// ── Step-specific mockup visuals ─────────────────────────────────────────────

// Mirrors: /reports page — header with search+filters, company folder grid
function BrowseMockup({ isArabic }: { isArabic: boolean }) {
  const dir = isArabic ? 'rtl' : 'ltr';
  return (
    <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)]">
      {/* Page header panel */}
      <div className="space-y-2.5 border-b border-[var(--border)] bg-[var(--card-strong)] p-3">
        {/* Badge + title */}
        <div className="h-2 w-12 rounded-full bg-[var(--brand-soft)]" />
        <div className="h-4 w-24 rounded-lg bg-[var(--foreground)]/12" />
        {/* Description lines */}
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-[var(--muted-foreground)]/12" />
          <div className="h-1.5 w-4/5 rounded-full bg-[var(--muted-foreground)]/10" />
        </div>
        {/* Search + 3 filter dropdowns */}
        <div className="flex gap-1.5 pt-0.5" dir={dir}>
          <div className="flex flex-[2] items-center gap-1.5 rounded-[1rem] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5">
            <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--muted-foreground)]/25" />
            <div className="h-1.5 flex-1 rounded-full bg-[var(--muted-foreground)]/12" />
          </div>
          {[28, 24, 26].map((w, i) => (
            <div key={i} className="flex items-center justify-between gap-1 rounded-[1rem] border border-[var(--border)] bg-[var(--background)] px-2 py-1.5">
              <div className="h-1.5 rounded-full bg-[var(--muted-foreground)]/12" style={{ width: w }} />
              <div className="h-2 w-2 rounded-full border border-[var(--muted-foreground)]/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Company folder cards grid — 2 columns, matches real grid layout */}
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--card-strong)] p-3 space-y-2.5 shadow-[var(--shadow-sm)]">
            {/* 3D folder visual — matches the real folder structure */}
            <div className="relative mx-auto h-[72px] w-[80px]">
              {/* Shadow blob */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-3 w-16 rounded-full bg-black/6 blur-md" />
              {/* Folder tab */}
              <div className="absolute top-0 left-3 h-3 w-8 rounded-t-[0.4rem] border border-b-0 border-[var(--border)] bg-[var(--muted)]/60" />
              {/* Folder body */}
              <div className="absolute top-2.5 inset-x-0 h-[calc(100%-10px)] rounded-[0.85rem] border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-sm)]">
                {/* Inner white card with logo */}
                <div className="absolute inset-[6px] rounded-[0.65rem] border border-[var(--border)] bg-[var(--card-strong)] flex items-center justify-center shadow-sm">
                  <div className="h-7 w-7 rounded-xl border border-[var(--border)] bg-[var(--background)] flex items-center justify-center">
                    <div className="h-4 w-4 rounded-lg bg-[var(--brand-soft)]" />
                  </div>
                </div>
              </div>
            </div>
            {/* Company name */}
            <div className="h-2.5 rounded-full bg-[var(--foreground)]/14 mx-1" />
            {/* Sector + reports count badges */}
            <div className="flex gap-1.5 justify-center">
              <div className="h-4 w-14 rounded-full bg-[var(--brand-soft)]" />
              <div className="h-4 w-12 rounded-full border border-[var(--border)] bg-[var(--background)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mirrors: workspace chat tab — greeting, messages, prompt chips, input bar
function ChatMockup({ isArabic }: { isArabic: boolean }) {
  const dir = isArabic ? 'rtl' : 'ltr';
  return (
    <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)]">
      {/* Messages area */}
      <div className="space-y-3 p-3" dir={dir}>
        {/* Assistant greeting bubble */}
        <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)]">
            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--brand)]" />
          </div>
          <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[var(--muted-foreground)]/15" />
            <div className="h-1.5 w-5/6 rounded-full bg-[var(--muted-foreground)]/15" />
            <div className="h-1.5 w-4/6 rounded-full bg-[var(--muted-foreground)]/15" />
          </div>
        </div>

        {/* User bubble */}
        <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'}`}>
          <div
            className="max-w-[72%] rounded-2xl px-3 py-2 space-y-1"
            style={{ background: 'linear-gradient(135deg,#18a078,#12705a)' }}
          >
            <div className="h-1.5 w-28 rounded-full bg-white/35" />
            <div className="h-1.5 w-20 rounded-full bg-white/25" />
          </div>
        </div>

        {/* Assistant answer bubble */}
        <div className={`flex items-start gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)]">
            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--brand)]" />
          </div>
          <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[var(--muted-foreground)]/15" />
            <div className="h-1.5 w-5/6 rounded-full bg-[var(--muted-foreground)]/15" />
            {/* Citation chip */}
            <div className="mt-1 h-4 w-10 rounded-md bg-[var(--brand-soft)]" />
          </div>
        </div>
      </div>

      {/* Prompt chips + input area */}
      <div className="border-t border-[var(--border)] px-3 py-2 space-y-2">
        {/* Suggested prompt pills */}
        <div className="flex flex-wrap gap-1.5" dir={dir}>
          {[44, 56, 36, 52].map((w, i) => (
            <div key={i} className="h-5 rounded-full border border-[var(--border)] bg-[var(--background)]" style={{ width: w }} />
          ))}
        </div>
        {/* Input bar */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-3 py-2">
            <div className="h-1.5 w-24 rounded-full bg-[var(--muted-foreground)]/15" />
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mirrors: workspace dashboard tab — KPI row, bar chart, margin bars, area chart, donut
function DashboardMockup({ isArabic }: { isArabic: boolean }) {
  const dir = isArabic ? 'rtl' : 'ltr';
  const bars  = [48, 62, 55, 78, 65, 88, 72];
  const trend = [40, 55, 48, 70, 62, 80];
  const margins = [
    { w: '72%', color: 'var(--brand)' },
    { w: '48%', color: '#0ea5e9' },
    { w: '33%', color: '#8b5cf6' },
  ];

  return (
    <div className="mt-6 space-y-2 overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--background)] p-3">
      {/* Header row: company name + regenerate btn */}
      <div className="flex items-center justify-between" dir={dir}>
        <div className="space-y-1">
          <div className="h-2 w-20 rounded-full bg-[var(--foreground)]/15" />
          <div className="h-1.5 w-14 rounded-full bg-[var(--muted-foreground)]/12" />
        </div>
        <div className="h-5 w-16 rounded-2xl border border-[var(--border)] bg-[var(--card-strong)]" />
      </div>

      {/* KPI row — 4 cards */}
      <div className="grid grid-cols-4 gap-1.5">
        {[true, false, true, true].map((up, i) => (
          <div key={i} className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-[var(--muted-foreground)]/12" />
            <div className="h-3 w-10 rounded-md bg-[var(--foreground)]/15" />
            <div
              className="h-3 w-8 rounded-full"
              style={{ background: up ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)' }}
            />
          </div>
        ))}
      </div>

      {/* Row 2: Bar chart + margin bars */}
      <div className="grid grid-cols-[1fr_80px] gap-1.5">
        {/* P&L bar chart panel */}
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="mb-1.5 h-1.5 w-16 rounded-full bg-[var(--muted-foreground)]/12" />
          <div className="flex h-12 items-end gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: i === bars.length - 1
                    ? 'linear-gradient(to top,#12705a,#18a078)'
                    : 'var(--brand-soft)',
                }}
              />
            ))}
          </div>
          {/* X-axis tick bars */}
          <div className="mt-1 flex gap-0.5">
            {bars.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-[var(--muted-foreground)]/10" />
            ))}
          </div>
        </div>

        {/* Margin bars panel */}
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-2 space-y-2">
          <div className="h-1.5 w-10 rounded-full bg-[var(--muted-foreground)]/12" />
          {margins.map((m, i) => (
            <div key={i} className="space-y-0.5">
              <div className="h-1 w-8 rounded-full bg-[var(--muted-foreground)]/12" />
              <div className="h-1.5 w-full rounded-full bg-[var(--background)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: m.w, background: m.color, opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Area trend chart + donut */}
      <div className="grid grid-cols-[1fr_72px] gap-1.5">
        {/* Area chart panel */}
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-2">
          <div className="mb-1.5 h-1.5 w-14 rounded-full bg-[var(--muted-foreground)]/12" />
          <div className="relative h-10">
            <svg viewBox="0 0 120 40" className="h-full w-full" preserveAspectRatio="none">
              {/* area fill */}
              <path
                d={`M0,${40 - trend[0] * 0.38} ${trend.map((v, i) => `L${i * 24},${40 - v * 0.38}`).join(' ')} L${(trend.length - 1) * 24},40 L0,40 Z`}
                fill="rgba(24,160,120,0.18)"
              />
              {/* line */}
              <path
                d={`M0,${40 - trend[0] * 0.38} ${trend.map((v, i) => `L${i * 24},${40 - v * 0.38}`).join(' ')}`}
                fill="none"
                stroke="#18a078"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Donut panel */}
        <div className="rounded-[1rem] border border-[var(--border)] bg-[var(--card)] p-2 flex flex-col items-center justify-center gap-1.5">
          <div className="h-1.5 w-10 rounded-full bg-[var(--muted-foreground)]/12" />
          {/* Donut ring */}
          <div className="relative h-10 w-10">
            <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
              <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="6" />
              <circle cx="20" cy="20" r="14" fill="none" stroke="#18a078" strokeWidth="6"
                strokeDasharray="52 88" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex gap-1">
            <div className="h-1.5 w-5 rounded-full bg-[var(--brand-soft)]" />
            <div className="h-1.5 w-5 rounded-full bg-red-200/60 dark:bg-red-900/40" />
          </div>
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
    <section id="how-it-works" className="section-anchor px-4 py-20 md:px-6 md:py-28">
      <div className="surface-card mx-auto max-w-7xl rounded-[2.4rem] px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className={`section-title ${
              isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
            }`}
          >
            {copy.title}
          </h2>
          {copy.description && (
            <p className="section-subtitle mt-4">{copy.description}</p>
          )}
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
                <p className={`mt-3 text-base leading-7 text-[var(--muted-foreground)] ${isArabic ? 'text-right' : ''}`}>
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

