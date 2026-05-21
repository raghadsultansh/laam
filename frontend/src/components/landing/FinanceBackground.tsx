'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

// Interactive background for the landing page.
// It is decorative, so keep it separate from the real page content and API work.
// If performance ever gets weird, lower the card count by changing computeGrid().
const SHAPE_SVGS = [
  `<svg width="18" height="13" viewBox="0 0 18 13" fill="none"><rect x="0" y="7" width="3" height="6" rx="1" fill="currentColor" opacity="0.7"/><rect x="5" y="4" width="3" height="9" rx="1" fill="currentColor" opacity="0.7"/><rect x="10" y="1" width="3" height="12" rx="1" fill="currentColor" opacity="0.7"/><rect x="15" y="5" width="3" height="8" rx="1" fill="currentColor" opacity="0.7"/></svg>`,
  `<svg width="20" height="12" viewBox="0 0 20 12" fill="none"><polyline points="0,9 4,5 9,8 13,2 20,4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/></svg>`,
  `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="3.5" cy="3.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.75"/><circle cx="11.5" cy="11.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.75"/><line x1="1" y1="14" x2="14" y2="1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75"/></svg>`,
  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><polyline points="1,11 6,3 12,7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/><polyline points="7.5,3 12,3 12,7.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/></svg>`,
  `<svg width="11" height="14" viewBox="0 0 11 14" fill="none"><rect x="1" y="1" width="9" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.65"/><line x1="3" y1="4.5" x2="8" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/><line x1="3" y1="7" x2="8" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/><line x1="3" y1="9.5" x2="6" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.45"/></svg>`,
  `<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5,7.5 L7.5,1 A6.5,6.5 0 0,1 14,7.5 Z" fill="currentColor" opacity="0.55"/><circle cx="7.5" cy="7.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.45"/></svg>`,
  `<svg width="16" height="11" viewBox="0 0 16 11" fill="none"><rect x="0" y="0" width="7" height="5" rx="1.5" fill="currentColor" opacity="0.55"/><rect x="9" y="0" width="7" height="5" rx="1.5" fill="currentColor" opacity="0.35"/><rect x="0" y="7" width="16" height="2.5" rx="1.2" fill="currentColor" opacity="0.2"/></svg>`,
  `<svg width="20" height="10" viewBox="0 0 20 10" fill="none"><line x1="0" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/><polyline points="0,6 3,4 7,6 10,1 14,4 17,2 20,3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/></svg>`,
  `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.45"/><polyline points="3.5,7 5.5,9 9.5,4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/></svg>`,
];

const LINE_SETS = [
  ['w-full', 'w-4/5', 'w-2/3'],
  ['w-4/5', 'w-full', 'w-1/2'],
  ['w-2/3', 'w-4/5', 'w-full'],
  ['w-full', 'w-2/3'],
  ['w-4/5', 'w-1/2', 'w-full', 'w-2/3'],
];

