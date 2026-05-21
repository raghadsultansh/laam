'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, FileUp, Loader2, LockKeyhole, X } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { createSession, getReportStatus, uploadReport } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type Stage = 'idle' | 'selected' | 'uploading' | 'processing' | 'done' | 'error';

const PHASES = ['parsing', 'chunking', 'indexing', 'completed'] as const;
type Phase = (typeof PHASES)[number];

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

const copy = {
  en: {
    title: 'Upload a Report',
    subtitle: "Upload a PDF if you can't find the report you need in the library.",
    dropLabel: 'Drag a PDF here or click to browse',
    dropHint: 'PDF only · max 50 MB',
    uploadBtn: 'Start Upload',
    cancel: 'Cancel',
    openWorkspace: 'Open Workspace',
    phases: {
      parsing: 'Extracting content',
      chunking: 'Structuring report',
      indexing: 'Building search index',
      completed: 'Ready',
    } satisfies Record<Phase, string>,
    uploadingLabel: 'Uploading file…',
    duplicateNote: 'This file already exists in the library.',
    errorTitle: 'Upload failed',
    errorRetry: 'Try again',
    fileTooLarge: 'File exceeds the 50 MB limit.',
    notPdf: 'Only PDF files are accepted.',
    loginRequired: 'You must be signed in to upload a report.',
    loginBtn: 'Sign in',
  },
  ar: {
    title: 'رفع تقرير',
    subtitle: 'ارفع ملف PDF إذا لم تجد التقرير الذي تحتاجه في المكتبة.',
    dropLabel: 'اسحب ملف PDF هنا أو اضغط للاختيار',
    dropHint: 'PDF فقط · الحجم الأقصى 50 ميجابايت',
    uploadBtn: 'بدء الرفع',
    cancel: 'إلغاء',
    openWorkspace: 'فتح مساحة العمل',
    phases: {
      parsing: 'استخراج المحتوى',
      chunking: 'هيكلة التقرير',
      indexing: 'بناء فهرس البحث',
      completed: 'جاهز',
    } satisfies Record<Phase, string>,
    uploadingLabel: 'جارٍ رفع الملف…',
    duplicateNote: 'هذا الملف موجود بالفعل في المكتبة.',
    errorTitle: 'فشل الرفع',
    errorRetry: 'حاول مرة أخرى',
    fileTooLarge: 'حجم الملف يتجاوز 50 ميجابايت.',
    notPdf: 'يُقبل ملفات PDF فقط.',
    loginRequired: 'يجب تسجيل الدخول لرفع تقرير.',
    loginBtn: 'تسجيل الدخول',
  },
} as const;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadReportCard({ onClose }: { onClose: () => void }) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const t = copy[locale];
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [reportId, setReportId] = useState('');
  const [currentPhase, setCurrentPhase] = useState<Phase>('parsing');
  const [percent, setPercent] = useState(0);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [openingSession, setOpeningSession] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function validate(f: File): string {
    if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') return t.notPdf;
    if (f.size > MAX_SIZE_BYTES) return t.fileTooLarge;
    return '';
  }

  function pickFile(f: File) {
    const err = validate(f);
    if (err) {
      setValidationError(err);
      setFile(null);
      setStage('idle');
      return;
    }
    setValidationError('');
    setFile(f);
    setStage('selected');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await getReportStatus(id);
        if (status.current_phase) setCurrentPhase(status.current_phase as Phase);
        if (typeof status.percent_complete === 'number') setPercent(status.percent_complete);

        if (status.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setCurrentPhase('completed');
          setPercent(100);
          setStage('done');
        } else if (status.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setErrorMsg(status.error_message || 'Processing failed.');
          setStage('error');
        }
      } catch {
        // keep polling on transient errors
      }
    }, 3000);
  }

  async function handleUpload() {
    if (!file) return;
    setStage('uploading');
    setValidationError('');

    try {
      const result = await uploadReport(file);
      const id: string = result.report_id;
      setReportId(id);

      if (result.is_duplicate && result.status === 'ready') {
        setIsDuplicate(true);
        setCurrentPhase('completed');
        setPercent(100);
        setStage('done');
        return;
      }

      // Start polling whether duplicate-but-still-processing or brand new
      setStage('processing');
      startPolling(id);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const msg = axiosErr?.response?.data?.detail ?? 'Upload failed. Please try again.';
      setErrorMsg(msg);
      setStage('error');
    }
  }

  async function handleOpenWorkspace() {
    if (!reportId) return;
    setOpeningSession(true);
    try {
      const session = await createSession(reportId);
      router.push(`/workspace/${session.id}`);
      onClose();
    } catch {
      setOpeningSession(false);
    }
  }

  function handleReset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStage('idle');
    setFile(null);
    setValidationError('');
    setReportId('');
    setCurrentPhase('parsing');
    setPercent(0);
    setIsDuplicate(false);
    setErrorMsg('');
    setOpeningSession(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Phase step helpers
  const phaseIndex = PHASES.indexOf(currentPhase);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      onClick={stage === 'idle' || stage === 'selected' ? onClose : undefined}
    >
      <div
        className="w-full max-w-lg rounded-[2rem] bg-[var(--card-strong)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <h2 className={`text-xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
              {t.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>
          {stage === 'idle' || stage === 'selected' ? (
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-content-center rounded-full bg-[var(--background)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="p-6">
          {/* Not logged in */}
          {isLoggedIn === false && (
            <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-14 w-14 place-content-center rounded-2xl bg-[var(--brand-soft)]">
                <LockKeyhole className="h-6 w-6 text-[var(--brand)]" />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">{t.loginRequired}</p>
              <a
                href="/login"
                className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]"
              >
                {t.loginBtn}
              </a>
            </div>
          )}

          {/* Idle / File selected */}
          {isLoggedIn === true && (stage === 'idle' || stage === 'selected') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleInputChange}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-[1.6rem] border-2 border-dashed p-8 text-center transition ${
                  isDragging
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : stage === 'selected'
                    ? 'border-[var(--brand)]/60 bg-[var(--background)]'
                    : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--brand)]/40'
                }`}
              >
                <div className="mx-auto grid h-12 w-12 place-content-center rounded-2xl bg-[var(--brand-soft)]">
                  <FileUp className="h-5 w-5 text-[var(--brand)]" />
                </div>

                {stage === 'selected' && file ? (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{file.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{t.dropLabel}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t.dropHint}</p>
                  </div>
                )}
              </div>

              {validationError ? (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:bg-red-900/50 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {validationError}
                </div>
              ) : null}

              <div className={`mt-5 flex gap-3 ${isArabic ? 'flex-row-reverse' : 'justify-end'}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  disabled={stage !== 'selected'}
                  onClick={handleUpload}
                  className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-40"
                >
                  {t.uploadBtn}
                </button>
              </div>
            </>
          )}

          {/* Uploading */}
          {stage === 'uploading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
              <p className="text-sm font-semibold text-[var(--foreground)]">{t.uploadingLabel}</p>
            </div>
          )}

          {/* Processing */}
          {stage === 'processing' && (
            <div className="space-y-5">
              {/* Progress bar */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[var(--muted-foreground)]">
                  <span>{t.phases[currentPhase]}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--background)]">
                  <div
                    className="h-full rounded-full bg-[var(--brand)] transition-all duration-700"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {PHASES.map((phase, i) => {
                  const isDone = i < phaseIndex;
                  const isActive = i === phaseIndex;
                  return (
                    <div
                      key={phase}
                      className={`flex items-center gap-3 rounded-[1rem] px-4 py-3 ${
                        isActive
                          ? 'bg-[var(--brand-soft)]'
                          : isDone
                          ? 'bg-[var(--background)]'
                          : 'bg-[var(--background)] opacity-40'
                      } ${isArabic ? 'flex-row-reverse' : ''}`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--brand)]" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[var(--border)]" />
                      )}
                      <span className={`text-sm font-medium ${isActive ? 'text-[var(--brand)]' : 'text-[var(--foreground)]'}`}>
                        {t.phases[phase]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-[var(--muted-foreground)]">
                {isArabic ? 'قد يستغرق هذا بضع دقائق…' : 'This may take a few minutes…'}
              </p>
            </div>
          )}

          {/* Done */}
          {stage === 'done' && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="grid h-16 w-16 place-content-center rounded-2xl bg-[var(--brand-soft)]">
                <CheckCircle2 className="h-8 w-8 text-[var(--brand)]" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">
                  {isArabic ? 'التقرير جاهز' : 'Report ready'}
                </p>
                {isDuplicate && (
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.duplicateNote}</p>
                )}
              </div>
              <button
                type="button"
                disabled={openingSession}
                onClick={handleOpenWorkspace}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-60"
              >
                {openingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.openWorkspace}
              </button>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="grid h-14 w-14 place-content-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--foreground)]">{t.errorTitle}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)]"
                >
                  {t.errorRetry}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
