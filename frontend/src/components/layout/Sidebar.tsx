'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock3, FileUp, FolderOpen, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Plus, Settings2 } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { Logo } from '@/components/Logo';
import { xbShafigh } from '@/lib/fonts';
import { listSessions, type BackendSession } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  onUploadClick,
  currentSessionId,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onUploadClick: () => void;
  currentSessionId?: string;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const router = useRouter();
  const [sessions, setSessions] = useState<BackendSession[]>([]);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {});
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const copy = isArabic
    ? {
        appName: 'لامّ',
        sessionsTitle: 'الجلسات الأخيرة',
        newSession: 'جلسة جديدة',
        browseReports: 'تصفح التقارير',
        uploadReport: 'رفع تقرير',
        savedDashboards: 'لوحات محفوظة',
        placeholderDashboard: 'لا توجد لوحات محفوظة بعد',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        profileRole: 'مستخدم تجريبي',
      }
    : {
        appName: 'LAAM',
        sessionsTitle: 'Recent Sessions',
        newSession: 'New Session',
        browseReports: 'Browse Reports',
        uploadReport: 'Upload Report',
        savedDashboards: 'Saved Dashboards',
        placeholderDashboard: 'No saved dashboards yet',
        settings: 'Settings',
        logout: 'Log out',
        profileRole: 'Demo user',
      };

  if (collapsed) {
    const compactItems = [
      { label: copy.newSession, icon: Plus, href: undefined, onClick: undefined, primary: true },
      { label: copy.browseReports, icon: FolderOpen, href: '/reports', onClick: undefined },
      { label: copy.uploadReport, icon: FileUp, href: undefined, onClick: onUploadClick },
    ];

    return (
      <aside className="flex h-[calc(100vh-2rem)] w-[78px] shrink-0 flex-col items-center rounded-[1.15rem] bg-[var(--card-strong)] p-3 shadow-[var(--shadow-md)] transition-[width] duration-300">
        <Link href="/" className="rounded-2xl transition hover:opacity-80">
          <Logo vertical={true} priority={true} className="h-11 w-11" />
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="mt-3 grid h-10 w-10 place-content-center rounded-2xl bg-[var(--background)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          aria-label={isArabic ? 'توسيع القائمة الجانبية' : 'Expand sidebar'}
          title={isArabic ? 'توسيع القائمة الجانبية' : 'Expand sidebar'}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <div className="mt-5 flex w-full flex-col items-center gap-2">
          {compactItems.map((item) => {
            const Icon = item.icon;
            const className = `grid h-11 w-11 place-content-center rounded-2xl text-sm transition ${
              item.primary
                ? 'bg-[var(--brand)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--brand-alt)]'
                : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`;

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={className} title={item.label}>
                  <Icon className="h-4 w-4" />
                </Link>
              );
            }

            return (
              <button key={item.label} type="button" onClick={item.onClick} className={className} title={item.label}>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className="mt-5 h-px w-10 bg-[color:var(--muted-foreground)]/12" />
        <Link
          href="/workspace/demo"
          className="mt-4 grid h-11 w-11 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)] transition hover:bg-[var(--background)]"
          title={copy.sessionsTitle}
        >
          <Clock3 className="h-4 w-4" />
        </Link>

        <div className="mt-auto flex flex-col gap-2">
          <Link href="/settings" className="grid h-10 w-10 place-content-center rounded-2xl text-[var(--muted-foreground)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]" title={copy.settings}>
            <Settings2 className="h-4 w-4" />
          </Link>
          <button className="grid h-10 w-10 place-content-center rounded-2xl text-[var(--muted-foreground)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]" title={copy.logout}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-[calc(100vh-2rem)] w-[290px] shrink-0 flex-col rounded-[1.15rem] bg-[var(--card-strong)] shadow-[var(--shadow-md)] transition-[width] duration-300">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center flex-1 min-w-0 rounded-lg transition hover:opacity-80">
          <Logo vertical={false} compact={true} priority={true} />
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid h-10 w-10 shrink-0 place-content-center rounded-2xl bg-[var(--background)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          aria-label={isArabic ? 'طي القائمة الجانبية' : 'Collapse sidebar'}
          title={isArabic ? 'طي القائمة الجانبية' : 'Collapse sidebar'}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-[var(--muted-foreground)] px-3 mt-2">{copy.profileRole}</p>

      <div className="mt-2 px-3 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-[1.1rem] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]">
          <Plus className="h-4 w-4" />
          {copy.newSession}
        </button>
        <Link
          href="/reports"
          className="flex items-center gap-3 rounded-[1.1rem] bg-[var(--background)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--card-strong)]"
        >
          <FolderOpen className="h-4 w-4 text-[var(--brand)]" />
          {copy.browseReports}
        </Link>
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full items-center gap-3 rounded-[1.1rem] bg-[var(--brand-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--background)]"
        >
          <FileUp className="h-4 w-4 text-[var(--brand)]" />
          {copy.uploadReport}
        </button>
      </div>

      <div className="mt-2 px-3 min-h-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[var(--muted-foreground)]" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {copy.sessionsTitle}
          </p>
        </div>

        <div className="workspace-sidebar-scroll mt-3 h-full overflow-y-auto pr-1 [direction:ltr]">
          <div className={`space-y-2 pb-3 ${isArabic ? '[direction:rtl]' : '[direction:ltr]'}`}>
            {sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const company = session.reports?.companies;
              const reportYear = session.reports?.fiscal_year ?? '';
              const subtitle = company
                ? `${company.name_en}${reportYear ? ` ${reportYear}` : ''}`
                : reportYear || (isArabic ? 'تقرير' : 'Report');

              return (
                <Link
                  key={session.id}
                  href={`/workspace/${session.id}`}
                  className={`block rounded-[1.2rem] border px-4 py-3 transition ${
                    isActive
                      ? 'border-transparent bg-[var(--brand-soft)]'
                      : 'border-transparent bg-[var(--card-strong)]/58 hover:bg-[var(--background)]'
                  }`}
                >
                  <p className={`text-sm font-semibold text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} arabic-display` : ''}`}>
                    {session.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                </Link>
              );
            })}

            <div className="rounded-[1.2rem] bg-[var(--background)] px-4 py-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[var(--muted-foreground)]" />
                <p className="text-sm font-semibold text-[var(--foreground)]">{copy.savedDashboards}</p>
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">{copy.placeholderDashboard}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 px-3 pb-3">
        <Link href="/settings" className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]">
          <Settings2 className="h-4 w-4" />
          {copy.settings}
        </Link>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
        >
          <LogOut className="h-4 w-4" />
          {copy.logout}
        </button>
      </div>
    </aside>
  );
}
