'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export function AuthShell({
  title,
  subtitle,
  children,
  contentWidthClassName = 'max-w-[430px]',
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  contentWidthClassName?: string;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  // Shared wrapper for login/register so both pages keep the same donor-style layout.
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-8 md:px-6 md:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute h-[60rem] w-[60rem] top-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(18,112,90,0.12),rgba(18,112,90,0.08)_40%,transparent_68%)] ${isArabic ? '-left-[24rem]' : '-right-[24rem]'}`} />
          <div className={`absolute h-[46rem] w-[46rem] top-1/2 -translate-y-1/2 rounded-full border border-[rgba(18,112,90,0.08)] ${isArabic ? '-left-[9rem]' : '-right-[9rem]'}`} />
          <div className={`absolute top-1/2 h-[36rem] w-[36rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(18,112,90,0.07),transparent_72%)] blur-2xl ${isArabic ? 'left-[12%]' : 'right-[12%]'}`} />
          <div className={`absolute h-3 w-3 top-[24%] rounded-full bg-[rgba(18,112,90,0.12)] ${isArabic ? 'left-[6%]' : 'right-[6%]'}`} />
          <div className={`absolute h-3 w-3 bottom-[18%] rounded-full bg-[rgba(18,112,90,0.12)] ${isArabic ? 'left-[11%]' : 'right-[11%]'}`} />
          <div className="absolute left-[44%] top-[48%] h-3 w-3 rounded-full bg-[rgba(18,112,90,0.12)]" />
        </div>

        <div className={`relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-[1280px] items-center ${isArabic ? 'justify-start' : 'justify-end'}`}>
          <div className={`${contentWidthClassName} ${isArabic ? 'pr-8 md:pr-10 text-right' : 'pl-8 md:pl-10 text-left'}`}>
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h2
                className={`text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-[2.5rem] ${
                  isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                }`}
              >
                {title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{subtitle}</p>
            </div>

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
