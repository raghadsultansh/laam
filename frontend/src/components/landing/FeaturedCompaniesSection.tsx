'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { siteCopy } from '@/lib/site-copy';
import { getReports, type BackendCompanyWithReports } from '@/lib/api';

// Static fallback — shown before API responds or if API is unreachable
const FALLBACK: BackendCompanyWithReports[] = [
  {
    id: 'rajhi',
    name_en: 'Al Rajhi Bank',
    name_ar: 'مصرف الراجحي',
    sector: 'Banking',
    logo_url: '/company-logos/Al_Rajhi_Bank_Logo.png',
    reports: [
      { id: '1', status: 'ready', fiscal_year: '2024', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
      { id: '2', status: 'ready', fiscal_year: '2023', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
      { id: '3', status: 'ready', fiscal_year: '2022', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
    ],
  },
  {
    id: 'aramco',
    name_en: 'Saudi Aramco',
    name_ar: 'أرامكو السعودية',
    sector: 'Energy',
    logo_url: '/company-logos/Saudi Aramco Logo.png',
    reports: [
      { id: '4', status: 'ready', fiscal_year: '2024', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
      { id: '5', status: 'ready', fiscal_year: '2023', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
    ],
  },
  {
    id: 'stc',
    name_en: 'STC',
    name_ar: 'إس تي سي',
    sector: 'Technology',
    logo_url: '/company-logos/Stc-logo.png',
    reports: [
      { id: '6', status: 'ready', fiscal_year: '2024', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
      { id: '7', status: 'ready', fiscal_year: '2023', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
    ],
  },
  {
    id: 'sabic',
    name_en: 'SABIC',
    name_ar: 'سابك',
    sector: 'Chemicals',
    logo_url: '/company-logos/SABIC Logo.png',
    reports: [
      { id: '8', status: 'ready', fiscal_year: '2024', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
      { id: '9', status: 'ready', fiscal_year: '2023', title: null, file_hash_sha256: null, qdrant_collection_id: null, companies: null },
    ],
  },
];

const SECTOR_AR: Record<string, string> = {
  Banking: 'القطاع البنكي',
  Energy: 'الطاقة',
  Technology: 'التقنية',
  Chemicals: 'البتروكيماويات',
  Telecom: 'الاتصالات',
  Insurance: 'التأمين',
  'Real Estate': 'العقارات',
};

export function FeaturedCompaniesSection() {
  const { locale } = useAppPreferences();
  const copy = siteCopy[locale].companies;
  const isArabic = locale === 'ar';

  const [companies, setCompanies] = useState<BackendCompanyWithReports[]>(FALLBACK);

  useEffect(() => {
    getReports()
      .then((data) => {
        if (data && data.length > 0) {
          setCompanies(data.slice(0, 4));
        }
      })
      .catch(() => {/* keep fallback */});
  }, []);

  return (
    <section id="companies" className="section-anchor px-4 py-20 md:px-6 md:py-28">
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
          {companies.map((company) => {
            const nameDisplay = isArabic ? (company.name_ar || company.name_en) : company.name_en;
            const sectorDisplay = isArabic
              ? (SECTOR_AR[company.sector] ?? company.sector)
              : company.sector;
            const years = company.reports
              .filter((r) => r.status === 'ready')
              .map((r) => r.fiscal_year)
              .filter(Boolean)
              .sort((a, b) => (b ?? '').localeCompare(a ?? ''));

            return (
              <article key={company.id} className="surface-card card-hover rounded-[1.75rem] p-5">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)]">
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt={nameDisplay}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="grid h-full w-full place-content-center text-xl font-bold text-[var(--brand)]">
                        {nameDisplay.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <h3
                      className={`text-lg font-extrabold tracking-tight ${
                        isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                      }`}
                    >
                      {nameDisplay}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">{sectorDisplay}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[var(--background)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {copy.cardLabel}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {years.length > 0 ? years.map((year) => (
                      <span
                        key={year}
                        className="rounded-full border border-[var(--border)] bg-[var(--card-strong)] px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)]"
                      >
                        {year}
                      </span>
                    )) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </div>
                </div>

                <Link
                  href="/reports"
                  className="mt-5 inline-flex rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]"
                >
                  {copy.cardCta}
                </Link>
              </article>
            );
          })}
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
