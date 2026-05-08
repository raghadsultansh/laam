'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clock3, FileUp, FolderOpen, LayoutDashboard, LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { Logo } from '@/components/Logo';
import { xbShafigh } from '@/lib/fonts';
import { listSessions, updateSessionTitle, deleteSession, type BackendSession } from '@/lib/api';
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
  const [userName, setUserName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {});
    supabase.auth.getUser().then(({ data }) => {
      setUserName(data.user?.user_metadata?.full_name || data.user?.email || '');
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpenId]);

  async function handleRename(sessionId: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await updateSessionTitle(sessionId, trimmed);
      setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title: trimmed } : s));
    } catch { /* keep old title on error */ }
    setRenamingId(null);
    setMenuOpenId(null);
  }

  async function handleDelete(sessionId: string) {
    setMenuOpenId(null);
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) router.push('/reports');
    } catch { /* ignore */ }
  }

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
      { label: copy.newSession, icon: Plus, href: undefined, onClick: onUploadClick, primary: true },
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

      {userName ? (
        <p className="text-xs font-semibold text-[var(--foreground)] px-3 mt-2 truncate">
          {isArabic ? `مرحبًا، ${userName}` : `Welcome, ${userName}`}
        </p>
      ) : null}

      <div className="mt-2 px-3 space-y-2">
        <button onClick={onUploadClick} className="flex w-full items-center gap-3 rounded-[1.1rem] bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]">
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
              const isMenuOpen = menuOpenId === session.id;
              const isRenaming = renamingId === session.id;

              return (
                <div
                  key={session.id}
                  className={`group relative rounded-[1.2rem] border transition ${
                    isActive
                      ? 'border-transparent bg-[var(--brand-soft)]'
                      : 'border-transparent bg-[var(--card-strong)]/58 hover:bg-[var(--background)]'
                  }`}
                >
                  <Link href={`/workspace/${session.id}`} className={`block px-4 py-3 ${isArabic ? 'pl-10' : 'pr-10'}`}>
                    {isRenaming ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(session.id);
                            if (e.key === 'Escape') { setRenamingId(null); setMenuOpenId(null); }
                          }}
                          className="w-full rounded-lg bg-[var(--background)] px-2 py-0.5 text-sm font-semibold text-[var(--foreground)] outline-none ring-1 ring-[var(--brand)]"
                        />
                        <button type="button" onClick={() => handleRename(session.id)} className="shrink-0 text-[var(--brand)]">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm font-semibold text-[var(--foreground)] truncate ${isArabic ? `${xbShafigh.className} arabic-display` : ''}`}>
                        {session.title}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                  </Link>

                  {/* Three-dot menu button */}
                  <div className={`absolute top-2.5 ${isArabic ? 'left-2' : 'right-2'}`} ref={isMenuOpen ? menuRef : null}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setMenuOpenId(isMenuOpen ? null : session.id); }}
                      className={`grid h-7 w-7 place-content-center rounded-xl text-[var(--muted-foreground)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)] ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className={`absolute top-8 z-50 min-w-[140px] overflow-hidden rounded-[1rem] border border-[var(--border)] bg-[var(--card-strong)] shadow-[var(--shadow-lg)] ${isArabic ? 'left-0' : 'right-0'}`}>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setRenamingId(session.id); setRenameValue(session.title); setMenuOpenId(null); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--background)]"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                          {isArabic ? 'إعادة التسمية' : 'Rename'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleDelete(session.id); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/40 dark:hover:text-red-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {isArabic ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
