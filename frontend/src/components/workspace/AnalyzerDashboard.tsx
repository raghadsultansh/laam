'use client';

import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  AlertTriangle, BookOpen, ChevronDown, ChevronUp,
  FileText, Shield, TrendingDown, TrendingUp,
} from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { Dashboard } from './Dashboard';

// ── Aramco figures (USD billions) — sourced from published Annual Reports ─────
// Revenue, EBIT, D&A: 2024 AR p.40/166; Net income: 2024 AR p.122; OCF/Capex: 2024 AR p.170
// Balance sheet: 2024 AR p.168; Dividends: 2022 AR p.162 + 2024 AR p.170
const YEARS = ['2020', '2021', '2022', '2023', '2024'] as const;

const DATA = {
  // 2024 AR p.40/166 five-year summary
  revenue:     [229.9, 400.5, 604.4, 495.0, 480.4],
  netIncome:   [49.0,  110.0, 161.1, 121.3, 106.2],
  // EBITDA = EBIT + D&A; EBIT from 2024 AR p.166, D&A from 2022 AR p.158/162
  ebitda:      [122.2, 228.6, 329.5, 257.4, 234.1],
  // net margin = net income / revenue
  netMargin:   [21.3,  27.5,  26.7,  24.5,  22.1],
  // EBITDA margin = EBITDA / revenue
  ebitdaMargin:[53.2,  57.1,  54.5,  52.0,  48.8],
  // ROE = net income (shareholders) / shareholders' equity; 2024 AR p.122/168
  roe:         [16.7,  37.6,  46.6,  30.3,  26.3],
  // ROA = net income / total assets; 2024 AR p.122/168
  roa:         [9.6,   19.1,  24.2,  18.4,  16.4],
};

