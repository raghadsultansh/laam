'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import {
  generateDashboard, getDashboard,
  type DashboardData, type DashExtractedValue, type DashIncomeYear,
  type DashBalanceYear, type DashCashFlowYear,
} from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

const v = (ev?: DashExtractedValue | null): number | null => ev?.value ?? null;

function fmtCard(n: number | null): string {
  if (n === null) return '—';
  return Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtAxis(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

function pct(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return (a / b) * 100;
}

function yoy(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function ratio(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

// ── Chart theme ───────────────────────────────────────────────────────────────

function useChartColors(isDark: boolean) {
  return {
    p1: isDark ? '#18a078' : '#12705a',
    p2: '#0ea5e9',
    p3: '#8b5cf6',
    neg: '#ef4444',
    pos: isDark ? '#22c55e' : '#16a34a',
    grid: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)',
    axis: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.45)',
    tooltipBg: isDark ? '#0c1520' : '#ffffff',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number | null, duration = 1100): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (target === null) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return current;
}

// ── Shared small components ───────────────────────────────────────────────────

function ConfidenceDot({ level }: { level?: string }) {
  const colors: Record<string, string> = { high: '#22c55e', medium: '#f59e0b', low: '#ef4444' };
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: colors[level ?? 'low'] }}
      title={`${level ?? 'unknown'} confidence`}
    />
  );
}

