'use client';

import { useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { LaamLogoAnimation, LaamLogoAnimationRef } from '@/components/landing/LaamLogoAnimation';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export function AuthShell({
  title,
  subtitle,
  children,
  contentWidthClassName = 'max-w-[420px]',
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  contentWidthClassName?: string;
}) {
  const { locale, theme, mounted } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const animRef = useRef<LaamLogoAnimationRef>(null);

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f4f1ea 0%, #ede9e1 55%, #e7e3d9 100%)';

  const glowStyle = isArabic
    ? isDark
      ? `radial-gradient(ellipse 54% 90% at 22% 50%, rgba(36,196,150,0.38) 0%, rgba(24,160,120,0.18) 42%, transparent 70%)`
      : `radial-gradient(ellipse 54% 90% at 22% 50%, rgba(36,196,150,0.50) 0%, rgba(28,172,132,0.28) 38%, rgba(24,160,120,0.10) 58%, transparent 74%)`
    : isDark
      ? `radial-gradient(ellipse 54% 90% at 78% 50%, rgba(36,196,150,0.38) 0%, rgba(24,160,120,0.18) 42%, transparent 70%)`
      : `radial-gradient(ellipse 54% 90% at 78% 50%, rgba(36,196,150,0.50) 0%, rgba(28,172,132,0.28) 38%, rgba(24,160,120,0.10) 58%, transparent 74%)`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <main className="px-4 py-8 md:px-6 md:py-10">
        <div className="mx-auto max-w-[1280px]">
          <div
            className="relative overflow-hidden rounded-[2.2rem]"
            style={{
              background: panelBg,
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark
                ? '0 32px 80px rgba(0,0,0,0.50), 0 0 120px rgba(18,112,90,0.09)'
                : '0 20px 60px rgba(0,0,0,0.12)',
              minHeight: 'calc(100vh - 10rem)',
            }}
          >
            {/* Green hue behind animation side */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: glowStyle }}
            />

            <div
              dir={isArabic ? 'rtl' : 'ltr'}
              className="relative z-10 flex min-h-[calc(100vh-10rem)] flex-col items-stretch lg:flex-row"
            >
              {/* Form panel — always first in DOM so RTL pushes it to the right automatically */}
              <div className="flex flex-1 items-center justify-center px-8 py-12 lg:max-w-[520px]">
                <div className={`w-full ${contentWidthClassName} ${isArabic ? 'text-right' : 'text-left'}`}>
                  <h2
                    className={`text-3xl font-bold tracking-tight md:text-[2.5rem] ${
                      isDark ? 'text-white/92' : 'text-slate-900/90'
                    } ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
                  >
                    {title}
                  </h2>
                  <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-white/50' : 'text-slate-700/60'}`}>
                    {subtitle}
                  </p>
                  <div className="mt-7">{children}</div>
                </div>
              </div>

              {/* Animation panel — always second in DOM so RTL pushes it to the left automatically */}
              {/* dir="ltr" prevents RTL from mirroring the LAAM letter order */}
              <div
                dir="ltr"
                className="hidden cursor-pointer items-center justify-center lg:flex lg:flex-1"
                onMouseEnter={() => animRef.current?.replay()}
              >
                <LaamLogoAnimation ref={animRef} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