function randF(a: number, b: number) { return Math.random() * (b - a) + a; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface CardState {
  el: HTMLDivElement;
  ox: number; oy: number; rot: number; scale: number;
}

interface FloatingShape {
  id: number; svgIndex: number;
  x: number; y: number; fx: number; fy: number;
  duration: number; delay: number;
}

interface GridConfig { cols: number; rows: number; cardW: number; cardH: number; }

// Compute an explicit-pixel portrait grid. cardH is always 1.44× cardW so every
// card is taller than wide regardless of viewport aspect ratio.
function computeGrid(): GridConfig {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 5, PAD = 6;

  // Target card width per breakpoint
  const cw = vw >= 1536 ? 82 : vw >= 1280 ? 76 : vw >= 1024 ? 70 : vw >= 768 ? 66 : 58;
  const ch = Math.round(cw * 1.44); // guaranteed portrait (e.g. 76×109px)

  // Fill viewport; +1 col/row so cards always bleed past both edges
  const cols = Math.max(5, Math.floor((vw - 2 * PAD + GAP) / (cw + GAP)) + 1);
  const rows = Math.max(6, Math.ceil((vh - 2 * PAD + GAP) / (ch + GAP)) + 1);

  return { cols, rows, cardW: cw, cardH: ch };
}

function DocCard({ isDark, index }: { isDark: boolean; index: number }) {
  const lines = LINE_SETS[index % LINE_SETS.length];
  const bw1 = (['w-4/5', 'w-2/3', 'w-1/2'] as const)[index % 3];
  const bw2 = (['w-1/2', 'w-2/5'] as const)[index % 2];
  const yearW = [38, 46, 54, 42, 50][index % 5];

  return (
    <div
      className={`w-full h-full flex flex-col rounded-[10px] overflow-hidden ${
        isDark
          ? 'bg-[#1c2535] border border-white/[0.07]'
          : 'bg-[#edeae3] border border-black/[0.12]'
      }`}
    >
      {/* year bar */}
      <div className="px-[6px] pt-[6px] pb-[3px] flex-shrink-0">
        <div
          className={`h-[4px] rounded-sm mb-[5px] ${isDark ? 'bg-white/[0.22]' : 'bg-black/[0.28]'}`}
          style={{ width: `${yearW}%` }}
        />
      </div>
      {/* text lines */}
      <div className="flex-1 px-[6px] flex flex-col gap-[3px] justify-center">
        {lines.map((w, i) => (
          <div key={i} className={`h-[3px] rounded-sm ${w} ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.12]'}`} />
        ))}
      </div>
      {/* bottom stats */}
      <div className="px-[6px] pt-[4px] pb-[6px] flex-shrink-0 flex flex-col gap-[3px]">
        <div className={`h-[3px] rounded-sm ${bw1} ${isDark ? 'bg-white/[0.16]' : 'bg-black/[0.22]'}`} />
        <div className={`h-[3px] rounded-sm ${bw2} ${isDark ? 'bg-white/[0.16]' : 'bg-black/[0.22]'}`} />
      </div>
    </div>
  );
}

export function FinanceBackground() {
  const { theme, mounted } = useAppPreferences();
  const isDark = !mounted || theme === 'dark';

  // ── Responsive grid config ──────────────────────────────────────────────────
  const [gridConfig, setGridConfig] = useState<GridConfig>({ cols: 17, rows: 9, cardW: 76, cardH: 109 });

  useEffect(() => {
    const update = () => setGridConfig(computeGrid());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const total = gridConfig.cols * gridConfig.rows;

  // ── Physics state ───────────────────────────────────────────────────────────
  const [shapes, setShapes] = useState<FloatingShape[]>([]);
  const shapeIdRef = useRef(0);

  const sceneRef  = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const magRef    = useRef<HTMLDivElement>(null);
  const cardsRef  = useRef<CardState[]>([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef<number>(0);
  const spawnRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Collect card DOM nodes after grid renders ───────────────────────────────
  const collectCards = useCallback(() => {
    if (!gridRef.current) return;
    const divs = Array.from(gridRef.current.querySelectorAll<HTMLDivElement>('.fb-card-wrap'));
    cardsRef.current = divs.map((el) => ({ el, ox: 0, oy: 0, rot: 0, scale: 1 }));
  }, []);

  // Re-collect when theme or grid dimensions change
  useEffect(() => {
    const t = setTimeout(collectCards, 80);
    return () => clearTimeout(t);
  }, [isDark, gridConfig, collectCards]);

  // ── Floating shapes ─────────────────────────────────────────────────────────
  const spawnShape = useCallback((x: number, y: number) => {
    const angle = randF(-Math.PI * 0.9, -Math.PI * 0.1);
    const dist  = randF(22, 50);
    const id    = shapeIdRef.current++;
    setShapes((prev) => [...prev, {
      id,
      svgIndex: Math.floor(Math.random() * SHAPE_SVGS.length),
      x: x + randF(-5, 5),
      y: y + randF(-5, 5),
      fx: Math.cos(angle) * dist,
      fy: Math.sin(angle) * dist,
      duration: randF(1.1, 1.8),
      delay:    randF(0, 0.3),
    }]);
    setTimeout(() => setShapes((prev) => prev.filter((s) => s.id !== id)), 2200);
  }, []);

  const stopSpawning = useCallback(() => {
    if (spawnRef.current) { clearInterval(spawnRef.current); spawnRef.current = null; }
    setShapes([]);
  }, []);

  const startSpawning = useCallback(() => {
    if (spawnRef.current) return;
    spawnRef.current = setInterval(() => {
      if (mouseRef.current.x < -100) { stopSpawning(); return; }
      spawnShape(mouseRef.current.x, mouseRef.current.y);
    }, 300);
  }, [spawnShape, stopSpawning]);

  // ── rAF animation loop ──────────────────────────────────────────────────────
  useEffect(() => {
    collectCards();

    const tick = () => {
      const scene = sceneRef.current;
      if (!scene) { rafRef.current = requestAnimationFrame(tick); return; }

      const sr = scene.getBoundingClientRect();
      const mx = mouseRef.current.x - sr.left;
      const my = mouseRef.current.y - sr.top;

      cardsRef.current.forEach((c) => {
        const r  = c.el.getBoundingClientRect();
        const cx = r.left - sr.left + r.width  / 2;
        const cy = r.top  - sr.top  + r.height / 2;
        const dx = cx - mx;
        const dy = cy - my;
        const dist   = Math.sqrt(dx * dx + dy * dy);
        const RADIUS = 130;

        if (dist < RADIUS && mx > 0) {
          const force = 1 - dist / RADIUS;
          const norm  = dist < 1 ? 1 : dist;
          c.ox    = lerp(c.ox,    (dx / norm) * force * 55,   0.14);
          c.oy    = lerp(c.oy,    (dy / norm) * force * 55,   0.14);
          c.rot   = lerp(c.rot,  -(dx / norm) * force * 18,  0.14);
          c.scale = lerp(c.scale, 1 + force * 0.12,           0.14);
          c.el.style.zIndex = String(Math.round(force * 30) + 2);
          c.el.classList.toggle('fb-inverted', dist < 40);
        } else {
          c.ox    = lerp(c.ox,    0, 0.08);
          c.oy    = lerp(c.oy,    0, 0.08);
          c.rot   = lerp(c.rot,   0, 0.08);
          c.scale = lerp(c.scale, 1, 0.08);
          c.el.style.zIndex = '1';
          c.el.classList.remove('fb-inverted');
        }

        c.el.style.transform =
          `translate(${c.ox.toFixed(2)}px,${c.oy.toFixed(2)}px) ` +
          `rotate(${c.rot.toFixed(2)}deg) scale(${c.scale.toFixed(3)})`;
      });

      // keep magnifier in sync with global mouse coords
      if (magRef.current) {
        magRef.current.style.left = `${mouseRef.current.x}px`;
        magRef.current.style.top  = `${mouseRef.current.y}px`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [collectCards]);

  // Global mouse listeners. The background lives behind the landing page, but we
  // still track the mouse here because the visible cards do not receive events.
  // We bail out when the cursor is over .lp-surface (any UI content element) so
  // the card repulsion effect never fires through glass/solid section surfaces.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (magRef.current) magRef.current.style.opacity = '1';
      startSpawning();
    };
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      if (magRef.current) magRef.current.style.opacity = '0';
      stopSpawning();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [startSpawning, stopSpawning]);

  // ── Custom cursor while landing page is mounted ─────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'fb-cursor-override';
    style.textContent = '.landing-shell, .landing-shell * { cursor: none !important; }';
    document.head.appendChild(style);
    return () => document.getElementById('fb-cursor-override')?.remove();
  }, []);

  const magColor   = isDark ? 'white'                    : '#1a1a1a';
  const magFill    = isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(0,0,0,0.06)';
  const shapeColor = isDark ? 'rgba(255,255,255,0.55)'   : 'rgba(0,0,0,0.45)';
  const bgColor    = isDark ? '#0c1018'                  : '#cbc8c1';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .fb-card-wrap { position: relative; will-change: transform; z-index: 1; }
        .fb-inverted > div { filter: invert(1); }
        @keyframes fbFloatUp {
          0%   { transform: translate(0,0) scale(0.6); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 0.65; }
          100% { transform: translate(var(--fx), var(--fy)) scale(1); opacity: 0; }
        }
      ` }} />

      {/* ── Layer 1: card grid — behind all page content (z: -1) ── */}
      <div
        ref={sceneRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: -1 }}
      >
        {/* solid background colour */}
        <div className="absolute inset-0" style={{ background: bgColor }} />

        {/* responsive portrait card grid */}
        <div
          ref={gridRef}
          className="absolute inset-0 grid gap-[5px] p-[6px]"
          style={{
            gridTemplateColumns: `repeat(${gridConfig.cols}, ${gridConfig.cardW}px)`,
            gridTemplateRows:    `repeat(${gridConfig.rows}, ${gridConfig.cardH}px)`,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="fb-card-wrap">
              <DocCard isDark={isDark} index={i} />
            </div>
          ))}
        </div>

        {/* vignette — frames the page content naturally */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 90% 90% at 50% 44%, transparent 28%, rgba(0,0,0,0.62) 100%)'
              : 'radial-gradient(ellipse 90% 90% at 50% 44%, transparent 28%, rgba(0,0,0,0.34) 100%)',
          }}
        />
      </div>

      {/* ── Layer 2: shapes + magnifier cursor — above all content (z: 9999) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        {shapes.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left:      s.x,
              top:       s.y,
              color:     shapeColor,
              animation: `fbFloatUp ${s.duration}s ease-out ${s.delay}s forwards`,
              ['--fx' as string]: `${s.fx}px`,
              ['--fy' as string]: `${s.fy}px`,
            }}
            dangerouslySetInnerHTML={{ __html: SHAPE_SVGS[s.svgIndex] }}
          />
        ))}

        <div
          ref={magRef}
          className="absolute"
          style={{ transform: 'translate(-34%,-34%)', opacity: 0, transition: 'opacity 0.15s' }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="12" cy="12" r="9" stroke={magColor} strokeWidth="2.5" strokeLinecap="round" fill={magFill} />
            <line x1="19" y1="19" x2="27" y2="27" stroke={magColor} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  );
}
