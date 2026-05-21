'use client';

import { BarChart3, FileSearch, MessageSquare } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';

// Icons matched to each feature: natural language chat, grounded document search, dashboard
const icons = [MessageSquare, FileSearch, BarChart3];

export function FeaturesSection() {
  const { locale } = useAppPreferences();
  const copy = siteCopy[locale].trust;
  const isArabic = locale === 'ar';

  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="surface-card mx-auto max-w-7xl rounded-[2.4rem] px-6 py-8 md:px-10 md:py-10">
        {/* Large centered heading above everything */}
        <div className="mb-7 text-center">
          <h2 className={`section-title ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
            {copy.badge}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

          {/* Text side */}
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className={`text-2xl font-bold leading-9 tracking-tight text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
              {copy.title}
            </p>
            <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)]">{copy.description}</p>
          </div>

          {/* Cards stacked vertically */}
          <div className="grid gap-3">
            {copy.items.map((item, index) => {
              const Icon = icons[index];
              return (
                <article key={item.title} className="card-hover rounded-[1.5rem] border border-[var(--border)] bg-[var(--card-strong)]/70 p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                      <h3 className={`text-base font-extrabold tracking-tight ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
