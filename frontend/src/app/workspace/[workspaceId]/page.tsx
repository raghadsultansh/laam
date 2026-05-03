'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, FilePlus2, LockKeyhole, MessageSquare, Moon, PanelRightOpen, Sun, Globe } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/workspace/ChatWindow';
import { EvidencePanel } from '@/components/workspace/EvidencePanel';
import { KPIOverview } from '@/components/workspace/KPIOverview';
import { UploadReportCard } from '@/components/workspace/UploadReportCard';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

export default function WorkspacePage({
  params,
}: {
  params: { workspaceId: string };
}) {
  const { locale, mounted, theme, toggleTheme, toggleLocale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // This page is the main app shell.
  // Backend wiring should mainly replace the mock data inside the child components.
  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="mx-auto flex max-w-[1680px] gap-4">
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
          onUploadClick={() => setShowUpload(true)}
        />

        <main className="flex h-[calc(100vh-2rem)] min-w-0 flex-1 flex-col transition-[width] duration-300">
          <div className="relative z-10 flex justify-end">
            {/* Quick actions stay at the top so the chat/dashboard area keeps focus. */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {mounted ? (
                <>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]"
                    aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--brand)]" /> : <Moon className="h-4 w-4 text-[var(--brand)]" />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleLocale}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]"
                    aria-label={isArabic ? 'English' : 'العربية'}
                  >
                    <span className="text-xs font-bold text-[var(--brand)]">{isArabic ? 'EN' : 'ع'}</span>
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]"
              >
                <FilePlus2 className="h-4 w-4 text-[var(--brand)]" />
                {isArabic ? 'إضافة تقرير' : 'Add Report'}
              </button>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)]">
                <LockKeyhole className="h-4 w-4" />
                {isArabic ? 'حفظ الجلسة' : 'Save Session'}
              </Link>
            </div>
          </div>

          <div className={`-mt-8 grid min-h-0 flex-1 gap-4 transition-[grid-template-columns] duration-300 ${showRightPanel ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : 'xl:grid-cols-[minmax(0,1fr)_56px]'}`}>
            <section className="flex min-h-0 min-w-0 flex-col">
              <div className={isArabic ? 'pl-72' : 'pr-72'}>
                <WorkspaceHeader />
              </div>

              <div className="mb-3 mt-1 inline-flex rounded-[1.15rem] bg-[color:var(--card)]/68 p-1 shadow-[var(--shadow-sm)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`inline-flex items-center gap-2 rounded-[0.9rem] px-4 py-2.5 text-sm font-semibold transition ${
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
                  className={`inline-flex items-center gap-2 rounded-[0.9rem] px-4 py-2.5 text-sm font-semibold transition ${
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
                {/* Keep Chat and Dashboard in the same workspace. Do not split them into pages. */}
                {activeTab === 'chat' ? <ChatWindow /> : <KPIOverview />}
              </div>
            </section>

            <div className="relative mt-[3.25rem] hidden xl:block">
              <button
                type="button"
                onClick={() => setShowRightPanel(true)}
                className={`${showRightPanel ? 'hidden' : 'sticky top-4'} z-20 grid h-11 w-11 shrink-0 place-content-center rounded-2xl bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]`}
                aria-label={isArabic ? 'لوحة المعلومات' : 'Info Panel'}
                title={isArabic ? 'لوحة المعلومات' : 'Info Panel'}
              >
                <PanelRightOpen className="h-4 w-4 text-[var(--brand)]" />
              </button>
              {showRightPanel ? <EvidencePanel onTogglePanel={() => setShowRightPanel(false)} /> : null}
            </div>
          </div>
        </main>
      </div>

      {showUpload ? <UploadReportCard onClose={() => setShowUpload(false)} /> : null}
    </div>
  );
}
