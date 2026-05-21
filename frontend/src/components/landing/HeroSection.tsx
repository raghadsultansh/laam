'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { siteCopy } from '@/lib/site-copy';
import { xbShafigh } from '@/lib/fonts';
import { LaamLogoAnimation, LaamLogoAnimationRef } from '@/components/landing/LaamLogoAnimation';
import { supabase } from '@/lib/supabase';
import { listSessions } from '@/lib/api';

export function HeroSection() {
  const { locale, theme, mounted } = useAppPreferences();
  const copy = siteCopy[locale].hero;
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';

  const animRef = useRef<LaamLogoAnimationRef>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasEntered = useRef(false);
  const [primaryHref, setPrimaryHref] = useState('/register');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const sessions = await listSessions().catch(() => []);
      setPrimaryHref(sessions.length > 0 ? `/workspace/${sessions[0].id}` : '/reports');
    });
  }, []);

  // Replay the logo when the user comes back to the hero.
  // First observer fire is skipped because the animation already runs on load.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasEntered.current) {
            hasEntered.current = true;
          } else {
            animRef.current?.replay();
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Main colors for the hero panel. Change these if the landing mood changes.
  const titleColor = isDark ? 'rgba(255,255,255,0.93)' : 'rgba(15,23,42,0.90)';
  const bodyColor = isDark ? 'rgba(255,255,255,0.52)' : 'rgba(15,23,42,0.58)';
  const secCtaColor = isDark ? 'rgba(255,255,255,0.58)' : 'rgba(15,23,42,0.52)';

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f6f6f6 0%, #eaf4f2 55%, #e7e3d9 100%)';

  const panelBorder = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)';
  const panelShadow = isDark
    ? '0 32px 80px rgba(0,0,0,0.50), 0 0 0 1px rgba(18,112,90,0.10), 0 0 120px rgba(18,112,90,0.09)'
    : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(18,112,90,0.07)';
  const topHighlight = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.08)'
    : 'inset 0 1px 0 rgba(255,255,255,0.85)';

  const titleClassName = isArabic
    ? 'mt-4 text-[2.5rem] font-bold leading-[1.14] tracking-[-0.04em] md:text-[3rem] lg:text-[3.5rem]'
    : 'mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.05em] md:text-5xl lg:text-[4.2rem]';

  // Text side of the hero. Copy comes from site-copy.ts.
  const textSection = (
    <div className={`flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-16 ${isArabic ? 'text-right' : 'text-left'}`}>
      <span className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
        {copy.superTitle}
      </span>

      <h2
        className={`${titleClassName} ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
        style={{ color: titleColor }}
      >
        {copy.title}
      </h2>

      <p className="mt-4 text-base leading-8" style={{ color: bodyColor }}>
        {copy.description}
      </p>

      <div className={`mt-8 flex flex-wrap gap-3 ${isArabic ? 'justify-end' : 'justify-start'}`}>
        <Link
          href="/reports"
          className="inline-flex rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:opacity-80"
          style={{ color: secCtaColor }}
        >
          {copy.secondaryCta}
        </Link>
        <Link
          href={primaryHref}
          dir="ltr"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #18a078 0%, #12705a 100%)',
            boxShadow: '0 0 24px rgba(18,112,90,0.38)',
          }}
        >
          {isArabic && <ArrowRight className="h-4 w-4 rotate-180" />}
          {copy.primaryCta}
          {!isArabic && <ArrowRight className="h-4 w-4" />}
        </Link>
      </div>
    </div>
  );

  // Animation side. The glow is on the full panel so it does not get clipped.
  const animationSection = (
    <div
      className="relative flex min-h-[220px] cursor-pointer items-center justify-center sm:min-h-[300px] md:min-h-[460px]"
      onMouseEnter={() => animRef.current?.replay()}
    >
      <div className="relative z-10">
        <LaamLogoAnimation ref={animRef} />
      </div>
    </div>
  );

  return (
    <section id="hero" ref={sectionRef} className="section-anchor px-4 pb-20 pt-6 md:px-6 md:pb-28 md:pt-8">
      <div className="mx-auto max-w-[1440px]">
        <div
          className="relative overflow-hidden rounded-[2.2rem]"
          style={{ background: panelBg, border: panelBorder, boxShadow: panelShadow }}
        >
          {/* Inner edge highlight. Small detail but keeps the card from looking flat. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[2.2rem]"
            style={{ boxShadow: topHighlight }}
          />

          {/* Brand glow behind the animation. Move the percentage if the layout changes. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: isArabic
                ? isDark
                  ? `radial-gradient(ellipse 54% 90% at 22% 50%,
                      rgba(36,196,150,0.38) 0%,
                      rgba(24,160,120,0.18) 42%,
                      transparent 70%)`
                  : `radial-gradient(ellipse 54% 90% at 22% 50%,
                      rgba(36,196,150,0.50) 0%,
                      rgba(28,172,132,0.28) 38%,
                      rgba(24,160,120,0.10) 58%,
                      transparent 74%)`
                : isDark
                  ? `radial-gradient(ellipse 54% 90% at 78% 50%,
                      rgba(36,196,150,0.38) 0%,
                      rgba(24,160,120,0.18) 42%,
                      transparent 70%)`
                  : `radial-gradient(ellipse 54% 90% at 78% 50%,
                      rgba(36,196,150,0.50) 0%,
                      rgba(28,172,132,0.28) 38%,
                      rgba(24,160,120,0.10) 58%,
                      transparent 74%)`,
            }}
          />

          <div
            dir="ltr"
            className={`relative z-10 grid items-center ${
              isArabic ? 'lg:grid-cols-[0.92fr_1.08fr]' : 'lg:grid-cols-[1.08fr_0.92fr]'
            }`}
          >
            {isArabic ? (
              <>
                {animationSection}
                {textSection}
              </>
            ) : (
              <>
                {textSection}
                {animationSection}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
