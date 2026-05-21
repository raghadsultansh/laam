'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  FileUp,
  FolderOpen,
  Globe2,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Shield,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { supabase } from '@/lib/supabase';
import { listSessions, type BackendSession } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function SettingsPage() {
  const { locale, mounted, theme, toggleLocale, toggleTheme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const router = useRouter();

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [sessions, setSessions] = useState<BackendSession[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      setUserName(name);
      setUserEmail(user.email || '');
      if (user.created_at) {
        setMemberSince(
          new Date(user.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
          })
        );
      }
    });
    listSessions().then(setSessions).catch(() => {});
  }, [isArabic]);

  async function saveName() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === userName) { setEditingName(false); return; }
    setNameSaving(true);
    await supabase.auth.updateUser({ data: { full_name: trimmed } });
    setUserName(trimmed);
    setEditingName(false);
    setNameSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleChangePassword() {
    if (!userEmail) return;
    await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setPasswordSent(true);
  }

  const isLoggedIn = !!userEmail;
  const avatarInitial = userName ? userName.charAt(0).toUpperCase() : '?';

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f1f5f9 0%, #e8eef4 55%, #e2e8f0 100%)';
  const titleColor  = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.90)';
  const mutedColor  = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.46)';
  const statColor   = isDark ? 'rgba(255,255,255,0.86)' : 'rgba(15,23,42,0.86)';

  const copy = isArabic
    ? {
        back: 'العودة',
        profileSection: 'الملف الشخصي',
        welcomeBack: 'مرحباً بعودتك',
        memberSince: 'عضو منذ',
        notLoggedIn: 'غير مسجل الدخول',
        loginPrompt: 'سجّل الدخول لإدارة ملفك الشخصي.',
        loginLink: 'تسجيل الدخول',
        statSessions: 'الجلسات',
        statReports: 'تقارير',
        statDashboards: 'لوحات',
        newSession: 'جلسة جديدة',
        browse: 'تصفح التقارير',
        upload: 'رفع تقرير',
        recentSessions: 'الجلسات الأخيرة',
        openSession: 'فتح',
        noSessions: 'لا توجد جلسات بعد.',
        savedDashboards: 'اللوحات المحفوظة',
        noDashboards: 'لا توجد لوحات محفوظة بعد. ابدأ جلسة وستظهر لوحاتك هنا.',
        preferencesSection: 'التفضيلات',
        appearance: 'المظهر',
        darkMode: 'داكن',
        lightMode: 'فاتح',
        language: 'اللغة',
        accountSection: 'الحساب',
        changePassword: 'تغيير كلمة المرور',
        passwordSent: 'تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني.',
        logout: 'تسجيل الخروج',
      }
    : {
        back: 'Back',
        profileSection: 'Profile',
        welcomeBack: 'Welcome back',
        memberSince: 'Member since',
        notLoggedIn: 'Not signed in',
        loginPrompt: 'Sign in to manage your profile.',
        loginLink: 'Sign in',
        statSessions: 'Sessions',
        statReports: 'Reports',
        statDashboards: 'Dashboards',
        newSession: 'New Session',
        browse: 'Browse Reports',
        upload: 'Upload Report',
        recentSessions: 'Recent Sessions',
        openSession: 'Open',
        noSessions: 'No sessions yet.',
        savedDashboards: 'Saved Dashboards',
        noDashboards: 'No saved dashboards yet. Start a session and your dashboards will appear here.',
        preferencesSection: 'Preferences',
        appearance: 'Appearance',
        darkMode: 'Dark',
        lightMode: 'Light',
        language: 'Language',
        accountSection: 'Account',
        changePassword: 'Change password',
        passwordSent: 'A password reset link has been sent to your email.',
        logout: 'Sign out',
      };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="mx-auto max-w-5xl space-y-5 px-6 py-8" dir={isArabic ? 'rtl' : 'ltr'}>

        {/* ── Profile hero ─────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-[2rem]"
          style={{
            background: panelBg,
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 55% 100% at ${isArabic ? '92%' : '8%'} 50%,
                rgba(36,196,150,${isDark ? '0.22' : '0.28'}) 0%, transparent 62%)`,
            }}
          />

          <div className="relative z-10 flex flex-col gap-6 px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12">
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-5">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#18a078,#12705a)' }}
                  >
                    {avatarInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--brand)]">{copy.welcomeBack}</p>
                    <div className="group flex items-center gap-2">
                      {editingName ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <input
                            autoFocus
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName();
                              if (e.key === 'Escape') setEditingName(false);
                            }}
                            className="rounded-lg bg-white/10 px-2 py-0.5 text-2xl font-extrabold outline-none ring-1 ring-[var(--brand)]"
                            style={{ color: titleColor }}
                          />
                          <button onClick={saveName} disabled={nameSaving} className="grid h-7 w-7 place-content-center rounded-lg bg-[var(--brand)] text-white disabled:opacity-50">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingName(false)} className="grid h-7 w-7 place-content-center rounded-lg text-white/60">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h1
                            className={`mt-0.5 text-3xl font-extrabold leading-tight md:text-4xl ${
                              isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                            }`}
                            style={{ color: titleColor }}
                          >
                            {userName}
                          </h1>
                          <button
                            onClick={() => { setNameValue(userName); setEditingName(true); }}
                            className="mt-1 grid h-7 w-7 place-content-center rounded-lg opacity-0 transition group-hover:opacity-100"
                            style={{ color: mutedColor }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                      {userEmail}{memberSince ? ` · ${copy.memberSince} ${memberSince}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {[
                    { label: copy.statSessions,   value: String(sessions.length), Icon: Clock3 },
                    { label: copy.statReports,    value: String(new Set(sessions.map(s => s.reports?.id).filter(Boolean)).size), Icon: BarChart3 },
                    { label: copy.statDashboards, value: '0', Icon: LayoutDashboard },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className={`flex flex-col ${isArabic ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-[var(--brand)]" />
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
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-content-center rounded-2xl bg-white/10 text-2xl font-bold" style={{ color: titleColor }}>?</div>
                <div>
                  <p className="text-sm" style={{ color: mutedColor }}>{copy.loginPrompt}</p>
                  <Link href="/login" className="mt-1 inline-block text-sm font-semibold text-[var(--brand)] hover:underline">
                    {copy.loginLink}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--brand)] px-4 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:bg-[var(--brand-alt)] hover:shadow-[var(--shadow-md)]"
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
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 rounded-[1.2rem] bg-[var(--brand-soft)] px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
          >
            <FileUp className="h-4 w-4 text-[var(--brand)]" />
            {copy.upload}
          </Link>
        </div>

        {/* ── Recent sessions ───────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-base font-bold text-[var(--foreground)]">{copy.recentSessions}</h2>
          </div>

          {sessions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.slice(0, 6).map((session) => {
                const company = session.reports?.companies;
                const subtitle = company
                  ? `${isArabic ? company.name_ar || company.name_en : company.name_en} ${session.reports?.fiscal_year ?? ''}`
                  : session.reports?.fiscal_year ?? (isArabic ? 'تقرير' : 'Report');

                return (
                  <Link
                    key={session.id}
                    href={`/workspace/${session.id}`}
                    className="group relative overflow-hidden rounded-[1.6rem] bg-[color:var(--card)] p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
                  >
                    <LayoutDashboard className="h-5 w-5 text-[var(--brand)]" />
                    <h3 className={`mt-4 pr-8 text-base font-bold leading-snug text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} arabic-display` : ''}`}>
                      {session.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                    <div className="mt-4 flex items-center justify-end">
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--brand)]">
                        {copy.openSession}
                        <ArrowRight className={`h-3 w-3 transition group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">{copy.noSessions}</p>
          )}
        </section>

        {/* ── Saved dashboards ──────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-base font-bold text-[var(--foreground)]">{copy.savedDashboards}</h2>
          </div>
          <div className="rounded-[1.6rem] border border-dashed border-[var(--border)] bg-[color:var(--card)]/50 px-8 py-12 text-center">
            <LayoutDashboard className="mx-auto h-8 w-8 text-[var(--muted-foreground)]/30" />
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[var(--muted-foreground)]">
              {copy.noDashboards}
            </p>
          </div>
        </section>

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <section className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            {copy.preferencesSection}
          </p>

          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-[var(--brand)]" /> : <Sun className="h-4 w-4 text-[var(--brand)]" />}
                <span className="text-sm font-semibold text-[var(--foreground)]">{copy.appearance}</span>
              </div>
              {mounted && (
                <div className="flex rounded-2xl bg-[var(--background)] p-1 text-xs font-semibold shadow-[var(--shadow-sm)]">
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`rounded-xl px-4 py-1.5 transition ${theme === 'light' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    {copy.lightMode}
                  </button>
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`rounded-xl px-4 py-1.5 transition ${theme === 'dark' ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                  >
                    {copy.darkMode}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe2 className="h-4 w-4 text-[var(--brand)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">{copy.language}</span>
              </div>
              <div className="flex rounded-2xl bg-[var(--background)] p-1 text-xs font-semibold shadow-[var(--shadow-sm)]">
                <button
                  onClick={() => isArabic && toggleLocale()}
                  className={`rounded-xl px-4 py-1.5 transition ${!isArabic ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                >
                  English
                </button>
                <button
                  onClick={() => !isArabic && toggleLocale()}
                  className={`rounded-xl px-4 py-1.5 transition ${isArabic ? 'bg-[var(--brand)] text-white' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Account ───────────────────────────────────────────────────── */}
        {isLoggedIn && (
          <section className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {copy.accountSection}
            </p>

            <div className="mt-5 space-y-3">
              {passwordSent ? (
                <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--brand)]">
                  {copy.passwordSent}
                </p>
              ) : (
                <button
                  onClick={handleChangePassword}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)]"
                >
                  <Shield className="h-4 w-4 text-[var(--brand)]" />
                  {copy.changePassword}
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 shadow-[var(--shadow-sm)] transition hover:bg-red-100 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900/70"
              >
                <LogOut className="h-4 w-4" />
                {copy.logout}
              </button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
