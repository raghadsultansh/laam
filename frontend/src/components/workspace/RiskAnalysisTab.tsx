'use client';

import { useState } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronUp, Download,
  FileText, Info, MessageSquare, ShieldAlert, TrendingDown, TrendingUp,
} from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity = 'high' | 'medium' | 'low';
type SentimentScore = 'positive' | 'cautious' | 'neutral' | 'negative';

type Flag = {
  id: string;
  category: string;
  categoryAr: string;
  severity: Severity;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  ref: string;
};

type SentimentSection = {
  sectionEn: string;
  sectionAr: string;
  score: SentimentScore;
  scoreLabel: string;
  scoreLabelAr: string;
  snippetEn: string;
  snippetAr: string;
  ref: string;
};

// ── Data — sourced from saudi-aramco-ara-2024-english.pdf ─────────────────────
const FLAGS: Flag[] = [
  {
    id: 'f1',
    category: 'Capital Allocation',
    categoryAr: 'تخصيص رأس المال',
    severity: 'high',
    titleEn: 'Dividends ($124.2B) exceeded free cash flow ($85.3B) for the first time on record',
    titleAr: 'التوزيعات (124.2 مليار$) تجاوزت التدفق النقدي الحر (85.3 مليار$) للمرة الأولى',
    bodyEn: 'Total dividends paid of $124.2B (2024 AR p.170) exceeded free cash flow of $85.3B (p.44), producing a shortfall of $38.9B. This was partially funded by a net increase in borrowings of $7.7B ($77.4B → $85.1B, p.168). The payout ratio reached 119% of reported EPS ($0.51 DPS vs $0.43 EPS, p.166) — the first breach of 100% in the company\'s listed history. If crude prices remain at current levels, sustaining this dividend level will require continued net borrowing or a formal reduction in the performance-linked tranche.',
    bodyAr: 'تجاوزت إجمالي التوزيعات المدفوعة البالغة 124.2 مليار دولار (التقرير 2024 ص.170) التدفق النقدي الحر البالغ 85.3 مليار دولار (ص.44)، مما أفرز عجزاً قدره 38.9 مليار دولار. وقد موّل ذلك جزئياً ارتفاعٌ صافٍ في الاقتراضات بمقدار 7.7 مليار دولار (من 77.4 إلى 85.1 مليار دولار، ص.168). بلغت نسبة التوزيع 119% من ربحية السهم المُبلَّغ عنها (0.51$ توزيعات مقابل 0.43$ ربحية، ص.166) — وهو أول اختراق لحاجز 100% في تاريخ الشركة المُدرجة.',
    ref: '2024 AR p.44 (FCF) · p.166 (EPS/DPS) · p.170 (Cash Flows) · p.168 (Balance Sheet)',
  },
  {
    id: 'f2',
    category: 'Cash Flow',
    categoryAr: 'التدفق النقدي',
    severity: 'high',
    titleEn: 'Free cash flow declined 42.5% over two years: $148.5B (2022) → $85.3B (2024)',
    titleAr: 'التدفق النقدي الحر تراجع 42.5% خلال عامين: 148.5 مليار$ (2022) → 85.3 مليار$ (2024)',
    bodyEn: 'Free cash flow fell from $148.5B in 2022 to $101.2B in 2023 and further to $85.3B in 2024 (2024 AR p.44) — a cumulative 42.5% decline over two years. This trend is driven by two simultaneous pressures: declining operating cash flow ($186.2B → $143.4B → $135.7B, p.170) as revenues compressed, and rising capex ($37.6B → $42.2B → $50.4B, p.170) as the company continues upstream and downstream investment. Without a material crude price recovery, the trajectory implies negative FCF relative to dividend commitments for a second consecutive year in 2025.',
    bodyAr: 'تراجع التدفق النقدي الحر من 148.5 مليار دولار في 2022 إلى 101.2 مليار دولار في 2023 ثم إلى 85.3 مليار دولار في 2024 (التقرير ص.44) — انخفاض تراكمي 42.5% على مدى عامين. يعكس هذا الاتجاه ضغطين متزامنين: تراجع التدفق النقدي التشغيلي (186.2 → 143.4 → 135.7 مليار دولار، ص.170) مع انضغاط الإيرادات، وارتفاع النفقات الرأسمالية (37.6 → 42.2 → 50.4 مليار دولار، ص.170) مع استمرار الاستثمار.',
    ref: '2024 AR p.44 (FCF three-year table) · p.170 (Cash Flow Statement)',
  },
  {
    id: 'f3',
    category: 'Revenue Trend',
    categoryAr: 'اتجاه الإيرادات',
    severity: 'medium',
    titleEn: 'Revenue declined for the second consecutive year — 20.5% below 2022 peak',
    titleAr: 'الإيرادات تتراجع للعام الثاني على التوالي — أدنى بـ 20.5% من ذروة 2022',
    bodyEn: 'Total revenues fell from $604.4B in 2022 to $495.0B in 2023 and $480.4B in 2024 (2024 AR p.166) — the second consecutive annual contraction and now 20.5% below the 2022 peak. Average realized crude price fell from $84.9/bbl in 2023 to $80.2/bbl in 2024 (p.32), and OPEC+ production curtailments maintained throughout the year further limited volume upside. The revenue trajectory places increasing pressure on margin maintenance and cash generation.',
    bodyAr: 'تراجعت الإيرادات من 604.4 مليار دولار في 2022 إلى 495.0 مليار دولار في 2023 ثم إلى 480.4 مليار دولار في 2024 (ص.166) — الانكماش السنوي الثاني على التوالي، وأدنى بـ 20.5% من ذروة 2022. انخفض متوسط سعر النفط المُحقق من 84.9$/برميل في 2023 إلى 80.2$/برميل في 2024 (ص.32)، فضلاً عن تخفيضات أوبك+ التي حدّت من نمو الحجم.',
    ref: '2024 AR p.166 (Five-Year Summary) · p.32 (Key Metrics)',
  },
  {
    id: 'f4',
    category: 'Profitability',
    categoryAr: 'الربحية',
    severity: 'medium',
    titleEn: 'EPS declined 35% over two years: $0.66 (2022) → $0.43 (2024)',
    titleAr: 'ربحية السهم انخفضت 35% خلال عامين: 0.66$ (2022) → 0.43$ (2024)',
    bodyEn: 'Basic EPS fell from $0.66 in 2022 to $0.50 in 2023 and $0.43 in 2024 (2024 AR p.166) — a 35% decline over the two-year period on a stable share count of ~242 billion shares (p.171). Net income attributable to shareholders fell from $159.3B to $120.7B to $105.0B over the same period. Net margin compressed from 26.7% to 24.5% to 22.1%, a 460 bps contraction from peak to 2024.',
    bodyAr: 'انخفضت ربحية السهم الأساسية من 0.66$ في 2022 إلى 0.50$ في 2023 ثم إلى 0.43$ في 2024 (ص.166) — تراجع 35% خلال العامين على قاعدة أسهم ثابتة تبلغ ~242 مليار سهم (ص.171). انخفض صافي الدخل العائد للمساهمين من 159.3 إلى 120.7 إلى 105.0 مليار دولار خلال الفترة ذاتها. تقلّص هامش الربح الصافي من 26.7% إلى 22.1% — انكماش 460 نقطة أساس.',
    ref: '2024 AR p.166 (EPS) · p.171 (Share count)',
  },
  {
    id: 'f5',
    category: 'Cost Inflation',
    categoryAr: 'تضخم التكاليف',
    severity: 'medium',
    titleEn: 'Upstream lifting cost rose 28% over four years: $2.76/boe (2020) → $3.53/boe (2024)',
    titleAr: 'تكلفة الرفع الأولية ارتفعت 28% خلال أربع سنوات: 2.76$ (2020) → 3.53$/برميل (2024)',
    bodyEn: 'Lifting cost increased from $2.76/boe in 2020 to $3.04 in 2021, $3.05 in 2022, $3.19 in 2023, and $3.53/boe in 2024 (2024 AR p.47) — a 28% cumulative increase over four years. While still among the lowest globally, the consistent upward trajectory warrants monitoring. Upstream capex per boe also rose to $8.3 in 2024 (p.47), indicating that sustaining production requires materially higher per-unit investment than in prior years.',
    bodyAr: 'ارتفعت تكلفة الرفع من 2.76$/برميل مكافئ في 2020 إلى 3.04 ثم 3.05 ثم 3.19 ثم 3.53$/برميل مكافئ في 2024 (ص.47) — ارتفاع تراكمي 28% خلال أربع سنوات. وإن ظلّت من بين الأدنى عالمياً، فإن الاتجاه التصاعدي المستمر يستوجب المتابعة. كما ارتفعت النفقات الرأسمالية الأولية لكل برميل إلى 8.3$ في 2024 (ص.47).',
    ref: '2024 AR p.47 (Upstream Data — Lifting Cost per boe)',
  },
  {
    id: 'f6',
    category: 'Debt',
    categoryAr: 'الديون',
    severity: 'low',
    titleEn: 'Total borrowings increased 9.9% YoY: $77.4B (2023) → $85.1B (2024)',
    titleAr: 'إجمالي الاقتراضات ارتفع 9.9% سنوياً: 77.4 مليار$ (2023) → 85.1 مليار$ (2024)',
    bodyEn: 'Total borrowings rose from $77.4B in 2023 to $85.1B in 2024 (2024 AR p.168). Net debt (borrowings less cash of $57.8B) stands at $27.3B, and stated gearing (net debt / net debt + equity) is 4.5% (p.32) — still a conservative leverage profile by any absolute measure. However, this is the second consecutive year of rising net debt ($24.3B → $27.3B), and the direction of travel is worth monitoring in the context of the FCF shortfall and dividend commitment flagged above.',
    bodyAr: 'ارتفعت الاقتراضات من 77.4 مليار دولار في 2023 إلى 85.1 مليار دولار في 2024 (ص.168). يبلغ صافي الدين (الاقتراضات مطروحاً منها النقدية 57.8 مليار$) 27.3 مليار دولار، ونسبة الرفع المُعلنة 4.5% (ص.32) — ملف رافعة محافظ بأي مقياس مطلق. غير أن هذا هو العام الثاني على التوالي لارتفاع صافي الدين (24.3 → 27.3 مليار دولار)، ويستحق الاتجاه المتابعة.',
    ref: '2024 AR p.168 (Balance Sheet) · p.32 (Gearing)',
  },
  {
    id: 'f7',
    category: 'Auditor Opinion',
    categoryAr: 'رأي مدقق الحسابات',
    severity: 'low',
    titleEn: 'Clean unqualified audit opinion — no material weaknesses, no going-concern language',
    titleAr: 'رأي تدقيق نظيف غير مُقيَّد — لا ثغرات جوهرية، ولا لغة استمرارية أعمال',
    bodyEn: 'The consolidated financial statements received an unqualified audit opinion from PricewaterhouseCoopers, with no going-concern qualification, no material weaknesses identified, and no restatements of prior-period figures. This is a positive signal and provides assurance over the reliability of the reported financial data. No emphasis-of-matter paragraphs were included that would indicate auditor concern beyond standard risk disclosures.',
    bodyAr: 'حصلت البيانات المالية الموحدة على رأي تدقيق غير مُقيَّد من PricewaterhouseCoopers، دون أي تحفّظ على الاستمرارية، ودون تحديد ثغرات جوهرية، ودون إعادة صياغة أي أرقام لفترات سابقة. وهذا مؤشر إيجابي يوفر ضماناً على موثوقية البيانات المالية المُبلَّغ عنها.',
    ref: '2024 AR — Independent Auditor\'s Report (PricewaterhouseCoopers)',
  },
];

