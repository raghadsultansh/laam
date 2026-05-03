'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

const LAAM_CHARS = ['L', 'Λ', 'Λ', 'M'];
const SLOGAN_AR = 'مُلِم لتقاريرك المالية';
const SLOGAN_EN = 'Comprehends Your Financial Reports';

export interface LaamLogoAnimationRef {
  replay: () => void;
}

// SVG logo animation used in the landing hero.
// HeroSection calls replay() when the section comes back into view.
export const LaamLogoAnimation = forwardRef<LaamLogoAnimationRef>(
  function LaamLogoAnimation(_, ref) {
    const { locale } = useAppPreferences();
    const isArabic = locale === 'ar';
    const slogan = isArabic ? SLOGAN_AR : SLOGAN_EN;

    const pathRef       = useRef<SVGPathElement>(null);
    const docRef        = useRef<SVGGElement>(null);
    const isAnimating   = useRef(false);
    const sloganRef     = useRef(slogan);

    // Keep sloganRef in sync so runAnim always reads the current locale's text
    useEffect(() => { sloganRef.current = slogan; }, [slogan]);

    const [visibleChars, setVisibleChars] = useState(0);
    const [sloganLen,    setSloganLen]    = useState(0);
    const [sloganDone,   setSloganDone]   = useState(false);

    const runAnim = useCallback(() => {
      if (isAnimating.current) return;
      const path = pathRef.current;
      const doc  = docRef.current;
      if (!path || !doc) return;

      isAnimating.current = true;

      const currentSlogan  = sloganRef.current;
      const animTotalMs    = 3900 + [...currentSlogan].length * 80 + 400;

      const len = path.getTotalLength();
      path.style.transition       = 'none';
      path.style.strokeDasharray  = String(len);
      path.style.strokeDashoffset = String(len);
      doc.style.transition        = 'none';
      doc.style.opacity           = '0';
      doc.style.transform         = 'scale(0)';

      setVisibleChars(0);
      setSloganLen(0);
      setSloganDone(false);
      path.getBoundingClientRect(); // force reflow

      setTimeout(() => {
        doc.style.transition = 'opacity 0.1s, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)';
        doc.style.opacity    = '1';
        doc.style.transform  = 'scale(1)';
      }, 200);

      setTimeout(() => {
        path.style.transition       = 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)';
        path.style.strokeDashoffset = '0';
      }, 750);

      LAAM_CHARS.forEach((_, i) => {
        setTimeout(() => setVisibleChars(i + 1), 2900 + i * 180);
      });

      [...currentSlogan].forEach((_, i) => {
        setTimeout(() => setSloganLen(i + 1), 3900 + i * 80);
      });

      setTimeout(() => {
        setSloganDone(true);
        isAnimating.current = false;
      }, animTotalMs);
    }, []);

    useImperativeHandle(ref, () => ({ replay: runAnim }), [runAnim]);

    // Play once on first mount. Replays are handled through the ref above.
    useEffect(() => {
      const t = setTimeout(runAnim, 300);
      return () => clearTimeout(t);
    }, [runAnim]);

    const displayedSlogan = [...slogan].slice(0, sloganLen).join('');

    return (
      <div className="flex aspect-square w-full max-w-[31rem] flex-col items-center justify-center gap-1 p-8">
        <svg viewBox="165 75 800 620" xmlns="http://www.w3.org/2000/svg" className="h-auto w-[82%]">
          <g ref={docRef} style={{ opacity: 0, transformOrigin: '410px 500px', transform: 'scale(0)' }}>
            <path
              d="M 345 455 L 382 418 Q 390 410 402 410 L 455 410 Q 467 410 467 422 L 467 580 Q 467 592 455 592 L 349 592 Q 337 592 337 580 L 337 467 Q 337 461 345 455 Z"
              fill="#1d8570"
            />
            <path d="M 382 418 L 382 448 Q 382 455 375 455 L 345 455 Z" fill="#4fc3ad" />
          </g>

          <path
            ref={pathRef}
            d="M 240 640 L 240 470 C 250 360 315 300 410 300 C 490 300 580 360 580 455 L 580 520 C 590 575 640 610 700 610 L 820 610 C 890 610 920 570 920 505 L 920 120"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={73}
          />
        </svg>

        <div className="flex items-center gap-8 md:gap-12">
          {LAAM_CHARS.map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="inline-block text-5xl font-medium leading-none text-white transition md:text-7xl"
              style={{
                opacity:   index < visibleChars ? 1 : 0,
                transform: index < visibleChars ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              {char}
            </span>
          ))}
        </div>

        <div dir={isArabic ? 'rtl' : 'ltr'} className="mt-2 flex min-h-12 items-center whitespace-nowrap text-xl font-light text-[var(--brand)] md:text-2xl">
          {displayedSlogan}
          {sloganLen > 0 && !sloganDone
            ? <span className="ml-1 inline-block h-[1em] w-0.5 animate-pulse bg-[var(--brand)] align-middle" />
            : null}
        </div>
      </div>
    );
  }
);
