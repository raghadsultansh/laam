'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Clock3, FileUp, FolderOpen, LayoutDashboard, Plus, TrendingUp } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { FooterSection } from '@/components/landing/FooterSection';

const sessions = [
  {
    id: 'demo',
    titleEn: 'Aramco + STC Comparison',
    titleAr: 'مقارنة أرامكو وإس تي سي',
    reports: 2,
    unitEn: 'reports attached',
    unitAr: 'تقارير مرفقة',
    statusEn: 'Dashboard ready',
    statusAr: 'اللوحة جاهزة',
    dateEn: 'Apr 28, 2026',
    dateAr: '28 أبريل 2026',
    color: 'brand' as const,
  },
  {
    id: 'rajhi',
    titleEn: 'Al Rajhi 2024 Review',
    titleAr: 'مراجعة الراجحي 2024',
    reports: 1,
    unitEn: 'report attached',
    unitAr: 'تقرير مرفق',
    statusEn: 'Chat active',
    statusAr: 'المحادثة نشطة',
    dateEn: 'Apr 25, 2026',
    dateAr: '25 أبريل 2026',
    color: 'blue' as const,
  },
  {
    id: 'sabic',
    titleEn: 'SABIC Risks Session',
    titleAr: 'جلسة مخاطر سابك',
    reports: 1,
    unitEn: 'report attached',
    unitAr: 'تقرير مرفق',
    statusEn: 'In progress',
    statusAr: 'قيد التحليل',
    dateEn: 'Apr 20, 2026',
    dateAr: '20 أبريل 2026',
    color: 'amber' as const,
  },
];

const STATUS_STYLES = {
  brand: 'bg-[var(--brand-soft)] text-[var(--brand)]',
  blue:  'bg-blue-500/10 text-blue-400',
  amber: 'bg-amber-500/10 text-amber-500',
};

