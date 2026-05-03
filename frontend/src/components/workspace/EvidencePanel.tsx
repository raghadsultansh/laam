'use client';

import { useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

const sources = {
  en: [
    { title: 'Revenue section', page: 'Page 42', snippet: 'Revenue increased across the year with stronger contribution from core operations.' },
    { title: 'Risk factors', page: 'Page 117', snippet: 'The report highlights commodity exposure and market volatility as key watch areas.' },
  ],
  ar: [
    { title: 'قسم الإيرادات', page: 'الصفحة 42', snippet: 'ارتفعت الإيرادات خلال العام مع مساهمة أقوى من العمليات الأساسية.' },
    { title: 'عوامل المخاطر', page: 'الصفحة 117', snippet: 'يشير التقرير إلى التعرض للسلع وتقلبات السوق كعوامل يجب متابعتها.' },
  ],
};

const info = {
  en: [
    { label: 'Attached reports', value: 'Aramco 2024, STC 2023' },
    { label: 'Sector coverage', value: 'Energy, Technology' },
    { label: 'Processing status', value: 'Ready' },
  ],
  ar: [
    { label: 'التقارير المرفقة', value: 'أرامكو 2024، إس تي سي 2023' },
    { label: 'القطاعات', value: 'الطاقة، التقنية' },
    { label: 'حالة المعالجة', value: 'جاهز' },
  ],
};

export function EvidencePanel({
  onTogglePanel,
}: {
  onTogglePanel: () => void;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [tab, setTab] = useState<'sources' | 'info'>('sources');

  // Right panel is optional support content. It should not block the main chat flow.
  // Replace these arrays with citations/report metadata from the answer API later.
  return (
    <aside className="h-[calc(100vh-5.25rem)] w-[340px] rounded-[1.15rem] bg-[var(--card-strong)] p-4 shadow-[var(--shadow-md)]">
      <div className={`mb-4 flex items-center ${isArabic ? 'justify-start' : 'justify-end'}`}>
        <button
          type="button"
          onClick={onTogglePanel}
          className="grid h-10 w-10 place-content-center rounded-2xl bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--muted)]"
          aria-label={isArabic ? 'إغلاق لوحة المعلومات' : 'Close info panel'}
          title={isArabic ? 'إغلاق لوحة المعلومات' : 'Close info panel'}
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

      <div className="mt-4 space-y-3">
        {tab === 'sources'
          ? sources[locale].map((source) => (
              <div key={source.title} className="rounded-[1.2rem] bg-[var(--card-strong)]/76 p-4 shadow-[var(--shadow-sm)]">
                <p className={`text-sm font-semibold text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} arabic-display` : ''}`}>{source.title}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--brand)]">{source.page}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{source.snippet}</p>
              </div>
            ))
          : info[locale].map((item) => (
              <div key={item.label} className="rounded-[1.2rem] bg-[var(--card-strong)]/76 p-4 shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{item.value}</p>
              </div>
            ))}
      </div>
    </aside>
  );
}
