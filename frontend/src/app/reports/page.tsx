'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  ArrowUpDown,
  Building2,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { FooterSection } from '@/components/landing/FooterSection';
import { Navbar } from '@/components/layout/Navbar';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { getReports, createSession, listSessions, type BackendSession } from '@/lib/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function FilterDropdown({
  icon,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  align = 'left',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onToggle();
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, onToggle]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="surface-card flex w-full items-center gap-3 rounded-[1.4rem] border border-[var(--border)] bg-[var(--card-strong)]/80 px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)]/35"
      >
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 text-[var(--muted-foreground)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute top-[calc(100%+0.6rem)] z-50 min-w-full overflow-hidden rounded-[1.1rem] border border-[var(--border)] bg-[var(--card-strong)] shadow-[var(--shadow-lg)]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <div className="max-h-72 overflow-y-auto p-2">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={cn(
                    'flex w-full items-center rounded-xl px-3 py-2.5 text-sm transition',
                    selected
                      ? 'bg-[var(--brand-soft)] font-semibold text-[var(--brand)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--background)]'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ReportItem = {
  id: string;
  year: string;
  title: { en: string; ar: string };
};

type Company = {
  id: string;
  name: { en: string; ar: string };
  sector: { en: string; ar: string };
  logo: string;
  reports: ReportItem[];
};

const SECTOR_AR: Record<string, string> = {
  Banking: 'القطاع البنكي',
  Energy: 'الطاقة',
  Technology: 'التقنية',
  Industrial: 'الصناعة',
  Chemicals: 'البتروكيماويات',
  Healthcare: 'الرعاية الصحية',
  Insurance: 'التأمين',
  Retail: 'التجزئة',
  Mining: 'التعدين',
  'Real Estate': 'العقارات',
  Petrochemicals: 'البتروكيماويات',
  Telecommunications: 'الاتصالات',
  Food: 'الغذاء',
  Transportation: 'النقل',
  Utilities: 'الخدمات',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptCompanies(raw: any[]): Company[] {
  return raw.map((bc) => ({
    id: bc.id,
    name: { en: bc.name_en ?? '', ar: bc.name_ar ?? bc.name_en ?? '' },
    sector: { en: bc.sector ?? '', ar: SECTOR_AR[bc.sector] ?? bc.sector ?? '' },
    logo: bc.logo_url ?? '',
    reports: (bc.reports ?? []).map((r: any) => ({
      id: r.id,
      year: String(r.fiscal_year ?? ''),
      title: {
        en: r.title ?? `Annual Report ${r.fiscal_year}`,
        ar: `التقرير السنوي ${r.fiscal_year}`,
      },
    })),
  }));
}

const copy = {
  en: {
    badge: 'Reports library',
    conflictTitle: 'Session already exists',
    conflictBody: 'You already have a session for this report. Would you like to continue where you left off or start fresh?',
    conflictOpenExisting: 'Continue existing session',
    conflictCreateNew: 'Start new session',
    title: 'Browse Reports',
    description:
      'Explore companies as report folders, hover to preview annual files, and open the session you want to work in.',
    searchPlaceholder: 'Search by company or report name',
    allSectors: 'All sectors',
    allYears: 'All years',
    newest: 'Newest first',
    oldest: 'Oldest first',
    alphabetical: 'Alphabetical',
    resultsCount: 'companies available',
    hoverHint: 'Hover or tap to preview',
    reportsCount: 'reports',
    moreReports: 'more',
    reportLabel: 'Report',
    modalTitle: 'Open report session',
    modalDescription: 'Choose a report file and continue into a new analysis session.',
    modalListTitle: 'All available files',
    openSession: 'Open Session',
    cancel: 'Cancel',
    emptyTitle: 'No matching reports found',
    emptyDescription: 'Try adjusting your search term or clearing one of the filters.',
  },
  ar: {
    badge: 'مكتبة التقارير',
    conflictTitle: 'توجد جلسة موجودة بالفعل',
    conflictBody: 'لديك جلسة موجودة لهذا التقرير. هل تريد متابعة من حيث توقفت أم البدء من جديد؟',
    conflictOpenExisting: 'متابعة الجلسة الحالية',
    conflictCreateNew: 'بدء جلسة جديدة',
    title: 'تصفح التقارير',
    description:
      'استعرض الشركات على شكل مجلدات تقارير، وعاين الملفات السنوية عند المرور عليها، ثم افتح الجلسة التي تريد العمل فيها.',
    searchPlaceholder: 'ابحث باسم الشركة أو التقرير',
    allSectors: 'جميع القطاعات',
    allYears: 'جميع السنوات',
    newest: 'الأحدث أولًا',
    oldest: 'الأقدم أولًا',
    alphabetical: 'أبجديًا',
    resultsCount: 'شركة متاحة',
    hoverHint: 'مرر أو اضغط للمعاينة',
    reportsCount: 'تقارير',
    moreReports: 'أكثر',
    reportLabel: 'التقرير',
    modalTitle: 'فتح جلسة التقرير',
    modalDescription: 'اختر ملف التقرير ثم انتقل إلى جلسة تحليل جديدة.',
    modalListTitle: 'جميع الملفات المتاحة',
    openSession: 'فتح الجلسة',
    cancel: 'إلغاء',
    emptyTitle: 'لا توجد تقارير مطابقة',
    emptyDescription: 'جرّب تعديل كلمة البحث أو إزالة أحد عوامل التصفية.',
  },
} as const;

function sortReports(reports: ReportItem[]) {
  // Newest first because this is how the folder preview fans out.
  return [...reports].sort((a, b) => Number(b.year) - Number(a.year));
}

function ReportPreviewCard({
  report,
  index,
  totalCount,
  isActive,
  isSelected,
  isArabic,
  onClick,
}: {
  report: ReportItem;
  index: number;
  totalCount: number;
  isActive: boolean;
  isSelected: boolean;
  isArabic: boolean;
  onClick: () => void;
}) {
  const middleIndex = (totalCount - 1) / 2;
  const factor = totalCount > 1 ? (index - middleIndex) / middleIndex : 0;
  const rotation = factor * 18;
  const translationX = factor * 72;
  const translationY = Math.abs(factor) * 8;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="absolute left-1/2 top-[18px] h-[116px] w-[82px] -translate-x-1/2 cursor-pointer"
      style={{
        transform: isActive
          ? `translateX(calc(-50% + ${translationX}px)) translateY(-88px) rotate(${rotation}deg)`
          : 'translateX(-50%) translateY(0px) rotate(0deg) scale(0.45)',
        opacity: isSelected ? 0 : isActive ? 1 : 0,
        transition: `all 680ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 45}ms`,
        zIndex: 10 + index,
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[0.95rem] border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_16px_30px_rgba(15,23,42,0.14)] transition-transform duration-300 hover:-translate-y-2">
        <div
          className={cn(
            'absolute inset-y-0 w-[18px] bg-[var(--brand)]/10',
            isArabic ? 'right-0 border-r border-[var(--brand)]/20' : 'left-0 border-l border-[var(--brand)]/20'
          )}
        />
        <div className="absolute left-2 top-2 text-[10px] font-bold text-[var(--brand)]">
          {report.year}
        </div>
        <div className={cn('absolute inset-x-0 bottom-0 p-2 text-left', isArabic && 'text-right')}>
          <div className="space-y-1">
            <div className="h-[5px] w-full rounded-full bg-slate-200" />
            <div className="h-[5px] w-[82%] rounded-full bg-slate-200" />
            <div className="h-[5px] w-[68%] rounded-full bg-slate-200" />
          </div>
          <p className="mt-2 line-clamp-2 text-[9px] font-semibold leading-3 text-slate-600">
            {isArabic ? report.title.ar : report.title.en}
          </p>
        </div>
      </div>
    </button>
  );
}

function ReportSessionModal({
  company,
  selectedReportId,
  isArabic,
  onClose,
  onNavigate,
  onOpenSession,
  openingSession,
  text,
}: {
  company: Company | null;
  selectedReportId: string | null;
  isArabic: boolean;
  onClose: () => void;
  onNavigate: (reportId: string) => void;
  onOpenSession: (reportId: string) => void;
  openingSession: boolean;
  text: (typeof copy)['en'] | (typeof copy)['ar'];
}) {
  if (!company || !selectedReportId) {
    return null;
  }

  const reports = sortReports(company.reports);
  const selectedIndex = reports.findIndex((report) => report.id === selectedReportId);
  const selectedReport = reports[selectedIndex];

  if (!selectedReport) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          'w-full max-w-3xl overflow-hidden rounded-[2rem] bg-[var(--card-strong)] shadow-[var(--shadow-lg)]',
          isArabic ? 'text-right' : 'text-left'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5 md:px-8">
          <div>
            <h3 className={cn('text-2xl font-bold', isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading')}>
              {text.modalTitle}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">{text.modalDescription}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-[var(--border)] p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="surface-card relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.8rem] p-6 shadow-[var(--shadow-md)]">
              <div className="hero-glow" />
              <div className="relative z-10">
                <div className="inline-flex rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  {isArabic ? company.sector.ar : company.sector.en}
                </div>
                <h4
                  className={cn(
                    'mt-4 text-3xl font-bold leading-tight',
                    isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                  )}
                >
                  {isArabic ? company.name.ar : company.name.en}
                </h4>
                <p className="mt-3 text-sm font-semibold text-[var(--brand)]">
                  {text.reportLabel}: {isArabic ? selectedReport.title.ar : selectedReport.title.en}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{selectedReport.year}</p>
              </div>

              <div className="relative z-10 mt-8 flex items-center gap-3">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => selectedIndex > 0 && onNavigate(reports[selectedIndex - 1].id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={selectedIndex >= reports.length - 1}
                  onClick={() => selectedIndex < reports.length - 1 && onNavigate(reports[selectedIndex + 1].id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:opacity-35"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={openingSession}
                  onClick={() => onOpenSession(selectedReport.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-60"
                >
                  {openingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  {text.openSession}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {text.modalListTitle}
            </h4>

            <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => onNavigate(report.id)}
                  className={cn(
                    'w-full rounded-[1.2rem] border px-4 py-4 transition',
                    report.id === selectedReportId
                      ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                      : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand)]/40'
                  )}
                >
                  <div className={cn('flex items-center justify-between gap-3', isArabic && 'flex-row-reverse')}>
                    <div className={cn('min-w-0', isArabic ? 'text-right' : 'text-left')}>
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {isArabic ? report.title.ar : report.title.en}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{report.year}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--brand)] shadow-[var(--shadow-sm)]">
                      {report.year}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              {text.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyFolder({
  company,
  locale,
  isActive,
  onActivate,
  onDeactivate,
  onOpenReport,
  text,
}: {
  company: Company;
  locale: 'en' | 'ar';
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onOpenReport: (reportId: string) => void;
  text: (typeof copy)['en'] | (typeof copy)['ar'];
}) {
  const isArabic = locale === 'ar';
  const orderedReports = sortReports(company.reports);
  const previewReports = orderedReports.slice(0, 5);
  const extraCount = orderedReports.length - previewReports.length;

  return (
    <article
      className="group relative overflow-visible rounded-[2rem] bg-[color:var(--card)]/76 p-6 shadow-[var(--shadow-md)] backdrop-blur-xl transition-all duration-500 hover:shadow-[var(--shadow-lg)]"
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onClick={() => (isActive ? onDeactivate() : onActivate())}
    >
      <div className="relative mx-auto mb-5 flex h-[220px] w-[220px] items-center justify-center" style={{ perspective: '1200px' }}>
        <div
          className="pointer-events-none absolute left-1/2 top-[104px] z-0 h-[146px] w-[172px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(15,23,42,0.16),rgba(15,23,42,0.06)_42%,transparent_74%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(148,163,184,0.18),rgba(18,112,90,0.12)_42%,transparent_74%)]"
          style={{
            opacity: isActive ? 0.28 : 0.14,
            transform: isActive ? 'translateX(-50%) scale(1.06)' : 'translateX(-50%) scale(0.96)',
            transition: 'all 500ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <div
          className="absolute h-[128px] w-[156px] rounded-[1.1rem] border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#e7edf2,#d6dee6)] shadow-[0_18px_35px_rgba(15,23,42,0.14)]"
          style={{
            transform: isActive ? 'rotateX(-18deg) scaleY(1.05)' : 'rotateX(0deg) scaleY(1)',
            transformOrigin: 'bottom center',
            transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        <div
          className="absolute left-[52px] top-[38px] h-[22px] w-[56px] rounded-t-[0.7rem] border border-b-0 border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,#d8e0e7,#c8d2db)]"
          style={{
            transform: isActive ? 'rotateX(-24deg) translateY(-4px)' : 'rotateX(0deg) translateY(0)',
            transformOrigin: 'bottom center',
            transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        <div className="absolute left-1/2 top-[38px] z-20 -translate-x-1/2">
          {previewReports.map((report, index) => (
            <ReportPreviewCard
              key={report.id}
              report={report}
              index={index}
              totalCount={previewReports.length}
              isActive={isActive}
              isSelected={false}
              isArabic={isArabic}
              onClick={() => onOpenReport(report.id)}
            />
          ))}
        </div>

        <div
          className="absolute top-[62px] z-30 flex h-[128px] w-[156px] items-center justify-center overflow-hidden rounded-[1.1rem] border border-[rgba(255,255,255,0.72)] bg-[linear-gradient(180deg,#fbfcfd,#e7edf1)] shadow-[0_22px_34px_rgba(15,23,42,0.14)]"
          style={{
            transform: isActive ? 'rotateX(32deg) translateY(12px)' : 'rotateX(0deg) translateY(0)',
            transformOrigin: 'bottom center',
            transition: 'transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.52),transparent_62%)]" />
          <div className="relative h-[70px] w-[70px] overflow-hidden rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/88 shadow-[var(--shadow-sm)]">
            <Image src={company.logo} alt={company.name[locale]} fill className="object-contain p-2" />
          </div>
        </div>

        {extraCount > 0 ? (
          <div
            className="absolute right-[22px] top-[6px] z-40 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white shadow-[var(--shadow-sm)]"
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 400ms ease',
            }}
          >
            +{extraCount} {text.moreReports}
          </div>
        ) : null}
      </div>

      <div className={cn('relative z-10 text-center', isArabic && 'text-center')}>
        <h2 className={cn('text-xl font-bold tracking-tight', isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading')}>
          {company.name[locale]}
        </h2>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            {company.sector[locale]}
          </span>
          <span className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]">
            {orderedReports.length} {text.reportsCount}
          </span>
        </div>

        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {text.hoverHint}
        </p>
      </div>
    </article>
  );
}

export default function ReportsPage() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const text = copy[locale];
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [openingSession, setOpeningSession] = useState(false);
  const [userSessions, setUserSessions] = useState<BackendSession[]>([]);
  const [sessionConflict, setSessionConflict] = useState<{ reportId: string; sessionId: string } | null>(null);

  const [query, setQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ companyId: string; reportId: string } | null>(null);
  const [openFilter, setOpenFilter] = useState<'sector' | 'year' | 'sort' | null>(null);

  useEffect(() => {
    getReports()
      .then((data) => setCompanies(adaptCompanies(data)))
      .catch(() => setCompanies([]))
      .finally(() => setLoadingData(false));
    listSessions().then(setUserSessions).catch(() => {});
  }, []);

  const handleOpenSession = useCallback(async (reportId: string) => {
    const existing = userSessions.find((s) => s.reports?.id === reportId);
    if (existing) {
      setSessionConflict({ reportId, sessionId: existing.id });
      return;
    }
    setOpeningSession(true);
    try {
      const session = await createSession(reportId);
      router.push(`/workspace/${session.id}`);
    } catch {
      setOpeningSession(false);
    }
  }, [router, userSessions]);

  const handleOpenExistingSession = useCallback(() => {
    if (sessionConflict) router.push(`/workspace/${sessionConflict.sessionId}`);
  }, [router, sessionConflict]);

  const handleForceNewSession = useCallback(async () => {
    if (!sessionConflict) return;
    const { reportId } = sessionConflict;
    setSessionConflict(null);
    setOpeningSession(true);
    try {
      const session = await createSession(reportId);
      router.push(`/workspace/${session.id}`);
    } catch {
      setOpeningSession(false);
    }
  }, [router, sessionConflict]);

  // Filters stay local for now. When the reports list gets large, move this to the API.
  const sectors = useMemo(() => Array.from(new Set(companies.map((company) => company.sector[locale]))), [companies, locale]);
  const years = useMemo(
    () =>
      Array.from(new Set(companies.flatMap((company) => company.reports.map((report) => report.year)))).sort(
        (a, b) => Number(b) - Number(a)
      ),
    [companies]
  );

  const filteredCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const result = companies.filter((company) => {
      const matchesSector = sectorFilter === 'all' || company.sector[locale] === sectorFilter;
      const matchesYear = yearFilter === 'all' || company.reports.some((report) => report.year === yearFilter);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        company.name[locale].toLowerCase().includes(normalizedQuery) ||
        company.reports.some((report) => report.title[locale].toLowerCase().includes(normalizedQuery));

      return matchesSector && matchesYear && matchesQuery;
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name[locale].localeCompare(b.name[locale]);
      }

      const aYear = Math.max(...a.reports.map((report) => Number(report.year)));
      const bYear = Math.max(...b.reports.map((report) => Number(report.year)));
      return sortBy === 'newest' ? bYear - aYear : aYear - bYear;
    });
  }, [companies, locale, query, sectorFilter, sortBy, yearFilter]);

  const selectedCompany = modalState ? companies.find((company) => company.id === modalState.companyId) ?? null : null;
  const selectedSortLabel =
    sortBy === 'newest' ? text.newest : sortBy === 'oldest' ? text.oldest : text.alphabetical;
  const selectedSectorLabel = sectorFilter === 'all' ? text.allSectors : sectorFilter;
  const selectedYearLabel = yearFilter === 'all' ? text.allYears : yearFilter;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-[1280px]">
          <section className="surface-card relative z-40 overflow-visible rounded-[2.2rem] px-7 py-8 md:px-10 md:py-10">
            <div className={cn('max-w-3xl', isArabic ? 'text-right' : 'text-left')}>
              <span className="text-sm font-semibold text-[var(--brand)]">{text.badge}</span>
              <h1
                className={cn(
                  'mt-4 text-4xl font-bold tracking-tight md:text-5xl',
                  isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                )}
              >
                {text.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted-foreground)] md:text-lg">{text.description}</p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_0.8fr_0.6fr_0.7fr]">
              <label className="surface-card flex items-center gap-3 rounded-[1.4rem] border border-[var(--border)] bg-[var(--card-strong)]/80 px-4 py-3 shadow-[var(--shadow-sm)]">
                <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={text.searchPlaceholder}
                  className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                />
              </label>

              <FilterDropdown
                icon={<SlidersHorizontal className="h-4 w-4" />}
                label={selectedSectorLabel}
                value={sectorFilter}
                options={[
                  { value: 'all', label: text.allSectors },
                  ...sectors.map((sector) => ({ value: sector, label: sector })),
                ]}
                isOpen={openFilter === 'sector'}
                onToggle={() => setOpenFilter((current) => (current === 'sector' ? null : 'sector'))}
                onSelect={(value) => {
                  setSectorFilter(value);
                  setOpenFilter(null);
                }}
                align={isArabic ? 'right' : 'left'}
              />

              <FilterDropdown
                icon={<CalendarRange className="h-4 w-4" />}
                label={selectedYearLabel}
                value={yearFilter}
                options={[
                  { value: 'all', label: text.allYears },
                  ...years.map((year) => ({ value: year, label: year })),
                ]}
                isOpen={openFilter === 'year'}
                onToggle={() => setOpenFilter((current) => (current === 'year' ? null : 'year'))}
                onSelect={(value) => {
                  setYearFilter(value);
                  setOpenFilter(null);
                }}
                align={isArabic ? 'right' : 'left'}
              />

              <FilterDropdown
                icon={<ArrowUpDown className="h-4 w-4" />}
                label={selectedSortLabel}
                value={sortBy}
                options={[
                  { value: 'newest', label: text.newest },
                  { value: 'oldest', label: text.oldest },
                  { value: 'alphabetical', label: text.alphabetical },
                ]}
                isOpen={openFilter === 'sort'}
                onToggle={() => setOpenFilter((current) => (current === 'sort' ? null : 'sort'))}
                onSelect={(value) => {
                  setSortBy(value as 'newest' | 'oldest' | 'alphabetical');
                  setOpenFilter(null);
                }}
                align={isArabic ? 'right' : 'left'}
              />
            </div>

            <div className={cn('mt-5 text-sm font-medium text-[var(--muted-foreground)]', isArabic ? 'text-right' : 'text-left')}>
              {filteredCompanies.length} {text.resultsCount}
            </div>
          </section>

          {loadingData ? (
            <section className="mt-10 flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
            </section>
          ) : filteredCompanies.length > 0 ? (
            <section className="relative z-10 mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCompanies.map((company) => (
                <CompanyFolder
                  key={company.id}
                  company={company}
                  locale={locale}
                  isActive={activeFolderId === company.id}
                  onActivate={() => setActiveFolderId(company.id)}
                  onDeactivate={() => setActiveFolderId((current) => (current === company.id ? null : current))}
                  onOpenReport={(reportId) => setModalState({ companyId: company.id, reportId })}
                  text={text}
                />
              ))}
            </section>
          ) : (
            <section className="surface-card mt-8 rounded-[2rem] px-6 py-12 text-center shadow-[var(--shadow-md)]">
              <h2 className={cn('text-2xl font-bold', isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading')}>
                {text.emptyTitle}
              </h2>
              <p className="mt-3 text-[var(--muted-foreground)]">{text.emptyDescription}</p>
            </section>
          )}
        </div>
      </main>

      <FooterSection />

      <ReportSessionModal
        company={selectedCompany}
        selectedReportId={modalState?.reportId ?? null}
        isArabic={isArabic}
        onClose={() => setModalState(null)}
        onNavigate={(reportId) => setModalState((current) => (current ? { ...current, reportId } : current))}
        onOpenSession={handleOpenSession}
        openingSession={openingSession}
        text={text}
      />

      {sessionConflict ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" onClick={() => setSessionConflict(null)}>
          <div
            className={cn('w-full max-w-md overflow-hidden rounded-[2rem] bg-[var(--card-strong)] p-8 shadow-[var(--shadow-lg)]', isArabic ? 'text-right' : 'text-left')}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={cn('text-xl font-bold', isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading')}>
              {text.conflictTitle}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{text.conflictBody}</p>
            <div className={cn('mt-6 flex gap-3', isArabic ? 'flex-row-reverse' : '')}>
              <button
                type="button"
                onClick={handleOpenExistingSession}
                className="flex-1 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]"
              >
                {text.conflictOpenExisting}
              </button>
              <button
                type="button"
                onClick={handleForceNewSession}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--brand)]/40"
              >
                {text.conflictCreateNew}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
