'use client';

import { FolderGit2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';

const icons = [Sparkles, FolderGit2, ShieldCheck];

export function FeaturesSection() {
  const { locale } = useAppPreferences();
  const copy = siteCopy[locale].trust;
  const isArabic = locale === 'ar';

  return (
    <section className="px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-8 shadow-[var(--shadow-md)] md:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold text-[var(--brand)]">{copy.badge}</p>
            <h2 className={`section-title mt-6 ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h2>
            <p className="section-subtitle mt-4">{copy.description}</p>
          </div>

          <div className="grid gap-4">
            {copy.items.map((item, index) => {
              const Icon = icons[index];
              return (
                <article key={item.title} className="card-hover rounded-[1.5rem] border border-[var(--border)] bg-[var(--card-strong)]/70 p-5 shadow-[var(--shadow-sm)]">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-extrabold tracking-tight ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{item.description}</p>
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
