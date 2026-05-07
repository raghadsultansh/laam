'use client';

import { useEffect, useRef, useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import type { Source } from '@/lib/api';

export function EvidencePanel({
  onTogglePanel,
  sources,
  reportLabel,
  reportStatus,
  highlightedIndex,
}: {
  onTogglePanel: () => void;
  sources?: Source[];
  reportLabel?: string;
  reportStatus?: string;
  highlightedIndex?: number;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [tab, setTab] = useState<'sources' | 'info'>('sources');
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll to and briefly flash highlighted source
  useEffect(() => {
    if (highlightedIndex == null) return;
    setTab('sources');
    const el = cardRefs.current[highlightedIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [highlightedIndex]);

  const infoItems = isArabic
    ? [
        { label: 'التقرير المرفق', value: reportLabel || '—' },
        { label: 'حالة المعالجة', value: reportStatus === 'ready' ? 'جاهز' : reportStatus || '—' },
      ]
    : [
        { label: 'Attached report', value: reportLabel || '—' },
        { label: 'Processing status', value: reportStatus === 'ready' ? 'Ready' : reportStatus || '—' },
      ];

  return (
    <aside className="h-[calc(100vh-5.25rem)] w-[340px] rounded-[1.15rem] bg-[var(--card-strong)] p-4 shadow-[var(--shadow-md)]">
      <div className={`mb-4 flex items-center ${isArabic ? 'justify-start' : 'justify-end'}`}>
        <button
          type="button"
          onClick={onTogglePanel}
          className="grid h-10 w-10 place-content-center rounded-2xl bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted)]"
          aria-label={isArabic ? 'إغلاق لوحة المعلومات' : 'Close info panel'}
        >
          <PanelRightClose className="h-4 w-4 text-[var(--brand)]" />
        </button>
      </div>

      <div className="flex rounded-[1.2rem] bg-[var(--background)] p-1">
        <button
          type="button"
          onClick={() => setTab('sources')}
          className={`flex-1 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition ${
            tab === 'sources' ? 'bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'text-[var(--muted-foreground)]'
          }`}
        >
          {isArabic ? 'المصادر' : 'Sources'}
        </button>
        <button
          type="button"
          onClick={() => setTab('info')}
          className={`flex-1 rounded-[0.9rem] px-3 py-2 text-sm font-semibold transition ${
            tab === 'info' ? 'bg-[var(--card-strong)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'text-[var(--muted-foreground)]'
          }`}
        >
          {isArabic ? 'معلومات التقرير' : 'Report Info'}
        </button>
      </div>

      <div className="mt-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 8rem)' }}>
        {tab === 'sources' ? (
          sources && sources.length > 0 ? (
            sources.map((src, i) => {
              const isHighlighted = highlightedIndex === i;
              return (
                <div
                  key={i}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className={`rounded-[1.2rem] p-4 shadow-[var(--shadow-sm)] transition-all duration-500 ${
                    isHighlighted
                      ? 'bg-[var(--brand-soft)] ring-2 ring-[var(--brand)]/40'
                      : 'bg-[var(--card-strong)]/76'
                  }`}
                >
                  <p className={`text-sm font-semibold text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} arabic-display` : ''}`}>
                    {src.section_title || (isArabic ? 'قسم غير معروف' : 'Unknown section')}
                  </p>
                  {src.page_number != null ? (
                    <p className="mt-1 text-xs font-semibold text-[var(--brand)]">
                      {isArabic ? `الصفحة ${src.page_number}` : `Page ${src.page_number}`}
                    </p>
                  ) : null}
                  {src.snippet ? (
                    <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{src.snippet}</p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
              {isArabic ? 'اسأل سؤالاً لعرض المصادر هنا.' : 'Ask a question to see sources here.'}
            </p>
          )
        ) : (
          infoItems.map((item) => (
            <div key={item.label} className="rounded-[1.2rem] bg-[var(--card-strong)]/76 p-4 shadow-[var(--shadow-sm)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
