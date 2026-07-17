'use client';

import { useState } from 'react';
import {
  BookOpen, Brain, CheckCircle, ChevronRight,
  FileText, Info, Send, XCircle,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

// ── Types ─────────────────────────────────────────────────────────────────────
type TextBlock   = { type: 'text';   content: string };
type TableBlock  = { type: 'table';  headers: string[]; rows: (string | number)[][] };
type ChartBlock  = { type: 'chart';  data: { label: string; value: number }[]; unit: string; color?: string };
type SourceBlock = { type: 'source'; items: { ref: string; snippet: string }[] };
type Block = TextBlock | TableBlock | ChartBlock | SourceBlock;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  mode: 'rag' | 'analysis';
  blocksEn: Block[];
  blocksAr: Block[];
};

// ── Mock messages ─────────────────────────────────────────────────────────────
const MESSAGES: Message[] = [
  {
    id: 'm1', role: 'user', mode: 'rag',
    blocksEn: [{ type: 'text', content: 'What was Aramco\'s total revenue in 2024, and how does it compare to 2022?' }],
    blocksAr: [{ type: 'text', content: 'ما إجمالي إيرادات أرامكو في 2024، وكيف تُقارن بعام 2022؟' }],
  },
  {
    id: 'm2', role: 'assistant', mode: 'rag',
    blocksEn: [
      { type: 'text', content: 'Aramco reported total revenues and other income of **$480.4 billion** in FY2024, a decline of **3.0%** from $495.0 billion in FY2023 and **20.5% below the FY2022 peak** of $604.4 billion.' },
      { type: 'text', content: 'The decline reflects lower average realized crude prices — management states $80.2/bbl in 2024 versus $84.9/bbl in 2023 (a $4.7/bbl reduction) — together with OPEC+ voluntary production curtailments maintained throughout the year.' },
      {
        type: 'source',
        items: [
          { ref: 'Annual Report 2024, p. 166 — Five-Year Financial Summary', snippet: '"Total revenues and other income: 2024 — $480.4B; 2023 — $495.0B; 2022 — $604.4B; 2021 — $400.5B; 2020 — $229.9B."' },
          { ref: 'Annual Report 2024, p. 32 — Key Metrics', snippet: '"Average crude oil price realized: 2024 — $80.2/bbl; 2023 — $84.9/bbl."' },
        ],
      },
    ],
    blocksAr: [
      { type: 'text', content: 'أعلنت أرامكو عن إجمالي إيرادات ودخل آخر بلغ **480.4 مليار دولار** في 2024، بانخفاض **3.0%** من 495.0 مليار دولار في 2023، و**أقل بنسبة 20.5% من ذروة 2022** البالغة 604.4 مليار دولار.' },
      { type: 'text', content: 'يعكس الانخفاض تراجع متوسط أسعار النفط المُحققة — تُصرّح الإدارة بـ 80.2$/برميل في 2024 مقابل 84.9$/برميل في 2023 (انخفاض 4.7$/برميل) — إلى جانب تخفيضات أوبك+ الطوعية طوال العام.' },
      {
        type: 'source',
        items: [
          { ref: 'التقرير السنوي 2024، ص. 166 — الملخص المالي الخمسي', snippet: '"إجمالي الإيرادات والدخل الآخر: 2024 — 480.4 مليار$؛ 2023 — 495.0 مليار$؛ 2022 — 604.4 مليار$."' },
          { ref: 'التقرير السنوي 2024، ص. 32 — المؤشرات الرئيسية', snippet: '"متوسط سعر النفط الخام المُحقق: 2024 — 80.2$/برميل؛ 2023 — 84.9$/برميل."' },
        ],
      },
    ],
  },
  {
    id: 'm3', role: 'user', mode: 'analysis',
    blocksEn: [{ type: 'text', content: 'Run a 5-year trend analysis on net income and margins.' }],
    blocksAr: [{ type: 'text', content: 'أجرِ تحليل اتجاه 5 سنوات على صافي الدخل والهوامش.' }],
  },
  {
    id: 'm4', role: 'assistant', mode: 'analysis',
    // Revenue & net income: 2024 AR p.166; EBITDA derived (EBIT p.166 + D&A p.158)
    blocksEn: [
      { type: 'text', content: 'The following table summarises Aramco\'s net income and margin profile from 2020 through 2024, sourced from the five-year financial summary in the 2024 Annual Report (p.166).' },
      {
        type: 'table',
        headers: ['Year', 'Revenue ($B)', 'Net Income ($B)', 'Net Margin', 'EBITDA ($B)', 'EBITDA Margin'],
        rows: [
          ['2020', 229.9, 49.0, '21.3%', 122.2, '53.2%'],
          ['2021', 400.5, 110.0, '27.5%', 228.6, '57.1%'],
          ['2022', 604.4, 161.1, '26.7%', 329.5, '54.5%'],
          ['2023', 495.0, 121.3, '24.5%', 257.4, '52.0%'],
          ['2024', 480.4, 106.2, '22.1%', 234.1, '48.8%'],
        ],
      },
      { type: 'chart', data: [{ label: '2020', value: 49.0 }, { label: '2021', value: 110.0 }, { label: '2022', value: 161.1 }, { label: '2023', value: 121.3 }, { label: '2024', value: 106.2 }], unit: 'USD B', color: '#3b82f6' },
      { type: 'text', content: '**Observation:** Net income peaked in 2022 at $161.1B on the back of post-COVID price recovery, with revenues reaching $604.4B. The decline through 2024 reflects commodity price normalisation — average realized crude fell from a peak to $80.2/bbl — and OPEC+ voluntary curtailments. Net margin compressed from 27.5% in 2021 to 22.1% in 2024 — a 540 bps contraction — though it remains materially above the integrated oil & gas peer average of approximately 9%. EBITDA margin held relatively stable above 48%, underpinned by the structurally low lifting cost of $3.53/boe (2024 AR p.47).' },
    ],
    blocksAr: [
      { type: 'text', content: 'يلخص الجدول التالي صافي دخل أرامكو وملف هوامشها من 2020 إلى 2024، مصدرها الملخص المالي الخمسي في التقرير السنوي 2024 (ص.166).' },
      {
        type: 'table',
        headers: ['السنة', 'الإيرادات ($م)', 'صافي الدخل ($م)', 'هامش الربح', 'EBITDA ($م)', 'هامش EBITDA'],
        rows: [
          ['2020', 229.9, 49.0, '21.3%', 122.2, '53.2%'],
          ['2021', 400.5, 110.0, '27.5%', 228.6, '57.1%'],
          ['2022', 604.4, 161.1, '26.7%', 329.5, '54.5%'],
          ['2023', 495.0, 121.3, '24.5%', 257.4, '52.0%'],
          ['2024', 480.4, 106.2, '22.1%', 234.1, '48.8%'],
        ],
      },
      { type: 'chart', data: [{ label: '2020', value: 49.0 }, { label: '2021', value: 110.0 }, { label: '2022', value: 161.1 }, { label: '2023', value: 121.3 }, { label: '2024', value: 106.2 }], unit: 'مليار$', color: '#3b82f6' },
      { type: 'text', content: '**ملاحظة:** بلغ صافي الدخل ذروته في 2022 عند 161.1 مليار دولار مع إيرادات 604.4 مليار دولار. يعكس الانخفاض حتى 2024 تطبيع أسعار السلع — انخفض متوسط سعر النفط المُحقق إلى 80.2$/برميل — وقيود أوبك+. تقلّص هامش الربح من 27.5% في 2021 إلى 22.1% في 2024 — بمقدار 540 نقطة أساس — وإن ظل أعلى من متوسط القطاع ~9%. هامش EBITDA تجاوز 48% مدعوماً بتكلفة رفع 3.53$/برميل مكافئ (التقرير 2024 ص.47).' },
    ],
  },
  {
    id: 'm5', role: 'user', mode: 'rag',
    blocksEn: [{ type: 'text', content: 'What is Aramco\'s total debt and net debt position?' }],
    blocksAr: [{ type: 'text', content: 'ما موقف إجمالي ديون أرامكو وصافي ديونها؟' }],
  },
  {
    id: 'm6', role: 'assistant', mode: 'rag',
    // Borrowings & cash: 2024 AR p.168 — Consolidated Balance Sheet; gearing p.32
    blocksEn: [
      { type: 'text', content: 'As at 31 December 2024, total borrowings stood at **$85.1 billion** (up from $77.4B in 2023). Cash and cash equivalents were **$57.8 billion**, yielding net debt of **$27.3 billion** and an implied Net Debt/EBITDA of **0.12×**. Stated gearing (net debt / net debt + equity) was **4.5%** (2024 AR p.32).' },
      { type: 'text', content: 'Total equity attributable to shareholders was $388.9B on a total asset base of $646.3B, producing a debt-to-equity ratio of 0.19× — a materially conservative leverage profile. Finance costs for the year were $2.8B against EBIT of $206.6B, implying interest coverage of approximately 73.8× (2024 AR p.166).' },
      {
        type: 'source',
        items: [
          { ref: 'Annual Report 2024, p. 168 — Consolidated Balance Sheet', snippet: '"Total borrowings: $85.1B (2023: $77.4B). Cash and cash equivalents: $57.8B (2023: $53.1B). Total equity: $440.4B (2023: $463.2B). Total assets: $646.3B."' },
          { ref: 'Annual Report 2024, p. 32 — Key Metrics', snippet: '"Gearing: 4.5% (2023: 3.4%). ROACE: 20.2% (2023: 24.2%)."' },
        ],
      },
    ],
    blocksAr: [
      { type: 'text', content: 'اعتباراً من 31 ديسمبر 2024، بلغ إجمالي الاقتراضات **85.1 مليار دولار** (مرتفعاً من 77.4 مليار في 2023). بلغت النقدية والمعادلات **57.8 مليار دولار**، مما يُعطي صافي دين **27.3 مليار دولار** ونسبة صافي دين/EBITDA **0.12×**. بلغت نسبة الرفع المُعلنة **4.5%** (التقرير 2024 ص.32).' },
      { type: 'text', content: 'بلغ إجمالي حقوق الملكية العائدة للمساهمين 388.9 مليار دولار على قاعدة أصول إجمالية قدرها 646.3 مليار دولار، مما يُنتج نسبة دين/حقوق ملكية 0.19× — ملف رافعة محافظ للغاية. بلغت تكاليف التمويل 2.8 مليار دولار مقابل EBIT بقيمة 206.6 مليار دولار، بما يعني تغطية فائدة ~73.8× (التقرير 2024 ص.166).' },
      {
        type: 'source',
        items: [
          { ref: 'التقرير السنوي 2024، ص. 168 — الميزانية العمومية الموحدة', snippet: '"إجمالي الاقتراضات: 85.1 مليار$ (2023: 77.4 مليار$). النقدية: 57.8 مليار$ (2023: 53.1 مليار$). إجمالي الأصول: 646.3 مليار$."' },
          { ref: 'التقرير السنوي 2024، ص. 32 — المؤشرات الرئيسية', snippet: '"نسبة الرفع: 4.5% (2023: 3.4%). العائد على رأس المال المُوظَّف: 20.2% (2023: 24.2%)."' },
        ],
      },
    ],
  },
  {
    id: 'm7', role: 'user', mode: 'analysis',
    blocksEn: [{ type: 'text', content: 'Evaluate Aramco\'s dividend sustainability and capital allocation.' }],
    blocksAr: [{ type: 'text', content: 'قيّم استدامة توزيعات أرامكو وتخصيص رأس المال.' }],
  },
  {
    id: 'm8', role: 'assistant', mode: 'analysis',
    // OCF, capex, dividends: 2024 AR p.170; FCF: 2024 AR p.44; EPS/DPS: 2024 AR p.166
    blocksEn: [
      { type: 'text', content: 'The table below sets out Aramco\'s capital allocation framework for FY2022–2024, sourced from the consolidated cash flow statement (2024 AR p.170) and FCF disclosure (p.44). Total dividends exceeded free cash flow for the first time in FY2024.' },
      {
        type: 'table',
        headers: ['Metric', 'FY2022', 'FY2023', 'FY2024'],
        rows: [
          ['Operating Cash Flow ($B)', 186.2, 143.4, 135.7],
          ['Capex ($B)', -37.6, -42.2, -50.4],
          ['Free Cash Flow ($B)', 148.5, 101.2, 85.3],
          ['Dividends Paid ($B)', 75.0, 97.8, 124.2],
          ['FCF Surplus / (Deficit) ($B)', 73.5, 3.4, -38.9],
          ['EPS (USD/share)', 0.66, 0.50, 0.43],
          ['DPS (USD/share)', 0.35, 0.41, 0.51],
          ['Payout Ratio', '53%', '82%', '119%'],
        ],
      },
      { type: 'chart', data: [{ label: 'Op. CF', value: 135.7 }, { label: 'Capex', value: 50.4 }, { label: 'FCF', value: 85.3 }, { label: 'Dividends', value: 124.2 }], unit: 'USD B', color: '#ef4444' },
      { type: 'text', content: '**Assessment:** FY2024 marks the first year in which total dividends paid ($124.2B, 2024 AR p.170) exceeded free cash flow of $85.3B (p.44), producing a shortfall of $38.9B. Total borrowings increased from $77.4B to $85.1B (p.168) to partially fund the gap. DPS of $0.51 exceeded EPS of $0.43 (p.166), yielding a payout ratio of 119% — the first breach of 100%. Sustaining this dividend level requires either a sustained crude price recovery above ~$90/bbl or a reduction in dividend commitments. Capex guidance of $48–58B through 2028 adds further FCF pressure. This is a material risk factor for investors with a 12–36 month horizon.' },
    ],
    blocksAr: [
      { type: 'text', content: 'يوضح الجدول إطار تخصيص رأس المال للسنوات المالية 2022–2024، مصدره قائمة التدفقات النقدية (التقرير 2024 ص.170) وإفصاح التدفق النقدي الحر (ص.44). تجاوزت إجمالي التوزيعات التدفق النقدي الحر للمرة الأولى في 2024.' },
      {
        type: 'table',
        headers: ['المؤشر', 'السنة المالية 2022', 'السنة المالية 2023', 'السنة المالية 2024'],
        rows: [
          ['التدفق النقدي التشغيلي ($م)', 186.2, 143.4, 135.7],
          ['النفقات الرأسمالية ($م)', -37.6, -42.2, -50.4],
          ['التدفق النقدي الحر ($م)', 148.5, 101.2, 85.3],
          ['التوزيعات المدفوعة ($م)', 75.0, 97.8, 124.2],
          ['فائض/(عجز) التدفق النقدي الحر ($م)', 73.5, 3.4, -38.9],
          ['ربحية السهم (دولار/سهم)', 0.66, 0.50, 0.43],
          ['توزيعات السهم (دولار/سهم)', 0.35, 0.41, 0.51],
          ['نسبة التوزيع', '53%', '82%', '119%'],
        ],
      },
      { type: 'chart', data: [{ label: 'التشغيلي', value: 135.7 }, { label: 'النفقات', value: 50.4 }, { label: 'الحر', value: 85.3 }, { label: 'التوزيعات', value: 124.2 }], unit: 'مليار$', color: '#ef4444' },
      { type: 'text', content: '**التقييم:** يُمثل 2024 السنة الأولى التي تتجاوز فيها إجمالي التوزيعات (124.2 مليار$، التقرير ص.170) التدفق النقدي الحر (85.3 مليار$، ص.44)، مما أفرز عجزاً قدره 38.9 مليار$. ارتفعت الاقتراضات من 77.4 إلى 85.1 مليار$ (ص.168) لتمويل جزء من العجز. بلغت توزيعات السهم 0.51$ مقابل ربحية 0.43$ (ص.166)، بنسبة توزيع 119% — المرة الأولى التي تتجاوز 100%. يستدعي الحفاظ على هذا المستوى إما تعافي أسعار النفط فوق ~90$/برميل أو تخفيض الالتزامات.' },
    ],
  },
];

