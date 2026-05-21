'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, FilePlus2, LockKeyhole, Menu, MessageSquare, Moon, PanelRightOpen, Sun } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/workspace/ChatWindow';
import { EvidencePanel } from '@/components/workspace/EvidencePanel';
import { Dashboard } from '@/components/workspace/Dashboard';
import { UploadReportCard } from '@/components/workspace/UploadReportCard';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { getSession, type BackendSession, type Source } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function WorkspacePage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const { locale, mounted, theme, toggleTheme, toggleLocale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [session, setSession] = useState<BackendSession | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [latestSources, setLatestSources] = useState<Source[]>([]);
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState<number | undefined>(undefined);

  const sessionId = params.workspaceId;

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  useEffect(() => {
    getSession(sessionId).then(setSession).catch(() => {});
  }, [sessionId]);

  const report = session?.reports ?? null;
  const company = report?.companies ?? null;
  const resolvedSessionTitle = sessionTitle ?? session?.title ?? undefined;
  const reportLabel = company
    ? `${isArabic ? company.name_ar || company.name_en : company.name_en} ${report?.fiscal_year ?? ''}`
    : report?.fiscal_year
    ? `Report ${report.fiscal_year}`
    : undefined;

  const sidebarOpen = !isSidebarCollapsed;

  return (
    <div className="min-h-screen bg-[var(--background)] p-2 md:p-4">
      {/* ── Mobile sidebar overlay backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <div className="mx-auto flex max-w-[1680px] gap-4">
        {/* ── Sidebar ── */}
        <div
          className={
            isMobile
              ? `fixed ${isArabic ? 'right-0' : 'left-0'} inset-y-0 z-50 transition-transform duration-300 ${
                  sidebarOpen ? 'translate-x-0' : isArabic ? 'translate-x-full' : '-translate-x-full'
                }`
              : 'relative'
          }
        >
          <Sidebar
            collapsed={isMobile ? false : isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
            onUploadClick={() => { setShowUpload(true); setIsSidebarCollapsed(true); }}
            currentSessionId={sessionId}
          />
        </div>

        {/* ── Main content ── */}
        <main className="flex h-[calc(100vh-1rem)] min-w-0 flex-1 flex-col md:h-[calc(100vh-2rem)] transition-[width] duration-300">
          {/* Top action bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4 text-[var(--brand)]" />
              </button>
            )}

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {mounted ? (
                <>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)] md:h-11 md:w-11"
                    aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--brand)]" /> : <Moon className="h-4 w-4 text-[var(--brand)]" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleLocale}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)] md:h-11 md:w-11"
                    aria-label={isArabic ? 'English' : 'العربية'}
                  >
                    <span className="text-xs font-bold text-[var(--brand)]">{isArabic ? 'EN' : 'ع'}</span>
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card-strong)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)] md:px-4 md:py-2.5"
              >
                <FilePlus2 className="h-4 w-4 text-[var(--brand)]" />
                <span className="hidden sm:inline">{isArabic ? 'إضافة تقرير' : 'Add Report'}</span>
              </button>
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-soft)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)] md:px-4 md:py-2.5"
                >
                  <LockKeyhole className="h-4 w-4" />
                  <span className="hidden sm:inline">{isArabic ? 'حفظ الجلسة' : 'Save Session'}</span>
                </Link>
              ) : null}
            </div>
          </div>

          <div
            className={`md:-mt-8 grid min-h-0 flex-1 gap-4 transition-[grid-template-columns] duration-300 ${
              showRightPanel ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : 'xl:grid-cols-[minmax(0,1fr)_56px]'
            }`}
          >
            <section className="flex min-h-0 min-w-0 flex-col">
              <WorkspaceHeader
                title={resolvedSessionTitle}
                reportLabel={reportLabel}
                sessionId={sessionId}
                onRenamed={setSessionTitle}
              />

              {/* Tab switcher */}
              <div className="mb-3 mt-1 inline-flex self-start rounded-[1.15rem] bg-[color:var(--card)]/68 p-1 shadow-[var(--shadow-sm)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`inline-flex items-center gap-2 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition md:px-4 md:py-2.5 ${
                    activeTab === 'chat'
                      ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-[var(--brand)]" />
                  {isArabic ? 'المحادثة' : 'Chat'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`inline-flex items-center gap-2 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition md:px-4 md:py-2.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                      : 'text-[var(--muted-foreground)]'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 text-[var(--brand)]" />
                  {isArabic ? 'لوحة المعلومات' : 'Dashboard'}
                </button>
              </div>

              <div className="min-h-0 flex-1">
                {activeTab === 'chat' ? (
                  <ChatWindow
                    sessionId={sessionId}
                    reportLabel={reportLabel}
                    onNewSources={setLatestSources}
                    onSourceClick={(sources, index) => {
                      setLatestSources(sources);
                      setShowRightPanel(true);
                      setHighlightedSourceIndex(index);
                      setTimeout(() => setHighlightedSourceIndex(undefined), 1500);
                    }}
                  />
                ) : (
                  <Dashboard reportId={report?.id ?? undefined} />
                )}
              </div>
            </section>

            {/* Right evidence panel — desktop only */}
            <div className="relative mt-[3.25rem] hidden xl:block">
              <button
                type="button"
                onClick={() => setShowRightPanel(true)}
                className={`${showRightPanel ? 'hidden' : 'sticky top-4'} z-20 grid h-11 w-11 shrink-0 place-content-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]`}
                aria-label={isArabic ? 'لوحة المعلومات' : 'Info Panel'}
              >
                <PanelRightOpen className="h-4 w-4 text-[var(--brand)]" />
              </button>
              {showRightPanel ? (
                <EvidencePanel
                  onTogglePanel={() => setShowRightPanel(false)}
                  sources={latestSources}
                  reportLabel={reportLabel}
                  reportStatus={report?.status}
                  highlightedIndex={highlightedSourceIndex}
                />
              ) : null}
            </div>
          </div>
        </main>
      </div>

      {showUpload ? <UploadReportCard onClose={() => setShowUpload(false)} /> : null}
    </div>
  );
}