const SENTIMENT_SECTIONS: SentimentSection[] = [
  {
    sectionEn: 'Chairman\'s Statement',
    sectionAr: 'كلمة رئيس مجلس الإدارة',
    score: 'cautious',
    scoreLabel: 'Cautiously Optimistic',
    scoreLabelAr: 'تفاؤل حذر',
    snippetEn: 'Forward-looking language centers on long-term energy transition positioning, strategic diversification, and dividend commitment reaffirmation. Tone is measured — acknowledges near-term commodity headwinds while emphasizing structural advantages and reserve depth.',
    snippetAr: 'تتمحور اللغة التطلعية حول التموضع الاستراتيجي في انتقال الطاقة والتنويع والتأكيد على الالتزام بالتوزيعات. النبرة مدروسة — تُقرّ بالرياح المعاكسة للسلع على المدى القريب مع التأكيد على المزايا الهيكلية وعمق الاحتياطيات.',
    ref: '2024 AR — Chairman\'s Statement',
  },
  {
    sectionEn: 'Management Discussion & Analysis',
    sectionAr: 'تقرير الإدارة والتحليل',
    score: 'neutral',
    scoreLabel: 'Neutral with Hedging',
    scoreLabelAr: 'محايد مع تحوّط',
    snippetEn: 'MD&A employs substantial hedging language around production volumes ("subject to OPEC+ decisions"), price realization ("global macroeconomic conditions"), and capex guidance ("$48–58B range, subject to revision"). Revenue and earnings declines are presented factually with minimal forward commitment on trajectory reversal.',
    snippetAr: 'يستخدم تقرير الإدارة لغة تحوّط واسعة حول أحجام الإنتاج ("رهناً بقرارات أوبك+")، وتحقيق الأسعار ("الظروف الاقتصادية الكلية العالمية")، وتوجيهات النفقات الرأسمالية ("نطاق 48–58 مليار$، رهناً بالمراجعة"). تُقدَّم تراجعات الإيرادات والأرباح بشكل واقعي مع الحد الأدنى من الالتزام بانعكاس المسار.',
    ref: '2024 AR p.30–55 — MD&A',
  },
  {
    sectionEn: 'Risk Factors',
    sectionAr: 'عوامل المخاطر',
    score: 'negative',
    scoreLabel: 'Risk-Weighted (Expected)',
    scoreLabelAr: 'مُرجَّح بالمخاطر (متوقع)',
    snippetEn: 'Key risks disclosed include: commodity price volatility and OPEC+ policy uncertainty; geopolitical risks in the operating region; regulatory and tax changes affecting government take; energy transition risk reducing long-term hydrocarbon demand; and cybersecurity and operational safety risks. Language is appropriately cautious — this section follows standard disclosure norms rather than indicating elevated concern.',
    snippetAr: 'تشمل المخاطر الرئيسية المُفصَح عنها: تقلبات أسعار السلع وعدم اليقين في سياسة أوبك+؛ المخاطر الجيوسياسية في منطقة التشغيل؛ التغييرات التنظيمية والضريبية؛ مخاطر انتقال الطاقة التي تقلص الطلب على المدى البعيد؛ والمخاطر الإلكترونية وسلامة التشغيل. اللغة حذرة بالشكل الملائم وتتبع معايير الإفصاح القياسية.',
    ref: '2024 AR — Risk Factors',
  },
  {
    sectionEn: 'Auditor\'s Report',
    sectionAr: 'تقرير مدقق الحسابات',
    score: 'positive',
    scoreLabel: 'Positive — Unqualified',
    scoreLabelAr: 'إيجابي — غير مُقيَّد',
    snippetEn: 'PricewaterhouseCoopers issued a clean unqualified opinion with no material weaknesses, going-concern qualifications, or restatements. Key audit matters relate to standard complex estimates (asset impairment, decommissioning provisions, income tax) with no indication of auditor-identified reporting concerns beyond routine disclosures.',
    snippetAr: 'أصدرت PricewaterhouseCoopers رأياً نظيفاً غير مُقيَّد دون ثغرات جوهرية أو تحفظات استمرارية أو إعادة صياغة. تتعلق مسائل التدقيق الرئيسية بتقديرات معقدة قياسية (انخفاض قيمة الأصول، مخصصات التخلص، ضريبة الدخل) دون أي مؤشر على مخاوف تقارير تجاوزت الإفصاحات الروتينية.',
    ref: '2024 AR — Independent Auditor\'s Report',
  },
  {
    sectionEn: 'Forward Guidance & Outlook',
    sectionAr: 'التوجيهات المستقبلية والتوقعات',
    score: 'cautious',
    scoreLabel: 'Cautious',
    scoreLabelAr: 'حذر',
    snippetEn: 'Management provides capex guidance of $48–58B through 2028 and reaffirms the base dividend commitment but makes no explicit revenue or earnings forecast. References to energy transition ("dual mandate" of supply reliability and decarbonization) indicate strategic repositioning but no quantified timeline. Forward statements are heavily qualified with standard safe-harbour language.',
    snippetAr: 'تُقدّم الإدارة توجيهات نفقات رأسمالية بنطاق 48–58 مليار$ حتى 2028 وتؤكد الالتزام بالتوزيعات الأساسية دون تقديم توقعات صريحة للإيرادات أو الأرباح. تُشير مراجعات انتقال الطاقة إلى إعادة تموضع استراتيجي دون جدول زمني محدد.',
    ref: '2024 AR p.50–55 — Outlook',
  },
];

