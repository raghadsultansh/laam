'use client';

import { useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { updateSessionTitle } from '@/lib/api';

export function WorkspaceHeader({
  title,
  reportLabel,
  sessionId,
  onRenamed,
}: {
  title?: string;
  reportLabel?: string;
  sessionId?: string;
  onRenamed?: (newTitle: string) => void;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const displayTitle = title ?? (isArabic ? 'جلسة جديدة' : 'New Session');
  const displaySub = isArabic
    ? 'اسأل عن التقرير المرفق بهذه الجلسة.'
    : 'Ask questions about the report attached to this session.';

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    if (!sessionId) return;
    setEditValue(displayTitle);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditValue('');
  }

  async function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed || !sessionId || trimmed === displayTitle) { cancelEdit(); return; }
    setSaving(true);
    try {
      await updateSessionTitle(sessionId, trimmed);
      onRenamed?.(trimmed);
      setIsEditing(false);
    } catch { /* keep old title */ }
    setSaving(false);
  }

  return (
    <div className="px-3 py-3 md:px-6 md:py-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex flex-col items-start text-start">
        {isEditing ? (
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className={`flex-1 rounded-xl border border-[var(--brand)] bg-[var(--background)] px-3 py-1.5 text-2xl font-bold text-[var(--foreground)] outline-none ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
              autoFocus
            />
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              className="grid h-9 w-9 place-content-center rounded-xl bg-[var(--brand)] text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="grid h-9 w-9 place-content-center rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="group flex items-center gap-2">
            <h1
              onDoubleClick={startEdit}
              className={`cursor-default text-xl font-bold md:text-2xl ${sessionId ? 'select-none' : ''} ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
              title={sessionId ? (isArabic ? 'انقر مرتين للتعديل' : 'Double-click to rename') : undefined}
            >
              {displayTitle}
            </h1>
            {sessionId && (
              <button
                type="button"
                onClick={startEdit}
                className="opacity-0 group-hover:opacity-100 transition grid h-7 w-7 place-content-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                title={isArabic ? 'إعادة التسمية' : 'Rename'}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{displaySub}</p>

        {reportLabel ? (
          <div className="mt-3 flex w-fit max-w-full flex-wrap items-center justify-start gap-2">
            <span dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]">
              {reportLabel}
            </span>
            <span dir={isArabic ? 'rtl' : 'ltr'} className="rounded-full bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)]">
              {isArabic ? 'المحادثة جاهزة' : 'Chat ready'}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