// ── Render helpers ────────────────────────────────────────────────────────────
function renderText(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm leading-7 text-[var(--foreground)]">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}

function TableView({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-b border-[var(--border)] last:border-0 ${ri % 2 !== 0 ? 'bg-[var(--background)]/40' : ''}`}>
              {row.map((cell, ci) => {
                const isNeg = typeof cell === 'number' && cell < 0;
                return (
                  <td key={ci} className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${ci === 0 ? 'font-medium text-[var(--foreground)]' : isNeg ? 'text-red-500' : 'text-[var(--foreground)]'}`}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartView({ data, unit, color, isDark }: {
  data: { label: string; value: number }[];
  unit: string;
  color?: string;
  isDark: boolean;
}) {
  const axis  = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(15,23,42,0.45)';
  const grid  = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';
  const tipBg = isDark ? '#0c1520' : '#ffffff';
  return (
    <div className="rounded-xl bg-[var(--background)] p-3">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="label" tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: axis, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ background: tipBg, border: 'none', borderRadius: 10, fontSize: 11 }}
            formatter={(v) => [`${Number(v).toFixed(1)} ${unit}`, '']}
          />
          <Bar dataKey="value" fill={color ?? '#3b82f6'} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SourceView({ items, isArabic }: { items: { ref: string; snippet: string }[]; isArabic: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <FileText className="h-3 w-3 text-[var(--brand)]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          {isArabic ? 'المصادر' : 'Sources'}
        </span>
      </div>
      {items.map((s, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 shrink-0 text-[var(--brand)]" />
            <span className="text-[11px] font-semibold text-[var(--foreground)]">{s.ref}</span>
          </div>
          <p className="ms-4 border-s-2 border-[var(--brand-soft)] ps-2 text-[11px] leading-5 italic text-[var(--muted-foreground)]">
            {s.snippet}
          </p>
        </div>
      ))}
    </div>
  );
}

function renderBlocks(blocks: Block[], isArabic: boolean, isDark: boolean) {
  return blocks.map((block, i) => {
    if (block.type === 'text')   return <div key={i}>{renderText(block.content)}</div>;
    if (block.type === 'table')  return <TableView  key={i} headers={block.headers} rows={block.rows} />;
    if (block.type === 'chart')  return <ChartView  key={i} data={block.data} unit={block.unit} color={block.color} isDark={isDark} />;
    if (block.type === 'source') return <SourceView key={i} items={block.items} isArabic={isArabic} />;
    return null;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AnalyzerChat() {
  const { locale, theme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark   = theme === 'dark';

  const [analysisMode, setAnalysisMode] = useState(false);
  const [inputValue,   setInputValue]   = useState('');

  const analyColor = '#8b5cf6';

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* ── Header / Toggle ── */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          {analysisMode
            ? <Brain    className="h-4 w-4" style={{ color: analyColor }} />
            : <BookOpen className="h-4 w-4 text-[var(--brand)]" />}
          <span className="text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'مساعد التحليل' : 'Analysis Assistant'}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">Saudi Aramco · FY2024</span>
        </div>

        {/* Toggle — uses logical properties so RTL auto-flips label order */}
        <button
          type="button"
          role="switch"
          aria-checked={analysisMode}
          onClick={() => setAnalysisMode((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 transition"
        >
          <span
            className="text-[11px] font-semibold transition-colors"
            style={{ color: !analysisMode ? 'var(--brand)' : 'var(--muted-foreground)' }}
          >
            {isArabic ? 'موثّق' : 'Grounded'}
          </span>
          {/* Track */}
          <div
            className="relative h-5 w-9 rounded-full transition-colors duration-200"
            style={{ background: analysisMode ? analyColor : 'var(--brand)' }}
          >
            {/* Thumb — insetInlineStart is RTL-safe */}
            <div
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ insetInlineStart: analysisMode ? '18px' : '2px' }}
            />
          </div>
          <span
            className="text-[11px] font-semibold transition-colors"
            style={{ color: analysisMode ? analyColor : 'var(--muted-foreground)' }}
          >
            {isArabic ? 'تحليل' : 'Analysis'}
          </span>
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {MESSAGES.map((msg) => {
          const blocks = isArabic ? msg.blocksAr : msg.blocksEn;
          const isUser = msg.role === 'user';
          const isRag  = msg.mode === 'rag';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {!isUser && (
                <div
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: isRag
                      ? 'color-mix(in srgb, var(--brand) 12%, transparent)'
                      : 'color-mix(in srgb, #8b5cf6 12%, transparent)',
                  }}
                >
                  {isRag
                    ? <BookOpen className="h-3.5 w-3.5 text-[var(--brand)]" />
                    : <Brain    className="h-3.5 w-3.5" style={{ color: analyColor }} />}
                </div>
              )}

              <div className={`max-w-[85%] space-y-3 ${isUser ? 'ms-auto' : ''}`}>
                {!isUser && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: isRag ? 'var(--brand)' : analyColor }}
                  >
                    {isRag
                      ? (isArabic ? 'استرجاع موثّق' : 'Grounded Retrieval')
                      : (isArabic ? 'تحليل كمي' : 'Quantitative Analysis')}
                  </span>
                )}

                {isUser ? (
                  <div className="rounded-2xl px-4 py-2.5" style={{ background: 'var(--brand)', color: 'white' }}>
                    {renderBlocks(blocks, isArabic, isDark)}
                  </div>
                ) : (
                  <div className="space-y-3">{renderBlocks(blocks, isArabic, isDark)}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-[var(--border)] px-3 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-2 ring-1 ring-[var(--border)] focus-within:ring-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              analysisMode
                ? (isArabic ? 'اطلب تحليلاً كمياً أو مقارنة...' : 'Request a quantitative analysis or comparison...')
                : (isArabic ? 'اسأل عن التقرير بالاستناد إلى المصادر...' : 'Ask about the report with source citations...')
            }
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
          />
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition"
            style={{ background: analysisMode ? analyColor : 'var(--brand)' }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--muted-foreground)]">
          {isArabic
            ? 'محادثة تجريبية — البيانات من التقارير السنوية المنشورة'
            : 'Demo conversation — data sourced from published annual reports'}
        </p>
      </div>
    </div>
  );
}