function DeltaBadge({ value, className = '' }: { value: number | null; className?: string }) {
  if (value === null) return null;
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      pos
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    } ${className}`}>
      {pos ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {pos ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function Panel({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`rounded-[1.6rem] border border-[var(--border)] bg-[color:var(--card)] p-5 shadow-[var(--shadow-sm)] backdrop-blur-sm ${className}`}
      style={{ animation: `fadeInUp 0.45s ease-out both`, animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{children}</p>;
}

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unit?: string;
  quote?: string;
};

function GlassTooltip({ active, payload, label, unit = '', quote }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[160px] rounded-2xl border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 shadow-xl backdrop-blur-xl">
      {label && <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-[var(--muted-foreground)]">{p.name}</span>
          <span className="ml-auto pl-3 text-xs font-bold text-[var(--foreground)]">{fmtCard(p.value)}</span>
        </div>
      ))}
      {unit && <p className="mt-1.5 text-[9px] text-[var(--muted-foreground)]">{unit}</p>}
      {quote && (
        <p className="mt-2 border-t border-[var(--border)] pt-2 text-[9px] italic leading-relaxed text-[var(--muted-foreground)]">
          &ldquo;{quote.slice(0, 110)}&rdquo;
        </p>
      )}
    </div>
  );
}

// ── KPI Hero row ──────────────────────────────────────────────────────────────

function KPICard({
  label, ev, priorEv, unit, delay,
}: {
  label: string;
  ev: DashExtractedValue | undefined;
  priorEv?: DashExtractedValue | undefined;
  unit: string;
  delay: number;
}) {
  const n = v(ev);
  const counted = useCountUp(n);
  const delta = yoy(n, v(priorEv));

  return (
    <Panel delay={delay} className="flex min-w-0 flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <ConfidenceDot level={ev?.confidence} />
          <SectionLabel>{label}</SectionLabel>
        </div>
        <DeltaBadge value={delta} className="shrink-0" />
      </div>
      <div className="min-w-0">
        <p className="break-all text-2xl font-black tabular-nums leading-tight text-[var(--foreground)] xl:text-3xl">
          {n !== null ? fmtCard(counted) : '—'}
        </p>
        <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">{unit || ev?.unit || ''}</p>
      </div>
    </Panel>
  );
}

// ── P&L grouped bar chart ─────────────────────────────────────────────────────

function PLBarChart({
  cy, py, colors, isArabic,
}: {
  cy: DashIncomeYear;
  py: DashIncomeYear | null;
  colors: ReturnType<typeof useChartColors>;
  isArabic: boolean;
}) {
  const unit = cy.revenue?.unit || '';
  const items = [
    { key: 'revenue',          label: isArabic ? 'الإيرادات' : 'Revenue',          color: colors.p1 },
    { key: 'gross_profit',     label: isArabic ? 'مجمل الربح' : 'Gross Profit',    color: colors.p2 },
    { key: 'operating_income', label: isArabic ? 'الدخل التشغيلي' : 'Op. Income',  color: colors.p3 },
    { key: 'net_income',       label: isArabic ? 'صافي الدخل' : 'Net Income',      color: '#f59e0b' },
  ].filter(i => v((cy as any)[i.key]) !== null);

  if (items.length === 0) return null;

  const data = [
    { year: `FY${cy.year ?? ''}`, ...Object.fromEntries(items.map(i => [i.key, v((cy as any)[i.key])])) },
    ...(py ? [{ year: `FY${py.year ?? ''}`, ...Object.fromEntries(items.map(i => [i.key, v((py as any)[i.key])])) }] : []),
  ];

  return (
    <Panel delay={100}>
      <SectionLabel>{isArabic ? 'نظرة عامة على الأرباح والخسائر' : 'P&L Overview'}</SectionLabel>
      <p className="mb-4 text-lg font-bold text-[var(--foreground)]">
        {isArabic ? 'مقارنة البنود الرئيسية' : 'Year-over-Year Comparison'}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={<GlassTooltip unit={unit} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: colors.axis, paddingTop: 8 }} />
          {items.map(i => (
            <Bar key={i.key} dataKey={i.key} name={i.label} fill={i.color} radius={[4, 4, 0, 0]} maxBarSize={44} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

// ── Revenue + Net Income trend ────────────────────────────────────────────────

function TrendChart({
  cy, py, colors, isArabic,
}: {
  cy: DashIncomeYear;
  py: DashIncomeYear;
  colors: ReturnType<typeof useChartColors>;
  isArabic: boolean;
}) {
  const unit = cy.revenue?.unit || '';
  const data = [
    { year: `FY${py.year ?? ''}`, revenue: v(py.revenue), netIncome: v(py.net_income) },
    { year: `FY${cy.year ?? ''}`, revenue: v(cy.revenue), netIncome: v(cy.net_income) },
  ];

  return (
    <Panel delay={150}>
      <SectionLabel>{isArabic ? 'الاتجاه المالي' : 'Financial Trend'}</SectionLabel>
      <p className="mb-4 text-lg font-bold text-[var(--foreground)]">
        {isArabic ? 'الإيرادات وصافي الدخل' : 'Revenue & Net Income'}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors.p1} stopOpacity={0.28} />
              <stop offset="95%" stopColor={colors.p1} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={colors.p2} stopOpacity={0.28} />
              <stop offset="95%" stopColor={colors.p2} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis dataKey="year" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtAxis} tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={<GlassTooltip unit={unit} />} cursor={{ stroke: colors.grid, strokeWidth: 1 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: colors.axis, paddingTop: 8 }} />
          <Area type="monotone" dataKey="revenue" name={isArabic ? 'الإيرادات' : 'Revenue'} stroke={colors.p1} strokeWidth={2.5} fill="url(#g1)" dot={{ r: 5, fill: colors.p1, strokeWidth: 0 }} activeDot={{ r: 7 }} />
          <Area type="monotone" dataKey="netIncome" name={isArabic ? 'صافي الدخل' : 'Net Income'} stroke={colors.p2} strokeWidth={2.5} fill="url(#g2)" dot={{ r: 5, fill: colors.p2, strokeWidth: 0 }} activeDot={{ r: 7 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Panel>
  );
}

// ── Margin gauges ─────────────────────────────────────────────────────────────

function MarginBar({
  label, value, priorValue, color,
}: {
  label: string;
  value: number | null;
  priorValue?: number | null;
  color: string;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value ?? 0), 120);
    return () => clearTimeout(t);
  }, [value]);

  if (value === null) return null;
  const capped = Math.min(Math.max(value, 0), 100);
  const priorCapped = priorValue !== null && priorValue !== undefined ? Math.min(Math.max(priorValue, 0), 100) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="font-bold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--background)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${capped}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }}
        />
        {priorCapped !== null && (
          <div
            className="absolute inset-y-0 w-0.5 rounded-full bg-white/40"
            style={{ left: `${priorCapped}%` }}
            title={`Prior year: ${priorValue?.toFixed(1)}%`}
          />
        )}
      </div>
    </div>
  );
}

function MarginPanel({
  cy, py, colors, isArabic,
}: {
  cy: DashIncomeYear;
  py: DashIncomeYear | null;
  colors: ReturnType<typeof useChartColors>;
  isArabic: boolean;
}) {
  const rev = v(cy.revenue), priorRev = v(py?.revenue);
  const gm = pct(v(cy.gross_profit), rev);
  const nm = pct(v(cy.net_income), rev);
  const om = pct(v(cy.operating_income), rev);
  const priorGm = pct(v(py?.gross_profit), priorRev);
  const priorNm = pct(v(py?.net_income), priorRev);
  const priorOm = pct(v(py?.operating_income), priorRev);

  if (gm === null && nm === null && om === null) return null;

  return (
    <Panel delay={120} className="flex flex-col gap-4">
      <div>
        <SectionLabel>{isArabic ? 'تحليل الهوامش' : 'Margin Analysis'}</SectionLabel>
        <p className="text-lg font-bold text-[var(--foreground)]">
          {isArabic ? 'كفاءة الربحية' : 'Profitability Efficiency'}
        </p>
      </div>
      <div className="space-y-5">
        <MarginBar label={isArabic ? 'هامش مجمل الربح' : 'Gross Margin'}     value={gm} priorValue={priorGm} color={colors.p1} />
        <MarginBar label={isArabic ? 'هامش الدخل التشغيلي' : 'Op. Margin'}  value={om} priorValue={priorOm} color={colors.p2} />
        <MarginBar label={isArabic ? 'هامش صافي الدخل' : 'Net Margin'}      value={nm} priorValue={priorNm} color={colors.p3} />
      </div>
      {py && (
        <p className="mt-auto flex items-center gap-1.5 text-[10px] text-[var(--muted-foreground)]">
          <span className="inline-block h-0.5 w-3 rounded bg-white/30" />
          {isArabic ? 'الشريط الأبيض = السنة السابقة' : 'White mark = prior year'}
        </p>
      )}
    </Panel>
  );
}

// ── Cash flow panel ───────────────────────────────────────────────────────────

function CashFlowPanel({
  cy, colors, isArabic,
}: {
  cy: DashCashFlowYear;
  colors: ReturnType<typeof useChartColors>;
  isArabic: boolean;
}) {
  const ocf = v(cy.operating_cf);
  const capex = v(cy.capex);
  const inv = v(cy.investing_cf);
  const fin = v(cy.financing_cf);
  const freeCF = ocf !== null && capex !== null ? ocf + capex : null;

  const rows = [
    { name: isArabic ? 'التشغيل' : 'Operating',  value: ocf,    quote: cy.operating_cf?.source_quote },
    { name: isArabic ? 'النفقات الرأسمالية' : 'CapEx', value: capex, quote: cy.capex?.source_quote },
    { name: isArabic ? 'الاستثمار' : 'Investing', value: inv,    quote: cy.investing_cf?.source_quote },
    { name: isArabic ? 'التمويل' : 'Financing',   value: fin,    quote: cy.financing_cf?.source_quote },
    { name: isArabic ? 'التدفق النقدي الحر' : 'Free CF', value: freeCF, quote: '' },
  ].filter(r => r.value !== null) as Array<{ name: string; value: number; quote: string }>;

  if (rows.length < 2) return null;

  const unit = cy.operating_cf?.unit || '';

  return (
    <Panel delay={200}>
      <SectionLabel>{isArabic ? 'التدفق النقدي' : 'Cash Flow Breakdown'}</SectionLabel>
      <p className="mb-4 text-lg font-bold text-[var(--foreground)]">
        {isArabic ? 'مصادر النقد واستخداماتها' : 'Sources & Uses of Cash'}
      </p>
      <ResponsiveContainer width="100%" height={rows.length * 48 + 20}>
        <BarChart data={rows} layout="vertical" barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
          <XAxis type="number" tickFormatter={fmtAxis} tick={{ fill: colors.axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: colors.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={isArabic ? 120 : 90} />
          <Tooltip content={(props: any) => <GlassTooltip {...props} unit={unit} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" name={isArabic ? 'القيمة' : 'Value'} radius={[0, 6, 6, 0]} maxBarSize={28}>
            {rows.map((r) => (
              <Cell key={r.name} fill={r.value >= 0 ? colors.p1 : colors.neg} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

// ── Donut chart (reused for BS split + asset split) ───────────────────────────

function DonutPanel({
  title, subtitle, items, colors, delay,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; color: string; unit?: string }>;
  colors: ReturnType<typeof useChartColors>;
  delay: number;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.08) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{(percent * 100).toFixed(0)}%</text>;
  };

  return (
    <Panel delay={delay} className="flex flex-col gap-4">
      <div>
        <SectionLabel>{subtitle}</SectionLabel>
        <p className="text-lg font-bold text-[var(--foreground)]">{title}</p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0">
          <PieChart width={160} height={160}>
            <Pie
              data={items}
              cx={76}
              cy={76}
              innerRadius={46}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
              animationBegin={0}
              animationDuration={1000}
            >
              {items.map((item, i) => <Cell key={i} fill={item.color} strokeWidth={0} />)}
            </Pie>
          </PieChart>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="truncate text-xs font-medium text-[var(--foreground)]">{item.label}</span>
                <span className="ml-auto shrink-0 text-xs font-bold text-[var(--foreground)]">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="mt-0.5 pl-4 text-[10px] text-[var(--muted-foreground)]">
                {fmtCard(item.value)} {item.unit || ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── Ratio cards row ───────────────────────────────────────────────────────────

type RatioItem = {
  label: string;
  value: number | null;
  format: 'pct' | 'ratio' | 'num';
  context?: string;
  color?: string;
};

function RatioCard({ item, delay }: { item: RatioItem; delay: number }) {
  if (item.value === null) return null;
  const display =
    item.format === 'pct'   ? `${item.value.toFixed(1)}%` :
    item.format === 'ratio' ? `${item.value.toFixed(2)}x` :
    fmtCard(item.value);

  const liquidityColor =
    item.format === 'ratio' && item.label.toLowerCase().includes('ratio')
      ? item.value >= 1.5 ? '#22c55e' : item.value >= 1 ? '#f59e0b' : '#ef4444'
      : item.color;

  return (
    <Panel delay={delay} className="flex flex-col gap-2">
      <SectionLabel>{item.label}</SectionLabel>
      <p className="text-2xl font-black tabular-nums" style={{ color: liquidityColor || 'var(--foreground)' }}>
        {display}
      </p>
      {item.context && <p className="text-[10px] leading-relaxed text-[var(--muted-foreground)]">{item.context}</p>}
    </Panel>
  );
}

// ── Small info cards (EPS / Dividend / Zakat) ─────────────────────────────────

function SmallCard({
  label, ev, priorEv, suffix = '', delay, color,
}: {
  label: string;
  ev: DashExtractedValue | undefined;
  priorEv?: DashExtractedValue | undefined;
  suffix?: string;
  delay: number;
  color?: string;
}) {
  if (v(ev) === null) return null;
  return (
    <Panel delay={delay} className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <ConfidenceDot level={ev?.confidence} />
        <SectionLabel>{label}</SectionLabel>
      </div>
      <div>
        <p className="text-2xl font-black tabular-nums" style={{ color: color || 'var(--foreground)' }}>
          {fmtCard(v(ev))}{suffix}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">{ev?.unit || ''}</p>
      </div>
      <DeltaBadge value={yoy(v(ev), v(priorEv))} />
      {ev?.source_quote && (
        <p className="border-t border-[var(--border)] pt-2 text-[9px] italic leading-relaxed text-[var(--muted-foreground)]">
          &ldquo;{ev.source_quote.slice(0, 100)}&rdquo;
        </p>
      )}
    </Panel>
  );
}

// ── Segment chart ─────────────────────────────────────────────────────────────

function SegmentPanel({
  segments, unit, colors, isArabic,
}: {
  segments: DashboardData['supplemental']['segments'];
  unit: string;
  colors: ReturnType<typeof useChartColors>;
  isArabic: boolean;
}) {
  const data = segments.filter(s => s.revenue_value !== null).map(s => ({ name: s.name, value: s.revenue_value as number }));
  if (data.length < 2) return null;

  const SHADES = [colors.p1, colors.p2, colors.p3, '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <Panel delay={350}>
      <SectionLabel>{isArabic ? 'توزيع القطاعات' : 'Segment Breakdown'}</SectionLabel>
      <p className="mb-4 text-lg font-bold text-[var(--foreground)]">
        {isArabic ? 'الإيرادات حسب القطاع' : 'Revenue by Segment'}
      </p>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <PieChart width={180} height={180} style={{ flexShrink: 0 }}>
          <Pie data={data} cx={86} cy={86} innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value" animationDuration={1000}>
            {data.map((_, i) => <Cell key={i} fill={SHADES[i % SHADES.length]} strokeWidth={0} />)}
          </Pie>
          <Tooltip content={(p: any) => <GlassTooltip {...p} unit={unit} />} />
        </PieChart>
        <div className="min-w-0 flex-1 space-y-3">
          {data.map((s, i) => {
            const total = data.reduce((a, b) => a + b.value, 0);
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SHADES[i % SHADES.length] }} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--foreground)]">{s.name}</span>
                <span className="text-xs font-bold text-[var(--foreground)]">{fmtCard(s.value)}</span>
                <span className="w-10 text-right text-[10px] text-[var(--muted-foreground)]">{((s.value / total) * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-[1.6rem] dash-skeleton" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="h-64 rounded-[1.6rem] dash-skeleton" />
        <div className="h-64 rounded-[1.6rem] dash-skeleton" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-[1.6rem] dash-skeleton" />
        <div className="h-56 rounded-[1.6rem] dash-skeleton" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-[1.6rem] dash-skeleton" />)}
      </div>
    </div>
  );
}

// ── Main Dashboard component ──────────────────────────────────────────────────

export function Dashboard({ reportId }: { reportId: string | undefined }) {
  const { locale, mounted, theme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const colors = useChartColors(isDark);

  const [status, setStatus] = useState<'idle' | 'loading' | 'generating' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!reportId) { setStatus('idle'); return; }
    getDashboard(reportId)
      .then(res => { setData(res.data); setStatus('ready'); })
      .catch(err => {
        if (err?.response?.status === 404) setStatus('idle');
        else { setStatus('error'); setErrorMsg(String(err?.message || '')); }
      });
  }, [reportId]);

  async function handleGenerate() {
    if (!reportId) return;
    setStatus('generating');
    try {
      const res = await generateDashboard(reportId);
      setData(res.data);
      setStatus('ready');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(String(err?.response?.data?.detail || err?.message || 'Generation failed'));
    }
  }

  // ── States ─────────────────────────────────────────────────────────────────

  if (status === 'loading') return <DashboardSkeleton />;

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[var(--brand)]" />
        <div>
          <p className="text-lg font-bold text-[var(--foreground)]">
            {isArabic ? 'جارٍ استخراج البيانات المالية…' : 'Extracting financial data…'}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {isArabic ? 'قد يستغرق هذا 20-30 ثانية' : 'This may take 20-30 seconds'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <BarChart3 className="h-8 w-8 text-[var(--muted-foreground)]/40" />
        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
          {isArabic ? 'تعذّر توليد اللوحة' : 'Dashboard generation failed'}
        </p>
        {errorMsg && <p className="max-w-xs text-xs text-[var(--muted-foreground)]/60">{errorMsg}</p>}
        <button onClick={handleGenerate} className="mt-2 rounded-2xl bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white">
          {isArabic ? 'إعادة المحاولة' : 'Try again'}
        </button>
      </div>
    );
  }

  if (status === 'idle' || !data) {
    return (
      <div className={`rounded-[1.8rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl ${isArabic ? 'text-right' : 'text-left'}`}>
        <div className="grid h-14 w-14 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <BarChart3 className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-bold text-[var(--foreground)]">
          {isArabic ? 'لا توجد لوحة معلومات بعد' : 'No dashboard generated yet'}
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-7 text-[var(--muted-foreground)]">
          {isArabic
            ? 'انقر على توليد لاستخراج المؤشرات المالية الرئيسية من هذا التقرير تلقائياً.'
            : 'Click Generate to automatically extract key financial metrics from this report.'}
        </p>
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleGenerate}
            className="generate-dashboard-orb"
            aria-label={isArabic ? 'توليد لوحة المعلومات' : 'Generate Dashboard'}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <span className="generate-dashboard-orb__glow" aria-hidden="true" />
            <span className="generate-dashboard-orb__label">{isArabic ? 'توليد' : 'Generate'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Data extraction ────────────────────────────────────────────────────────

  const cy_pl = data.income_statement.current_year;
  const py_pl = data.income_statement.prior_year;
  const cy_bs = data.balance_sheet.current_year;
  const py_bs = data.balance_sheet.prior_year;
  const cy_cf = data.cash_flow.current_year;
  const sup   = data.supplemental;
  const unit  = cy_pl.revenue?.unit || cy_bs.total_assets?.unit || '';

  // Derived metrics
  const grossMargin = pct(v(cy_pl.gross_profit), v(cy_pl.revenue));
  const netMargin   = pct(v(cy_pl.net_income),   v(cy_pl.revenue));

  const freeCF = (() => {
    const ocf = v(cy_cf.operating_cf);
    const capex = v(cy_cf.capex);
    if (ocf === null) return null;
    return ocf + (capex ?? 0);
  })();

  const deRatio = ratio(v(cy_bs.total_liabilities), v(cy_bs.total_equity));
  const netDebt = (() => {
    const d = v(cy_bs.total_debt);
    const c = v(cy_bs.cash_and_equivalents);
    if (d === null) return null;
    return d - (c ?? 0);
  })();
  const currentRatio = ratio(v(cy_bs.current_assets), v(cy_bs.current_liabilities));
  const quickRatio   = (() => {
    const ca  = v(cy_bs.current_assets);
    const inv = v(cy_bs.inventory) ?? 0;
    const cl  = v(cy_bs.current_liabilities);
    if (!ca || !cl || cl === 0) return null;
    return (ca - inv) / cl;
  })();
  const roe = pct(v(cy_pl.net_income), v(cy_bs.total_equity));
  const roa = pct(v(cy_pl.net_income), v(cy_bs.total_assets));
  const capex_abs = cy_cf.capex?.value !== null ? Math.abs(cy_cf.capex?.value ?? 0) : null;
  const capexPct  = pct(capex_abs, v(cy_pl.revenue));
  const payoutRatio = pct(v(sup.dividend_per_share), v(cy_pl.eps_basic));

  // Panel visibility
  const showHero       = v(cy_pl.revenue) !== null || v(cy_pl.net_income) !== null || v(cy_bs.total_assets) !== null || v(cy_cf.operating_cf) !== null;
  const showPL         = v(cy_pl.revenue) !== null && (v(cy_pl.gross_profit) !== null || v(cy_pl.net_income) !== null);
  const showTrend      = v(cy_pl.revenue) !== null && py_pl !== null && v(py_pl.revenue) !== null;
  const showMargin     = grossMargin !== null || netMargin !== null || pct(v(cy_pl.operating_income), v(cy_pl.revenue)) !== null;
  const showCF         = [v(cy_cf.operating_cf), v(cy_cf.investing_cf), v(cy_cf.financing_cf)].filter(x => x !== null).length >= 2;
  const showBSDonut    = v(cy_bs.total_equity) !== null && v(cy_bs.total_liabilities) !== null;
  const showAssetDonut = v(cy_bs.current_assets) !== null && v(cy_bs.non_current_assets) !== null;
  const showLeverage   = deRatio !== null || netDebt !== null;
  const showLiquidity  = currentRatio !== null || quickRatio !== null;
  const showReturns    = roe !== null || roa !== null;
  const showCapex      = capex_abs !== null;
  const showEPS        = v(cy_pl.eps_basic) !== null;
  const showDividend   = v(sup.dividend_per_share) !== null;
  const showZakat      = v(cy_pl.zakat_and_tax) !== null;
  const showSegments   = sup.segments.filter(s => s.revenue_value !== null).length >= 2;

  const ratioItems: RatioItem[] = [
    showLeverage  && { label: isArabic ? 'نسبة الدين إلى الملكية' : 'Debt-to-Equity',   value: deRatio,      format: 'ratio', context: isArabic ? 'إجمالي الالتزامات ÷ حقوق الملكية' : 'Total liabilities ÷ equity' },
    showLeverage  && { label: isArabic ? 'صافي الدين' : 'Net Debt',                      value: netDebt,      format: 'num',   context: unit },
    showLiquidity && { label: isArabic ? 'نسبة السيولة الجارية' : 'Current Ratio',       value: currentRatio, format: 'ratio', context: isArabic ? '> 1.5 جيد | < 1 تحذير' : '> 1.5 healthy | < 1 warning' },
    showLiquidity && { label: isArabic ? 'نسبة السيولة السريعة' : 'Quick Ratio',         value: quickRatio,   format: 'ratio', context: isArabic ? 'بدون المخزون' : 'Excl. inventory' },
    showReturns   && { label: isArabic ? 'العائد على الملكية' : 'ROE',                   value: roe,          format: 'pct',   color: colors.p1 },
    showReturns   && { label: isArabic ? 'العائد على الأصول' : 'ROA',                   value: roa,          format: 'pct',   color: colors.p2 },
    showCapex     && { label: isArabic ? 'النفقات الرأسمالية' : 'CapEx',                value: capex_abs,    format: 'num',   context: capexPct !== null ? `${capexPct.toFixed(1)}% of revenue` : unit },
  ].filter(Boolean) as RatioItem[];

  const row2hasTwo = showPL && showMargin;
  const row3hasTwo = showTrend && showCF;
  const row4hasTwo = showBSDonut && showAssetDonut;

  return (
    <div className="space-y-4" dir={isArabic ? 'rtl' : 'ltr'}>

      {/* ── Regenerate button ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          {sup.company_name && <p className="text-sm font-bold text-[var(--foreground)]">{sup.company_name}</p>}
          <p className="text-xs text-[var(--muted-foreground)]">
            {isArabic ? 'السنة المالية' : 'Fiscal Year'} {sup.fiscal_year ?? cy_pl.year ?? ''}
            {unit ? ` · ${unit}` : ''}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-1.5 rounded-2xl bg-[var(--card)] px-3.5 py-2 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:bg-[var(--card-strong)] hover:text-[var(--foreground)]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {isArabic ? 'إعادة التوليد' : 'Regenerate'}
        </button>
      </div>

      {/* ── Row 1: Hero KPIs ──────────────────────────────────────────────── */}
      {showHero && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard label={isArabic ? 'الإيرادات' : 'Revenue'}            ev={cy_pl.revenue}      priorEv={py_pl?.revenue}      unit={unit} delay={0}   />
          <KPICard label={isArabic ? 'صافي الدخل' : 'Net Income'}        ev={cy_pl.net_income}   priorEv={py_pl?.net_income}   unit={unit} delay={60}  />
          <KPICard label={isArabic ? 'إجمالي الأصول' : 'Total Assets'}   ev={cy_bs.total_assets} priorEv={py_bs?.total_assets} unit={unit} delay={120} />
          <KPICard label={isArabic ? 'التدفق التشغيلي' : 'Operating CF'} ev={cy_cf.operating_cf} priorEv={data.cash_flow.prior_year?.operating_cf} unit={unit} delay={180} />
        </div>
      )}

      {/* ── Row 2: P&L + Margins ──────────────────────────────────────────── */}
      {(showPL || showMargin) && (
        <div className={`grid gap-4 ${row2hasTwo ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
          {showPL && <PLBarChart cy={cy_pl} py={py_pl} colors={colors} isArabic={isArabic} />}
          {showMargin && <MarginPanel cy={cy_pl} py={py_pl} colors={colors} isArabic={isArabic} />}
        </div>
      )}

      {/* ── Row 3: Trend + Cash Flow ───────────────────────────────────────── */}
      {(showTrend || showCF) && (
        <div className={`grid gap-4 ${row3hasTwo ? 'lg:grid-cols-2' : ''}`}>
          {showTrend && py_pl && <TrendChart cy={cy_pl} py={py_pl} colors={colors} isArabic={isArabic} />}
          {showCF && <CashFlowPanel cy={cy_cf} colors={colors} isArabic={isArabic} />}
        </div>
      )}

      {/* ── Row 4: Balance sheet donuts ───────────────────────────────────── */}
      {(showBSDonut || showAssetDonut) && (
        <div className={`grid gap-4 ${row4hasTwo ? 'lg:grid-cols-2' : ''}`}>
          {showBSDonut && (
            <DonutPanel
              title={isArabic ? 'هيكل رأس المال' : 'Capital Structure'}
              subtitle={isArabic ? 'توزيع الميزانية العمومية' : 'Balance Sheet Composition'}
              items={[
                { label: isArabic ? 'حقوق الملكية' : 'Equity',      value: v(cy_bs.total_equity)!,      color: colors.p1, unit },
                { label: isArabic ? 'إجمالي الالتزامات' : 'Liabilities', value: v(cy_bs.total_liabilities)!, color: colors.neg, unit },
              ].filter(i => i.value !== null) as any}
              colors={colors}
              delay={250}
            />
          )}
          {showAssetDonut && (
            <DonutPanel
              title={isArabic ? 'تركيبة الأصول' : 'Asset Composition'}
              subtitle={isArabic ? 'الأصول المتداولة وغير المتداولة' : 'Current vs Non-Current'}
              items={[
                { label: isArabic ? 'الأصول المتداولة' : 'Current',     value: v(cy_bs.current_assets)!,     color: colors.p2, unit },
                { label: isArabic ? 'الأصول غير المتداولة' : 'Non-Current', value: v(cy_bs.non_current_assets)!, color: colors.p3, unit },
              ].filter(i => i.value !== null) as any}
              colors={colors}
              delay={280}
            />
          )}
        </div>
      )}

      {/* ── Row 5: Ratio cards ────────────────────────────────────────────── */}
      {ratioItems.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ratioItems.map((item, i) => <RatioCard key={item.label} item={item} delay={300 + i * 40} />)}
        </div>
      )}

      {/* ── Row 6: EPS / Dividend / Zakat ────────────────────────────────── */}
      {(showEPS || showDividend || showZakat) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showEPS && (
            <Panel delay={380} className="flex flex-col gap-3">
              <SectionLabel>{isArabic ? 'ربحية السهم' : 'Earnings Per Share'}</SectionLabel>
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{isArabic ? 'أساسي' : 'Basic'}</p>
                  <div className="flex items-center gap-1.5">
                    <ConfidenceDot level={cy_pl.eps_basic?.confidence} />
                    <p className="text-xl font-black text-[var(--foreground)]">{fmtCard(v(cy_pl.eps_basic))}</p>
                  </div>
                </div>
                {v(cy_pl.eps_diluted) !== null && (
                  <div>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{isArabic ? 'مخفف' : 'Diluted'}</p>
                    <div className="flex items-center gap-1.5">
                      <ConfidenceDot level={cy_pl.eps_diluted?.confidence} />
                      <p className="text-xl font-black text-[var(--foreground)]">{fmtCard(v(cy_pl.eps_diluted))}</p>
                    </div>
                  </div>
                )}
              </div>
              <DeltaBadge value={yoy(v(cy_pl.eps_basic), v(py_pl?.eps_basic))} />
              <p className="text-[10px] text-[var(--muted-foreground)]">{cy_pl.eps_basic?.unit || ''}</p>
            </Panel>
          )}
          {showDividend && (
            <Panel delay={420} className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <ConfidenceDot level={sup.dividend_per_share?.confidence} />
                <SectionLabel>{isArabic ? 'توزيعات السهم' : 'Dividend per Share'}</SectionLabel>
              </div>
              <p className="text-2xl font-black text-[var(--foreground)]">
                {fmtCard(v(sup.dividend_per_share))}
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)]">{sup.dividend_per_share?.unit || ''}</p>
              {payoutRatio !== null && (
                <p className="text-xs font-semibold text-[var(--brand)]">
                  {isArabic ? `نسبة التوزيع: ${payoutRatio.toFixed(1)}%` : `Payout ratio: ${payoutRatio.toFixed(1)}%`}
                </p>
              )}
            </Panel>
          )}
          {showZakat && (
            <SmallCard
              label={isArabic ? 'الزكاة وضريبة الدخل' : 'Zakat & Income Tax'}
              ev={cy_pl.zakat_and_tax}
              priorEv={py_pl?.zakat_and_tax}
              delay={460}
            />
          )}
        </div>
      )}

      {/* ── Row 7: Segment breakdown ──────────────────────────────────────── */}
      {showSegments && (
        <SegmentPanel
          segments={sup.segments}
          unit={unit}
          colors={colors}
          isArabic={isArabic}
        />
      )}

    </div>
  );
}
