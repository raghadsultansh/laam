'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';

// Real companies — same logos used on the reports page
const FEATURED = [
  {
    id: 'rajhi',
    logo: '/company-logos/Al_Rajhi_Bank_Logo.png',
    name:   { en: 'Al Rajhi Bank',      ar: 'مصرف الراجحي'      },
    sector: { en: 'Banking',             ar: 'القطاع البنكي'      },
    years:  ['2024', '2023', '2022', '2021', '2020'],
  },
  {
    id: 'aramco',
    logo: '/company-logos/Saudi Aramco Logo.png',
    name:   { en: 'Saudi Aramco',        ar: 'أرامكو السعودية'   },
    sector: { en: 'Energy',              ar: 'الطاقة'             },
    years:  ['2024', '2023', '2022', '2021'],
  },
  {
    id: 'stc',
    logo: '/company-logos/Stc-logo.png',
    name:   { en: 'STC',                 ar: 'إس تي سي'          },
    sector: { en: 'Technology',          ar: 'التقنية'            },
    years:  ['2024', '2023', '2022', '2021', '2020'],
  },
  {
    id: 'sabic',
    logo: '/company-logos/SABIC Logo.png',
    name:   { en: 'SABIC',               ar: 'سابك'               },
    sector: { en: 'Industrial',          ar: 'الصناعة'            },
    years:  ['2024', '2023', '2022', '2021'],
  },
] as const;

export function FeaturedCompaniesSection() {
  const { locale } = useAppPreferences();
  const copy     = siteCopy[locale].companies;
  const isArabic = locale === 'ar';

  return (
    <section id="companies" className="section-anchor px-4 py-20 md:px-6">
      <div className="surface-card mx-auto max-w-7xl rounded-[2.4rem] px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-[var(--brand)]">{copy.badge}</p>
          <h2
            className={`section-title mt-6 ${
              isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
            }`}
          >
            {copy.title}
          </h2>
          <p className="section-subtitle mt-4">{copy.description}</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* Static landing preview only. The full report library lives in /reports. */}
          {FEATURED.map((company) => (
            <article key={company.id} className="surface-card card-hover rounded-[1.75rem] p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                  <Image
                    src={company.logo}
                    alt={company.name[locale]}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className={isArabic ? 'text-right' : 'text-left'}>
                  <h3
                    className={`text-lg font-extrabold tracking-tight ${
                      isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                    }`}
                  >
                    {company.name[locale]}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{company.sector[locale]}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-[var(--background)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {copy.cardLabel}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {company.years.map((year) => (
                    <span
                      key={year}
                      className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                    >
                      {year}
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href="/reports"
                className="mt-5 inline-flex rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]"
              >
                {copy.cardCta}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/reports"
            className="inline-flex rounded-xl border border-[var(--border)] px-6 py-3.5 text-sm font-semibold transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