// All figures from 2024 Annual Report unless noted
// p.32 = Key metrics; p.44 = FCF; p.47 = Reserves/lifting cost; p.122/166/168 = financials
const RATIOS_2024 = [
  // Net margin: 106.2 / 480.4 = 22.1%; EBITDA margin: 234.1 / 480.4 = 48.8%
  { labelEn: 'Net Margin',        labelAr: 'هامش الربح الصافي',       value: '22.1%',  context: 'vs industry avg ~9% (2024 AR p.166)',  contextAr: 'مقابل متوسط الصناعة ~9%',             good: true  },
  { labelEn: 'EBITDA Margin',     labelAr: 'هامش EBITDA',             value: '48.8%',  context: 'Top-decile globally (2024 AR p.166)',  contextAr: 'ضمن أفضل 10% عالمياً',                good: true  },
  // ROE: net income to shareholders $105.0B / avg equity $399.0B = 26.3% (2024 AR p.122/168)
  { labelEn: 'ROE',               labelAr: 'العائد على حقوق الملكية', value: '26.3%',  context: 'vs 30.3% in 2023 (2024 AR p.122)',    contextAr: 'مقابل 30.3% في 2023',                 good: false },
  // ROA: 106.2 / 646.3 = 16.4% (2024 AR p.168)
  { labelEn: 'ROA',               labelAr: 'العائد على الأصول',       value: '16.4%',  context: 'vs 18.4% in 2023 (2024 AR p.168)',    contextAr: 'مقابل 18.4% في 2023',                 good: false },
  // ROACE stated directly: 20.2% (2024 AR p.32)
  { labelEn: 'ROACE',             labelAr: 'العائد على رأس المال',     value: '20.2%',  context: '2024 AR p.32 — stated figure',        contextAr: '2024 AR ص.32 — رقم مُصرَّح به',       good: true  },
  // Debt/equity: 85.1 / 440.4 = 0.19× (2024 AR p.168)
  { labelEn: 'Debt / Equity',     labelAr: 'نسبة الدين / حقوق الملكية',value: '0.19×', context: 'Down from 0.17× in 2023 (2024 AR p.168)',contextAr: 'ارتفع من 0.17× في 2023',             good: null  },
  // Net debt: $85.1B - $57.8B = $27.3B; Net Debt/EBITDA: 27.3/234.1 = 0.12× (2024 AR p.168)
  { labelEn: 'Net Debt / EBITDA', labelAr: 'صافي الدين / EBITDA',     value: '0.12×',  context: 'Net debt $27.3B (2024 AR p.168)',      contextAr: 'صافي الدين 27.3 مليار$ (2024 AR p.168)', good: true },
  // Interest coverage: EBIT $206.6B / finance costs $2.8B = 73.8× (2024 AR p.166)
  { labelEn: 'Interest Coverage', labelAr: 'نسبة تغطية الفائدة',      value: '73.8×',  context: 'EBIT / finance costs (2024 AR p.166)', contextAr: 'EBIT / تكاليف التمويل',                good: true  },
  // Current ratio: current assets $150.8B / current liabilities $79.8B = 1.89× (2024 AR p.168)
  { labelEn: 'Current Ratio',     labelAr: 'نسبة التداول',             value: '1.89×',  context: '2024 AR p.168 — balance sheet',       contextAr: '2024 AR ص.168 — الميزانية',            good: true  },
  // Gearing stated directly: 4.5% (2024 AR p.32)
  { labelEn: 'Gearing',           labelAr: 'نسبة الرفع المالي',        value: '4.5%',   context: '2024 AR p.32 — stated figure',        contextAr: '2024 AR ص.32 — رقم مُصرَّح به',       good: true  },
  // FCF: $85.3B stated (2024 AR p.44); market cap ~$1.8T at Dec 2024
  { labelEn: 'FCF Yield',         labelAr: 'عائد التدفق النقدي الحر', value: '~4.7%',  context: 'FCF $85.3B (2024 AR p.44)',            contextAr: 'التدفق النقدي الحر 85.3 مليار$',       good: true  },
  // EPS: stated $0.43/share on 242B shares (2024 AR p.166); prior year $0.50
  { labelEn: 'EPS (FY2024)',       labelAr: 'ربحية السهم',              value: '$0.43',  context: 'Down from $0.50 in 2023 (AR p.166)',  contextAr: 'انخفض من $0.50 في 2023',              good: false },
  // DPS: $0.51/share on 242B shares (total $124.2B paid, 2024 AR p.170)
  { labelEn: 'DPS (FY2024)',       labelAr: 'توزيعات السهم',            value: '$0.51',  context: 'Total paid $124.2B (2024 AR p.170)',  contextAr: 'إجمالي مُوزَّع 124.2 مليار$',         good: true  },
  // Payout ratio: DPS $0.51 / EPS $0.43 = 119%
  { labelEn: 'Payout Ratio',      labelAr: 'نسبة التوزيع',             value: '119%',   context: 'Exceeds earnings — debt funded',       contextAr: 'يتجاوز الأرباح — ممول بالدين',        good: false },
  // Book value per share: shareholders equity $388.9B / 242B shares = $1.61 (2024 AR p.168/171)
  { labelEn: 'Book Value / Share', labelAr: 'القيمة الدفترية للسهم',   value: '$1.61',  context: 'Equity $388.9B ÷ 242B shares (AR p.168)', contextAr: 'حقوق الملكية $388.9B ÷ 242B سهم', good: null  },
  // Lifting cost: stated $3.53/boe (2024 AR p.47)
  { labelEn: 'Lifting Cost',       labelAr: 'تكلفة الرفع',             value: '$3.53/boe', context: '2024 AR p.47 — upstream cost',      contextAr: '2024 AR ص.47 — تكلفة أولية',          good: true  },
];

const HEALTH = {
  profitability: 78,
  liquidity:     62,
  leverage:      55,
  growth:        45,
  overall:       60,
  verdict: 'Stable' as const,
};

