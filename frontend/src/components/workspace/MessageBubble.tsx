'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import type { Source } from '@/lib/api';

// Strip any inline citation bracket — English [Page X | Section Y] or Arabic [صفحة X | قسم: Y]
// All citation formats share a pipe separator inside the brackets.
const CITATION_RE = /\[[^\]]*\|[^\]]*\]/g;

function extractFinalAnswer(raw: string): string {
  let text = raw;
  // Try all known markers (English bold, English plain, Arabic bold, Arabic plain)
  const MARKERS = [
    '**Final Answer**:',
    'Final Answer:',
    '**الإجابة النهائية**:',  // colon outside bold — LLM mirrors English pattern
    '**الإجابة النهائية:**',  // colon inside bold — fallback variant
    'الإجابة النهائية:',
  ];
  for (const m of MARKERS) {
    const idx = text.indexOf(m);
    if (idx !== -1) { text = text.slice(idx + m.length).trim(); break; }
  }
  return text
    .replace(CITATION_RE, '')               // strip [Page X | ...] and [صفحة X | ...] citations
    .replace(/(\s+[،,]\s*)+/g, ' ')         // collapse orphaned comma runs (space-prefixed, safe for numbers like 19,731,186)
    .replace(/(\s+و\s*)+(?=[،,.]|$)/g, ' ') // collapse trailing "و و و" chains before punct or end
    .replace(/(\s*\.\s*){2,}/g, '.')        // collapse multiple periods into one
    .replace(/\s+\./g, '.')                 // remove space before period
    .replace(/:\./g, '.')                   // colon+period → single period
    .replace(/^[\s،,.]+/, '')               // strip leading punctuation junk
    .replace(/\s{2,}/g, ' ')
    .trim();
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
          {isUser ? (isArabic ? 'أنت' : 'You') : isArabic ? 'لامّ' : 'LAAM'}
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] transition hover:bg-[var(--brand)] hover:text-white"
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
