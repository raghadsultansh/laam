'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Loader2, RefreshCw } from 'lucide-react';
import { getReportSummary, generateReportSummary } from '@/lib/api';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

type State = 'idle' | 'generating' | 'polling' | 'ready' | 'error';

const copy = {
  en: {
    emptyTitle: 'No summary yet',
    emptyDesc: 'Generate a structured summary of this annual report — key findings, financials, risks, and auditor notes — exported as a downloadable PDF.',
    generateBtn: 'Generate Summary',
    generatingTitle: 'Generating summary…',
    generatingDesc: 'This usually takes 30–60 seconds. We\'re reading the report and writing a structured analysis.',
    downloadBtn: 'Download PDF',
    regenerate: 'Regenerate',
    errorTitle: 'Generation failed',
    errorDesc: 'Something went wrong. Please try again.',
    retry: 'Try again',
  },
  ar: {
    emptyTitle: 'لا يوجد ملخص بعد',
    emptyDesc: 'أنشئ ملخصًا منظّمًا لهذا التقرير السنوي يشمل أبرز النتائج والأرقام المالية والمخاطر وملاحظات المدقق — قابل للتنزيل كملف PDF.',
    generateBtn: 'إنشاء ملخص',
    generatingTitle: 'جارٍ إنشاء الملخص…',
    generatingDesc: 'يستغرق الأمر عادةً ٣٠–٦٠ ثانية. نقرأ التقرير ونكتب تحليلًا منظّمًا.',
    downloadBtn: 'تنزيل PDF',
    regenerate: 'إعادة إنشاء',
    errorTitle: 'فشل الإنشاء',
    errorDesc: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    retry: 'حاول مجددًا',
  },
} as const;

export function SummaryTab({ reportId }: { reportId: string | undefined }) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const t = copy[locale];

  const [state, setState] = useState<State>('idle');
  const [summaryUrl, setSummaryUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount — check if a summary already exists
  useEffect(() => {
    if (!reportId) return;
    getReportSummary(reportId).then((res) => {
      if (res?.url) {
        setSummaryUrl(res.url);
        setState('ready');
      }
    });
  }, [reportId]);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    if (!reportId) return;
    setState('polling');
    pollRef.current = setInterval(async () => {
      const res = await getReportSummary(reportId);
      if (res?.url) {
        setSummaryUrl(res.url);
        setState('ready');
        stopPolling();
      }
    }, 4000);
  }

  async function handleGenerate() {
    if (!reportId) return;
    setState('generating');
    try {
      await generateReportSummary(reportId);
      startPolling();
    } catch {
      setState('error');
    }
  }

  function handleRegenerate() {
    setSummaryUrl(null);
    setState('idle');
    stopPolling();
  }

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  const isLoading = state === 'generating' || state === 'polling';

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[1.8rem] bg-[var(--card)] shadow-[var(--shadow-md)] ${isArabic ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-content-center rounded-xl bg-[var(--brand-soft)]">
            <FileText className="h-4 w-4 text-[var(--brand)]" />
          </div>
          <span className={`text-base font-bold ${isArabic ? xbShafigh.className : 'display-heading'}`}>
            {isArabic ? 'الملخص' : 'Summary'}
          </span>
        </div>

        {state === 'ready' && (
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <a
              href={summaryUrl!}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]"
            >
              <Download className="h-4 w-4" />
              {t.downloadBtn}
            </a>
            <button
              type="button"
              onClick={handleRegenerate}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t.regenerate}
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {state === 'idle' && (
          <div className={`flex max-w-sm flex-col items-center gap-5 px-6 py-10 text-center`}>
            <div className="grid h-16 w-16 place-content-center rounded-2xl bg-[var(--brand-soft)]">
              <FileText className="h-7 w-7 text-[var(--brand)]" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isArabic ? xbShafigh.className : 'display-heading'}`}>
                {t.emptyTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t.emptyDesc}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!reportId}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {t.generateBtn}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex max-w-sm flex-col items-center gap-5 px-6 py-10 text-center">
            <div className="relative grid h-16 w-16 place-content-center rounded-2xl bg-[var(--brand-soft)]">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--brand)]" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isArabic ? xbShafigh.className : 'display-heading'}`}>
                {t.generatingTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t.generatingDesc}</p>
            </div>
            {/* Animated progress bar */}
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--border)]">
              <div className="h-full animate-[progress_2s_ease-in-out_infinite] rounded-full bg-[var(--brand)]" />
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="flex max-w-sm flex-col items-center gap-5 px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-content-center rounded-2xl bg-red-50">
              <FileText className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isArabic ? xbShafigh.className : 'display-heading'}`}>
                {t.errorTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t.errorDesc}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]"
            >
              {t.retry}
            </button>
          </div>
        )}

        {state === 'ready' && summaryUrl && (
          <iframe
            src={summaryUrl}
            className="h-full w-full border-0"
            title="Report Summary PDF"
          />
        )}
      </div>
    </div>
  );
}
