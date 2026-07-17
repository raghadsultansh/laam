'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, GitCompare, Menu, MessageSquare, Moon, Sun } from 'lucide-react';
import { getComparisonSession, type ComparisonSession, type BackendReport } from '@/lib/api';
import { ComparisonChat } from '@/components/workspace/ComparisonChat';
import { ComparisonDashboard } from '@/components/workspace/ComparisonDashboard';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { COMPANY_COLORS } from '@/lib/comparison-colors';

export default function CompareWorkspacePage({ params }: { params: { sessionId: string } }) {
  const { locale, mounted, theme, toggleTheme, toggleLocale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [session, setSession] = useState<ComparisonSession | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    getComparisonSession(params.sessionId).then(setSession).catch(() => {});
  }, [params.sessionId]);

  const reports: BackendReport[] = session?.reports ?? [];
  const sidebarOpen = !isSidebarCollapsed;

  return (
    <div className="min-h-screen bg-[var(--background)] p-2 md:p-4">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarCollapsed(true)} />
      )}

      <div className="mx-auto flex max-w-[1680px] gap-4">
        {/* Sidebar */}
        <div className={isMobile ? `fixed ${isArabic ? 'right-0' : 'left-0'} inset-y-0 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : isArabic ? 'translate-x-full' : '-translate-x-full'}` : 'relative'}>
          <Sidebar
            collapsed={isMobile ? false : isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
            onUploadClick={() => {}}
            currentSessionId={undefined}
          />
        </div>

        <main className="flex h-[calc(100vh-1rem)] min-w-0 flex-1 flex-col md:h-[calc(100vh-2rem)]">
          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            {isMobile && (
              <button type="button" onClick={() => setIsSidebarCollapsed(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--card-strong)] shadow-[var(--shadow-sm)]">
                <Menu className="h-4 w-4 text-[var(--brand)]" />
              </button>
            )}
            <div className="flex flex-1 items-center justify-end gap-2">
              {mounted && (
                <>
                  <button type="button" onClick={toggleTheme} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--card-strong)] shadow-[var(--shadow-sm)]">
                    {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--brand)]" /> : <Moon className="h-4 w-4 text-[var(--brand)]" />}
                  </button>
                  <button type="button" onClick={toggleLocale} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--card-strong)] shadow-[var(--shadow-sm)]">
                    <span className="text-xs font-bold text-[var(--brand)]">{isArabic ? 'EN' : 'ع'}</span>
                  </button>
                </>
              )}
              <Link href="/reports" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card-strong)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]">
                {isArabic ? '← المكتبة' : '← Library'}
              </Link>
            </div>
          </div>

          <div className="md:-mt-8 flex min-h-0 flex-1 flex-col">
            {/* Header — company chips */}
            <div className="mb-3 mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="grid h-8 w-8 place-content-center rounded-xl bg-[var(--brand-soft)]">
                  <GitCompare className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {session?.title ?? (isArabic ? 'مقارنة التقارير' : 'Report Comparison')}
                </span>
                {reports.map((r, i) => {
                  const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
                  const company = r.companies as any;
                  const name = isArabic ? (company?.name_ar || company?.name_en) : company?.name_en;
                  return (
                    <span key={r.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${color.badge}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${color.bg}`} />
                      {name} {r.fiscal_year}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Tab switcher */}
            <div className="mb-3 inline-flex self-start rounded-[1.15rem] bg-[color:var(--card)]/68 p-1 shadow-[var(--shadow-sm)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`inline-flex items-center gap-2 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition md:px-4 md:py-2.5 ${activeTab === 'dashboard' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'text-[var(--muted-foreground)]'}`}
              >
                <BarChart3 className="h-4 w-4 text-[var(--brand)]" />
                {isArabic ? 'المقارنة' : 'Compare'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`inline-flex items-center gap-2 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition md:px-4 md:py-2.5 ${activeTab === 'chat' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'text-[var(--muted-foreground)]'}`}
              >
                <MessageSquare className="h-4 w-4 text-[var(--brand)]" />
                {isArabic ? 'المحادثة' : 'Chat'}
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-0 flex-1">
              {!session ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                </div>
              ) : activeTab === 'dashboard' ? (
                <ComparisonDashboard reports={reports} />
              ) : (
                <ComparisonChat sessionId={params.sessionId} reports={reports} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
