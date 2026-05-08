'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import type { Source } from '@/lib/api';

const CITATION_RE = /\[Page[:\s]+\d+\s*\|[^\]]*\]/g;

function extractFinalAnswer(raw: string): string {
  let text = raw;
  const marker = text.indexOf('**Final Answer**:');
  if (marker !== -1) text = text.slice(marker + '**Final Answer**:'.length).trim();
  else {
    const marker2 = text.indexOf('Final Answer:');
    if (marker2 !== -1) text = text.slice(marker2 + 'Final Answer:'.length).trim();
  }
  return text.replace(CITATION_RE, '').replace(/\s{2,}/g, ' ').trim();
}

export function MessageBubble({
  message,
  role,
  sources,
  onSourceClick,
}: {
  message: string;
  role: 'user' | 'assistant';
  sources?: Source[];
  onSourceClick?: (sources: Source[], index: number) => void;
}) {
  const { locale } = useAppPreferences();
  const isUser = role === 'user';
  const isArabic = locale === 'ar';
  const displayText = isUser ? message : extractFinalAnswer(message);

  return (
    <div dir="ltr" className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 shadow-[var(--shadow-sm)] ${
          isUser
            ? 'border border-[color:var(--brand-alt)]/35 bg-[var(--brand)] text-white'
            : 'border border-[var(--border)] bg-[var(--card-strong)] text-[var(--foreground)]'
        } ${isArabic ? 'text-right' : 'text-left'}`}
      >
        <p className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isUser ? 'text-white/70' : 'text-[var(--muted-foreground)]'}`}>
          {isUser ? (isArabic ? 'أنت' : 'You') : isArabic ? 'المساعد' : 'Assistant'}
        </p>
        <p>{displayText}</p>

        {!isUser && sources && sources.length > 0 ? (
          <div className="mt-3 border-t border-[var(--border)] pt-2">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              {isArabic ? 'المصادر' : 'Sources'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSourceClick?.(sources, i)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white"
                >
                  {src.page_number != null ? (
                    <span className="opacity-70">{isArabic ? `ص${src.page_number}` : `p.${src.page_number}`}</span>
                  ) : null}
                  <span className="max-w-[160px] truncate">
                    {src.section_title || (isArabic ? 'مصدر' : 'Source')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
