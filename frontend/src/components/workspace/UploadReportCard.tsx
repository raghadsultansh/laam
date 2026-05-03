'use client';

import { CheckCircle2, FileUp, Loader2, ShieldAlert } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

const statuses = {
  en: ['Uploading report', 'Extracting content', 'Structuring report', 'Preparing session', 'Ready'],
  ar: ['رفع التقرير', 'استخراج المحتوى', 'هيكلة التقرير', 'تجهيز الجلسة', 'جاهز'],
};

// Upload modal is a visual flow for now.
// Wire the dropzone, validation, and processing status to the backend upload API later.
export function UploadReportCard({
  onClose,
}: {
  onClose: () => void;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-[2rem] bg-[var(--card-strong)] p-6 shadow-[var(--shadow-lg)] md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={isArabic ? 'text-right' : 'text-left'}>
          <h2 className={`text-2xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
            {isArabic ? 'رفع تقرير جديد' : 'Upload a New Report'}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
            {isArabic
              ? 'ارفع ملف PDF إذا لم تجد التقرير الذي تحتاجه داخل المكتبة الحالية.'
              : 'Upload a PDF if you cannot find the report you need in the current library.'}
          </p>
        </div>

        <div className="mt-6 rounded-[1.6rem] border-2 border-dashed border-[var(--brand)]/35 bg-[var(--background)] p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <FileUp className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
            {isArabic ? 'اسحب الملف هنا أو اختره من جهازك' : 'Drag a PDF here or choose it from your device'}
          </p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">PDF • up to 50 MB</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {statuses[locale].map((status, index) => (
            <div key={status} className="flex items-center gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--background)] px-4 py-3">
              {index < 2 ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
              ) : index === 4 ? (
                <CheckCircle2 className="h-4 w-4 text-[var(--brand)]" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-[var(--muted-foreground)]" />
              )}
              <span className="text-sm font-medium text-[var(--foreground)]">{status}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]">
            {isArabic ? 'بدء الرفع' : 'Start Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