export default function DashboardPage() {
  const { locale, theme, mounted } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';

  const copy = isArabic
    ? {
        welcomeBack:      'مرحباً بعودتك',
        userName:         'مستخدم تجريبي',
        role:             'محلل',
        since:            'عضو منذ يناير 2026',
        statSessions:     'الجلسات',
        statReports:      'تقارير محللة',
        statDashboards:   'لوحات محفوظة',
        newSession:       'جلسة جديدة',
        browse:           'تصفح التقارير',
        upload:           'رفع تقرير',
        recentSessions:   'الجلسات الأخيرة',
        viewAll:          'عرض الكل',
        openSession:      'فتح الجلسة',
        savedDashboards:  'اللوحات المحفوظة',
        noDashboards:     'لا توجد لوحات محفوظة بعد. ابدأ جلسة وستظهر لوحاتك هنا.',
      }
    : {
        welcomeBack:      'Welcome back',
        userName:         'Demo User',
        role:             'Analyst',
        since:            'Member since January 2026',
        statSessions:     'Sessions',
        statReports:      'Reports analyzed',
        statDashboards:   'Dashboards saved',
        newSession:       'New Session',
        browse:           'Browse Reports',
        upload:           'Upload Report',
        recentSessions:   'Recent Sessions',
        viewAll:          'View all',
        openSession:      'Open Session',
        savedDashboards:  'Saved Dashboards',
        noDashboards:     'No saved dashboards yet. Start a session and your dashboards will appear here.',
      };

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f4f1ea 0%, #ede9e1 55%, #e7e3d9 100%)';

  const titleColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.90)';
  const mutedColor  = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.46)';
  const statColor   = isDark ? 'rgba(255,255,255,0.86)' : 'rgba(15,23,42,0.86)';

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ── Profile hero ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-[2rem]"
          style={{ background: panelBg, border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)' }}
        >
          {/* teal glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 55% 100% at ${isArabic ? '92%' : '8%'} 50%,
                rgba(36,196,150,${isDark ? '0.22' : '0.28'}) 0%,
                transparent 62%)`,
            }}
          />

          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="relative z-10 flex flex-col gap-8 px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12"
          >
            {/* Avatar + greeting */}
            <div className="flex items-center gap-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg,#18a078,#12705a)' }}
              >
                {isArabic ? 'م' : 'D'}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
                  {copy.welcomeBack}
                </p>
                <h1
                  className={`mt-0.5 text-3xl font-extrabold leading-tight md:text-4xl ${
                    isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                  }`}
                  style={{ color: titleColor }}
                >
                  {copy.userName}
                </h1>
                <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                  {copy.role} · {copy.since}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              {[
                { label: copy.statSessions,   value: '3', Icon: Clock3         },
                { label: copy.statReports,    value: '4', Icon: BarChart3       },
                { label: copy.statDashboards, value: '0', Icon: LayoutDashboard },
              ].map(({ label, value, Icon }) => (
                <div key={label} className={`flex flex-col ${isArabic ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3" style={{ color: 'var(--brand)' }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: mutedColor }}>
                      {label}
                    </span>
                  </div>
                  <span className="mt-0.5 text-3xl font-extrabold tabular-nums" style={{ color: statColor }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div dir={isArabic ? 'rtl' : 'ltr'} className="mt-4 grid grid-cols-3 gap-3">
          <Link
            href="/workspace/demo"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--brand)] px-4 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <Plus className="h-4 w-4" />
            {copy.newSession}
          </Link>
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-[color:var(--card)] px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <FolderOpen className="h-4 w-4 text-[var(--brand)]" />
            {copy.browse}
          </Link>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--brand-soft)] px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <FileUp className="h-4 w-4 text-[var(--brand)]" />
            {copy.upload}
          </button>
        </div>

        {/* ── Recent sessions ───────────────────────────────────────────── */}
        <section className="mt-8">
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="mb-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[var(--brand)]" />
              <h2 className="text-base font-bold text-[var(--foreground)]">{copy.recentSessions}</h2>
            </div>
            <Link href="#" className="text-sm font-semibold text-[var(--brand)] transition hover:opacity-70">
              {copy.viewAll}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {sessions.map((session, i) => (
              <Link
                key={session.id}
                href={`/workspace/${session.id}`}
                dir={isArabic ? 'rtl' : 'ltr'}
                className="group relative overflow-hidden rounded-[1.6rem] bg-[color:var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                {/* index badge */}
                <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-extrabold text-[var(--brand)]">
                  {i + 1}
                </span>

                <LayoutDashboard className="h-5 w-5 text-[var(--brand)]" />

                <h3
                  className={`mt-4 pe-8 text-base font-bold leading-snug text-[var(--foreground)] ${
                    isArabic ? `${xbShafigh.className} arabic-display` : ''
                  }`}
                >
                  {isArabic ? session.titleAr : session.titleEn}
                </h3>

                <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">
                  {session.reports} {isArabic ? session.unitAr : session.unitEn}
                  {' · '}
                  {isArabic ? session.dateAr : session.dateEn}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[session.color]}`}>
                    {isArabic ? session.statusAr : session.statusEn}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                    {copy.openSession}
                    <ArrowRight className={`h-3 w-3 transition group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Saved dashboards ──────────────────────────────────────────── */}
        <section className="mb-4 mt-8">
          <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="mb-4 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-base font-bold text-[var(--foreground)]">{copy.savedDashboards}</h2>
          </div>

          <div className="rounded-[1.6rem] border border-dashed border-[var(--border)] bg-[color:var(--card)]/50 px-8 py-12 text-center">
            <LayoutDashboard className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/30" />
            <p className="mt-3 max-w-sm mx-auto text-sm leading-7 text-[var(--muted-foreground)]">
              {copy.noDashboards}
            </p>
          </div>
        </section>

      </div>

      <FooterSection />
    </main>
  );
}