// ── Configs ───────────────────────────────────────────────────────────────────
const SEV = {
  high:   { label: 'High',   labelAr: 'مرتفع',   bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-300 dark:border-red-700',     dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400'     },
  medium: { label: 'Medium', labelAr: 'متوسط',   bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-300 dark:border-amber-700', dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  low:    { label: 'Low',    labelAr: 'منخفض',   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-300 dark:border-blue-700',   dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400'   },
};

const SENT = {
  positive: { color: '#10b981', label: 'Positive',              labelAr: 'إيجابي',        bar: 'bg-emerald-500' },
  cautious: { color: '#f59e0b', label: 'Cautious',              labelAr: 'حذر',           bar: 'bg-amber-500'   },
  neutral:  { color: '#6b7280', label: 'Neutral',               labelAr: 'محايد',         bar: 'bg-gray-400'    },
  negative: { color: '#ef4444', label: 'Risk-Weighted',         labelAr: 'مُرجَّح بمخاطر', bar: 'bg-red-500'    },
};

// Overall: 2 high + 2 medium + 1 medium-cost + 1 low + 1 low (clean audit) = cautious
const OVERALL = { score: 58, label: 'Moderate Risk', labelAr: 'مخاطر معتدلة', color: '#f59e0b' };

// ── Sub-components ─────────────────────────────────────────────────────────────
function SeverityBadge({ sev, isArabic }: { sev: Severity; isArabic: boolean }) {
  const s = SEV[sev];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {isArabic ? s.labelAr : s.label}
    </span>
  );
}