const VERDICT_CONFIG = {
  Strong: { color: '#10b981', soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', labelEn: 'Strong',  labelAr: 'قوي'  },
  Stable: { color: '#3b82f6', soft: 'bg-blue-50 dark:bg-blue-950/40',       text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-500',    labelEn: 'Stable',  labelAr: 'مستقر' },
  Watch:  { color: '#f59e0b', soft: 'bg-amber-50 dark:bg-amber-950/40',     text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-500',   labelEn: 'Watch',   labelAr: 'مراقبة' },
  Weak:   { color: '#ef4444', soft: 'bg-red-50 dark:bg-red-950/40',         text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-500',     labelEn: 'Weak',    labelAr: 'ضعيف' },
};

// All page references below are from saudi-aramco-ara-2024-english.pdf
const FINDINGS = [
  {
    type: 'negative' as const,
    Icon: TrendingDown,
    titleEn: 'Revenue declined 3.0% YoY to $480.4B — second consecutive contraction from 2022 peak',
    titleAr: 'تراجعت الإيرادات 3.0% سنوياً إلى 480.4 مليار دولار — الانخفاض السنوي الثاني من ذروة 2022',
    bodyEn: 'Total revenues and other income fell from $495.0B in 2023 to $480.4B in 2024 (2024 AR p.166). The 2022 peak of $604.4B reflected the post-COVID price surge; the subsequent compression reflects lower average realized crude prices ($80.2/bbl in 2024 vs $84.9/bbl in 2023, per AR p.32) and OPEC+ voluntary production curtailments maintained throughout the year.',
    bodyAr: 'انخفضت إجمالي الإيرادات والدخل الآخر من 495.0 مليار دولار في 2023 إلى 480.4 مليار دولار في 2024 (التقرير السنوي 2024 ص.166). وكانت ذروة 2022 البالغة 604.4 مليار دولار نتيجة ارتفاع الأسعار عقب كوفيد؛ وينعكس الانضغاط اللاحق في انخفاض متوسط الأسعار المُحققة (80.2$/برميل في 2024 مقابل 84.9$/برميل في 2023) وتخفيضات أوبك+.',
    ref: '2024 Annual Report, p. 166 — Consolidated Income Statement; p. 32 — Key Metrics',
  },
  {
    type: 'negative' as const,
    Icon: TrendingDown,
    titleEn: 'Net income fell 12.4% to $106.2B; net margin compressed to 22.1%',
    titleAr: 'صافي الدخل انخفض 12.4% إلى 106.2 مليار دولار؛ هامش الربح تقلّص إلى 22.1%',
    bodyEn: 'Net income attributable to shareholders declined from $120.7B in 2023 to $105.0B in 2024, with total net income (including NCI) at $106.2B (2024 AR p.122). Net margin fell from 24.5% to 22.1% — a 240 bps contraction. Despite the decline, this remains materially above the integrated oil & gas peer average of approximately 9%.',
    bodyAr: 'انخفض صافي الدخل العائد للمساهمين من 120.7 مليار دولار في 2023 إلى 105.0 مليار دولار في 2024، فيما بلغ إجمالي صافي الدخل (بما يشمل الأقليات) 106.2 مليار دولار (التقرير السنوي 2024 ص.122). تراجع هامش الربح الصافي من 24.5% إلى 22.1% — انكماش بمقدار 240 نقطة أساس.',
    ref: '2024 Annual Report, p. 122 — Consolidated Statements; p. 166 — Five-Year Summary',
  },
  {
    type: 'alert' as const,
    Icon: AlertTriangle,
    titleEn: 'Dividends paid ($124.2B) exceed free cash flow ($85.3B) — first FCF shortfall on record',
    titleAr: 'التوزيعات المدفوعة (124.2 مليار$) تتجاوز التدفق النقدي الحر (85.3 مليار$) — أول عجز في التاريخ',
    bodyEn: 'Operating cash flow of $135.7B less capex of $50.4B yields free cash flow of $85.3B (2024 AR p.44). Total dividends paid of $124.2B (p.170) produced a shortfall of $38.9B — the first time dividend commitments have exceeded FCF. This was funded by a net increase in borrowings from $77.4B to $85.1B (p.168). The payout ratio reached 119% of earnings per share ($0.51 DPS vs $0.43 EPS, p.166).',
    bodyAr: 'التدفق النقدي التشغيلي 135.7 مليار دولار مطروحاً منه النفقات الرأسمالية 50.4 مليار دولار يُعطي تدفقاً نقدياً حراً قدره 85.3 مليار دولار (التقرير 2024 ص.44). وأسفرت إجمالي التوزيعات المدفوعة البالغة 124.2 مليار دولار (ص.170) عن عجز قدره 38.9 مليار دولار — المرة الأولى التي تتجاوز فيها التوزيعات التدفق النقدي الحر. وقد موّل ذلك ارتفاعٌ صافٍ في الاقتراضات من 77.4 إلى 85.1 مليار دولار (ص.168).',
    ref: '2024 Annual Report, p. 44 — FCF; p. 168 — Balance Sheet; p. 170 — Cash Flow Statement',
  },
  {
    type: 'positive' as const,
    Icon: TrendingUp,
    titleEn: 'Lifting cost $3.53/boe and EBITDA margin 48.8% — industry-leading cost structure',
    titleAr: 'تكلفة الرفع 3.53$/برميل مكافئ وهامش EBITDA 48.8% — هيكل تكلفة يتصدر الصناعة',
    bodyEn: 'Upstream lifting cost of $3.53/boe (2024 AR p.47) remains among the lowest globally, sustaining profitability across price cycles. Average realized crude price was $80.2/bbl (p.32). EBITDA of $234.1B on revenues of $480.4B yields a 48.8% EBITDA margin — significantly above Shell (~22%) and BP (~18%). ROACE of 20.2% (p.32) reflects capital efficiency supported by proved reserves of 250.0 billion BOE with a reserve life of approximately 50 years.',
    bodyAr: 'تظل تكلفة الرفع الأولية البالغة 3.53$/برميل مكافئ (التقرير 2024 ص.47) في مصاف الأدنى عالمياً، مما يُعزز الربحية عبر دورات الأسعار. بلغ متوسط سعر النفط الخام المُحقق 80.2$/برميل (ص.32). يُعطي EBITDA البالغ 234.1 مليار دولار على إيرادات 480.4 مليار دولار هامشاً بنسبة 48.8%. والعائد على رأس المال المُوظَّف (ROACE) 20.2% (ص.32) يعكس كفاءة رأس المال مع احتياطيات مثبتة تبلغ 250.0 مليار برميل مكافئ.',
    ref: '2024 Annual Report, p. 32 — Key Metrics; p. 47 — Reserves & Upstream Data',
  },
  {
    type: 'neutral' as const,
    Icon: FileText,
    titleEn: 'Capex rose to $50.4B in 2024; proved reserves 250.0B BOE with ~50-year reserve life',
    titleAr: 'النفقات الرأسمالية ارتفعت إلى 50.4 مليار$ في 2024؛ احتياطيات مثبتة 250.0 مليار برميل مكافئ',
    bodyEn: 'Capital expenditure increased from $42.2B in 2023 to $50.4B in 2024 (2024 AR p.170), reflecting continued upstream capacity investment and downstream integration. Proved reserves stand at 250.0 billion BOE (p.47) — comprising 189.8 billion barrels of crude oil & condensate, 26.1 billion barrels of NGL, and 209.8 trillion scf of natural gas — implying a reserve life of approximately 50 years at current production rates.',
    bodyAr: 'ارتفعت النفقات الرأسمالية من 42.2 مليار دولار في 2023 إلى 50.4 مليار دولار في 2024 (التقرير 2024 ص.170)، مما يعكس الاستثمار المستمر في الطاقة الأولية والتكامل اللاحق. تبلغ الاحتياطيات المثبتة 250.0 مليار برميل مكافئ (ص.47) — تشمل 189.8 مليار برميل نفط خام وكثافات، و26.1 مليار برميل سوائل غاز طبيعي، و209.8 تريليون قدم مكعب غاز طبيعي — بما يعني عمر احتياطي نحو 50 عاماً.',
    ref: '2024 Annual Report, p. 47 — Reserves; p. 170 — Capital Expenditure',
  },
];

const FINDING_STYLE = {
  negative: { iconCls: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700' },
  alert:    { iconCls: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-300 dark:border-red-700'   },
  positive: { iconCls: 'text-emerald-500',bg:'bg-emerald-50 dark:bg-emerald-950/30',border:'border-emerald-300 dark:border-emerald-700'},
  neutral:  { iconCls: 'text-blue-500',  bg: 'bg-[var(--background)]',           border: 'border-[var(--border)]'                },
};

// ── Chart data ────────────────────────────────────────────────────────────────
const revenueData = YEARS.map((y, i) => ({
  year: y,
  Revenue: DATA.revenue[i],
  EBITDA: DATA.ebitda[i],
  'Net Income': DATA.netIncome[i],
}));

const marginData = YEARS.map((y, i) => ({
  year: y,
  'Net Margin': DATA.netMargin[i],
  'EBITDA Margin': DATA.ebitdaMargin[i],
  'ROE': DATA.roe[i],
}));

// OCF/Capex/Dividends: 2024 AR p.170 — Consolidated Statement of Cash Flows
const cashData = ['2022', '2023', '2024'].map((y, i) => ({
  year: y,
  'Op. Cash Flow': [186.2, 143.4, 135.7][i],
  'Capex':         [37.6,  42.2,  50.4][i],
  'Dividends':     [75.0,  97.8,  124.2][i],
}));

// ── SVG ring gauge ────────────────────────────────────────────────────────────
function RingGauge({ scores, overall, verdictColor }: {
  scores: { label: string; labelAr: string; value: number; color: string }[];
  overall: number;
  verdictColor: string;
}) {
  const cx = 90; const cy = 90;
  const rings = [
    { r: 76, ...scores[0] },
    { r: 62, ...scores[1] },
    { r: 48, ...scores[2] },
    { r: 34, ...scores[3] },
  ];
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44">
      {rings.map(({ r, value, color }) => {
        const circ = 2 * Math.PI * r;
        const filled = (value / 100) * circ;
        return (
          <g key={r}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={10}
              className="text-[var(--border)]" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ - filled}`}
              transform={`rotate(-90 ${cx} ${cy})`} />
          </g>
        );
      })}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize={22} fontWeight={700} fill={verdictColor}>{overall}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={10} fill="currentColor" className="fill-[var(--muted-foreground)]">/100</text>
    </svg>
  );
}

// ── Ratio row ─────────────────────────────────────────────────────────────────
function RatioRow({ ratio, isArabic }: { ratio: typeof RATIOS_2024[0]; isArabic: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--muted-foreground)] w-36 shrink-0">
        {isArabic ? ratio.labelAr : ratio.labelEn}
      </span>
      <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">{ratio.value}</span>
      <span className={`text-[11px] ${ratio.good === true ? 'text-emerald-600 dark:text-emerald-400' : ratio.good === false ? 'text-red-500' : 'text-[var(--muted-foreground)]'}`}>
        {isArabic ? ratio.contextAr : ratio.context}
      </span>
      {ratio.good === true  && <TrendingUp   className="h-3 w-3 shrink-0 text-emerald-500" />}
      {ratio.good === false && <TrendingDown  className="h-3 w-3 shrink-0 text-red-500"     />}
      {ratio.good === null  && <span className="h-3 w-3 shrink-0" />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AnalyzerDashboard({ reportId }: { reportId?: string }) {
  const { locale, theme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = theme === 'dark';
  const [openFinding, setOpenFinding] = useState<number | null>(null);

  const grid  = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.055)';
  const axis  = isDark ? 'rgba(255,255,255,0.38)'  : 'rgba(15,23,42,0.45)';
  const tipBg = isDark ? '#0c1520' : '#ffffff';
  const vc    = VERDICT_CONFIG[HEALTH.verdict];

  const ringScores = [
    { label: 'Profitability', labelAr: 'الربحية', value: HEALTH.profitability, color: '#10b981' },
    { label: 'Liquidity',     labelAr: 'السيولة', value: HEALTH.liquidity,     color: '#3b82f6' },
    { label: 'Leverage',      labelAr: 'الرفع',   value: HEALTH.leverage,      color: '#f59e0b' },
    { label: 'Growth',        labelAr: 'النمو',   value: HEALTH.growth,        color: '#8b5cf6' },
  ];

  return (
    <div className="h-full overflow-y-auto space-y-4 px-1 py-2" dir={isArabic ? 'rtl' : 'ltr'}>

      {/* ── Health Snapshot ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--brand)]" />
            <span className="text-sm font-bold text-[var(--foreground)]">
              {isArabic ? 'لقطة الصحة المالية' : 'Financial Health Snapshot'}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">Saudi Aramco · FY2024</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${vc.soft} ${vc.text}`}>
            <span className={`h-2 w-2 rounded-full ${vc.dot}`} />
            {isArabic ? vc.labelAr : vc.labelEn}
          </span>
        </div>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* Ring gauge */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <RingGauge scores={ringScores} overall={HEALTH.overall} verdictColor={vc.color} />
            <p className="max-w-[11rem] text-center text-[10px] leading-4 text-[var(--muted-foreground)]">
              {isArabic
                ? 'مؤشر تحليلي — لا يُعد نصيحة استثمارية'
                : 'Analytical indicator — not investment advice'}
            </p>
          </div>

          {/* Score legend */}
          <div className="flex flex-1 flex-col gap-3">
            {ringScores.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-[var(--muted-foreground)]">
                  {isArabic ? s.labelAr : s.label}
                </span>
                <div className="relative h-2 flex-1 rounded-full bg-[var(--border)]">
                  <div
                    className="absolute inset-y-0 start-0 rounded-full transition-all duration-700"
                    style={{ width: `${s.value}%`, background: s.color }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right text-xs font-bold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Findings ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--brand)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'المشاهدات التحليلية الرئيسية' : 'Key Analytical Observations'}
          </span>
          <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
            {FINDINGS.length}
          </span>
        </div>
        <div className="space-y-2">
          {FINDINGS.map((f, i) => {
            const st = FINDING_STYLE[f.type];
            const isOpen = openFinding === i;
            return (
              <div key={i} className={`rounded-xl border ${st.border} ${st.bg} overflow-hidden`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-start"
                  onClick={() => setOpenFinding(isOpen ? null : i)}
                >
                  <f.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${st.iconCls}`} />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)] leading-5">
                    {isArabic ? f.titleAr : f.titleEn}
                  </span>
                  {isOpen
                    ? <ChevronUp   className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                    : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />}
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 space-y-2">
                    <p className="text-sm leading-7 text-[var(--foreground)]">
                      {isArabic ? f.bodyAr : f.bodyEn}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-[var(--muted-foreground)]" />
                      <span className="text-[11px] text-[var(--muted-foreground)]">{f.ref}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Revenue & Earnings 5-year trend ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
          {isArabic ? 'الإيرادات والأرباح 2020–2024 (مليار دولار)' : 'Revenue & Earnings 2020–2024 (USD B)'}
        </p>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={revenueData}>
            <defs>
              {[['gR','#10b981'],['gE','#8b5cf6'],['gN','#3b82f6']].map(([id,c]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={c} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={c} stopOpacity={0}    />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
            <XAxis dataKey="year" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={{ background: tipBg, border: 'none', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`$${Number(v).toFixed(1)}B`, '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="Revenue"    stroke="#10b981" fill="url(#gR)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="EBITDA"     stroke="#8b5cf6" fill="url(#gE)" strokeWidth={2} dot={{ r: 3 }} />
            <Area type="monotone" dataKey="Net Income" stroke="#3b82f6" fill="url(#gN)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Margins & Returns / Cash Flow ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'الهوامش والعوائد (%)' : 'Margins & Returns (%)'}
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={marginData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="year" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} width={28} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: tipBg, border: 'none', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${Number(v).toFixed(1)}%`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="EBITDA Margin" fill="#8b5cf6" radius={[4,4,0,0]} />
              <Bar dataKey="Net Margin"    fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="ROE"           fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
          <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'التدفق النقدي ومقارنة التوزيعات (مليار دولار)' : 'Cash Flow vs Dividends (USD B)'}
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={cashData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="year" tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axis, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ background: tipBg, border: 'none', borderRadius: 12, fontSize: 12 }} formatter={(v) => [`$${Number(v).toFixed(1)}B`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Op. Cash Flow" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Capex"         fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="Dividends"     fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Financial Ratios Table ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
          {isArabic ? 'المؤشرات المالية الرئيسية — FY2024' : 'Key Financial Ratios — FY2024'}
        </p>
        <div className="grid gap-x-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {isArabic ? 'الربحية والعوائد' : 'Profitability & Returns'}
            </p>
            {RATIOS_2024.slice(0, 8).map((r) => <RatioRow key={r.labelEn} ratio={r} isArabic={isArabic} />)}
          </div>
          <div className="mt-4 md:mt-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {isArabic ? 'التقييم والبيانات لكل سهم' : 'Valuation & Per Share Data'}
            </p>
            {RATIOS_2024.slice(8).map((r) => <RatioRow key={r.labelEn} ratio={r} isArabic={isArabic} />)}
          </div>
        </div>
      </div>

      {/* ── Standard KPI Dashboard ── */}
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-1">
        <p className="mb-1 px-3 pt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
          {isArabic ? 'لوحة المؤشرات المالية' : 'Financial KPI Dashboard'}
        </p>
        <Dashboard reportId={reportId} />
      </div>
    </div>
  );
}