function FlagCard({ flag, isArabic }: { flag: Flag; isArabic: boolean }) {
  const [open, setOpen] = useState(false);
  const s = SEV[flag.severity];
  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button
        type="button"
        className="flex w-full items-start gap-3 px-4 py-3.5 text-start"
        onClick={() => setOpen((v) => !v)}
      >
        <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${s.text}`} />
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {isArabic ? flag.categoryAr : flag.category}
            </span>
            <SeverityBadge sev={flag.severity} isArabic={isArabic} />
          </div>
          <p className="text-sm font-medium leading-5 text-[var(--foreground)]">
            {isArabic ? flag.titleAr : flag.titleEn}
          </p>
        </div>
        {open
          ? <ChevronUp   className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 pb-4 pt-3 space-y-2.5">
          <p className="text-sm leading-7 text-[var(--foreground)]">
            {isArabic ? flag.bodyAr : flag.bodyEn}
          </p>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
            <span className="text-[11px] text-[var(--muted-foreground)]">{flag.ref}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SentimentRow({ s, isArabic }: { s: SentimentSection; isArabic: boolean }) {
  const [open, setOpen] = useState(false);
  const cfg = SENT[s.score];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-start"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Colored dot */}
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cfg.color }} />
        <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
          {isArabic ? s.sectionAr : s.sectionEn}
        </span>
        <span className="text-xs font-semibold" style={{ color: cfg.color }}>
          {isArabic ? s.scoreLabelAr : s.scoreLabel}
        </span>
        {open
          ? <ChevronUp   className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />}
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 pb-3 pt-3 space-y-2">
          <p className="text-sm leading-7 text-[var(--muted-foreground)]">
            {isArabic ? s.snippetAr : s.snippetEn}
          </p>
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3 shrink-0 text-[var(--muted-foreground)]" />
            <span className="text-[11px] text-[var(--muted-foreground)]">{s.ref}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function RiskGauge({ score, color }: { score: number; color: string }) {
  // Semi-circle gauge (180° arc)
  const r = 68; const cx = 90; const cy = 90;
  const circ = Math.PI * r; // half circumference
  const filled = (score / 100) * circ;
  return (
    <svg viewBox="0 0 180 110" className="h-28 w-40">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="currentColor" strokeWidth={12} strokeLinecap="round"
        className="text-[var(--border)]"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
      />
      <text x={cx} y={cy - 4}  textAnchor="middle" fontSize={24} fontWeight={700} fill={color}>{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} className="fill-[var(--muted-foreground)]">/100</text>
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function RiskAnalysisTab() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const highCount   = FLAGS.filter((f) => f.severity === 'high').length;
  const mediumCount = FLAGS.filter((f) => f.severity === 'medium').length;
  const lowCount    = FLAGS.filter((f) => f.severity === 'low').length;

  return (
    <div
      className="h-full overflow-y-auto space-y-4 px-1 py-2"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--card)] px-5 py-4 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {isArabic ? 'تحليل المخاطر والمشاعر' : 'Risk & Sentiment Analysis'}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Saudi Aramco · FY2024 Annual Report</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--background)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] ring-1 ring-[var(--border)] transition hover:bg-[var(--card-strong)]"
        >
          <Download className="h-3.5 w-3.5 text-[var(--brand)]" />
          {isArabic ? 'تصدير PDF' : 'Export PDF'}
        </button>
      </div>

      {/* ── Risk Overview ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
          {isArabic ? 'نظرة عامة على المخاطر' : 'Risk Overview'}
        </p>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Gauge */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            <RiskGauge score={OVERALL.score} color={OVERALL.color} />
            <p className="text-sm font-bold" style={{ color: OVERALL.color }}>
              {isArabic ? OVERALL.labelAr : OVERALL.label}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {isArabic ? 'مؤشر تحليلي — ليس نصيحة استثمارية' : 'Analytical indicator — not investment advice'}
            </p>
          </div>

          {/* Flag counts */}
          <div className="flex flex-1 flex-col gap-3 w-full">
            {[
              { key: 'high',   count: highCount,   label: isArabic ? 'مخاطر مرتفعة' : 'High Risk Flags',   color: '#ef4444', bg: 'bg-red-500'   },
              { key: 'medium', count: mediumCount, label: isArabic ? 'مخاطر متوسطة' : 'Medium Risk Flags', color: '#f59e0b', bg: 'bg-amber-500' },
              { key: 'low',    count: lowCount,    label: isArabic ? 'مخاطر منخفضة' : 'Low Risk Flags',    color: '#3b82f6', bg: 'bg-blue-500'  },
            ].map((r) => (
              <div key={r.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-[var(--muted-foreground)]">{r.label}</span>
                <div className="relative h-2 flex-1 rounded-full bg-[var(--border)]">
                  <div
                    className={`absolute inset-y-0 start-0 rounded-full ${r.bg}`}
                    style={{ width: `${(r.count / FLAGS.length) * 100}%` }}
                  />
                </div>
                <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums" style={{ color: r.color }}>
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Red Flag Detection ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'اكتشاف العلامات التحذيرية' : 'Red Flag Detection'}
          </p>
          <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            {FLAGS.length}
          </span>
        </div>
        <div className="space-y-2">
          {FLAGS.map((flag) => (
            <FlagCard key={flag.id} flag={flag} isArabic={isArabic} />
          ))}
        </div>
      </div>

      {/* ── Sentiment Analysis ── */}
      <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--brand)]" />
          <p className="text-sm font-bold text-[var(--foreground)]">
            {isArabic ? 'تحليل مشاعر أقسام التقرير' : 'Report Section Sentiment Analysis'}
          </p>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-3">
          {(Object.entries(SENT) as [SentimentScore, typeof SENT[SentimentScore]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {isArabic ? cfg.labelAr : cfg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Sentiment bars */}
        <div className="mb-4 space-y-2.5">
          {SENTIMENT_SECTIONS.map((s) => {
            const cfg = SENT[s.score];
            const pct = s.score === 'positive' ? 85 : s.score === 'cautious' ? 55 : s.score === 'neutral' ? 45 : 30;
            return (
              <div key={s.sectionEn} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-xs text-[var(--muted-foreground)]">
                  {isArabic ? s.sectionAr : s.sectionEn}
                </span>
                <div className="relative h-2 flex-1 rounded-full bg-[var(--border)]">
                  <div
                    className={`absolute inset-y-0 start-0 rounded-full ${cfg.bar} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-end text-[11px] font-semibold" style={{ color: cfg.color }}>
                  {isArabic ? s.scoreLabelAr : s.scoreLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Section detail cards */}
        <div className="space-y-2">
          {SENTIMENT_SECTIONS.map((s) => (
            <SentimentRow key={s.sectionEn} s={s} isArabic={isArabic} />
          ))}
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
        <p className="text-[11px] leading-5 text-[var(--muted-foreground)]">
          {isArabic
            ? 'تحليل آلي بيانات المصدر التقرير السنوي المُرفَّق فقط. لا يُعدّ نصيحة استثمارية أو قانونية. يُوصى بإجراء مراجعة بشرية مستقلة قبل اتخاذ أي قرارات استثمارية.'
            : 'Automated analysis sourced solely from the attached annual report. This does not constitute investment or legal advice. An independent human review is recommended before making any investment decisions.'}
        </p>
      </div>
    </div>
  );
}
