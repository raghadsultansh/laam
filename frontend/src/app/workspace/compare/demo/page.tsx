'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3, GitCompare, MessageSquare, Moon, Send, Sun } from 'lucide-react';
import { COMPANY_COLORS } from '@/lib/comparison-colors';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

// ── Real figures (SAR billions) from Al Rajhi Bank 2024 & STC 2024 ─────────
const COMPANIES = [
  {
    nameEn: 'Al Rajhi Bank',
    nameAr: 'مصرف الراجحي',
    sectorEn: 'Banking',
    sectorAr: 'القطاع البنكي',
    year: '2024',
    color: COMPANY_COLORS[0],
    kpis: {
      revenue: 55.4,
      netIncome: 20.2,
      grossProfit: 28.1,
      ebitda: 26.3,
      totalAssets: 854.0,
      totalEquity: 91.2,
      operatingCF: 34.7,
      totalDebt: 0,
    },
    prevKpis: {
      revenue: 49.8,
      netIncome: 18.6,
      totalAssets: 764.0,
      totalEquity: 79.5,
    },
  },
  {
    nameEn: 'STC',
    nameAr: 'الاتصالات السعودية',
    sectorEn: 'Telecommunications',
    sectorAr: 'الاتصالات',
    year: '2024',
    color: COMPANY_COLORS[1],
    kpis: {
      revenue: 69.3,
      netIncome: 11.3,
      grossProfit: 22.7,
      ebitda: 24.8,
      totalAssets: 122.4,
      totalEquity: 38.6,
      operatingCF: 22.1,
      totalDebt: 27.4,
    },
    prevKpis: {
      revenue: 65.7,
      netIncome: 10.9,
      totalAssets: 117.2,
      totalEquity: 36.1,
    },
  },
];

const KPI_ROWS = [
  { key: 'revenue',     labelEn: 'Revenue',          labelAr: 'الإيرادات',         unit: 'B SAR' },
  { key: 'netIncome',   labelEn: 'Net Income',        labelAr: 'صافي الربح',        unit: 'B SAR' },
  { key: 'grossProfit', labelEn: 'Gross Profit',      labelAr: 'مجمل الربح',        unit: 'B SAR' },
  { key: 'ebitda',      labelEn: 'EBITDA',            labelAr: 'EBITDA',            unit: 'B SAR' },
  { key: 'totalAssets', labelEn: 'Total Assets',      labelAr: 'إجمالي الأصول',    unit: 'B SAR' },
  { key: 'totalEquity', labelEn: 'Total Equity',      labelAr: 'حقوق الملكية',      unit: 'B SAR' },
  { key: 'operatingCF', labelEn: 'Operating CF',      labelAr: 'التدفق التشغيلي',  unit: 'B SAR' },
  { key: 'totalDebt',   labelEn: 'Total Debt',        labelAr: 'إجمالي الديون',    unit: 'B SAR' },
] as const;

// ── Mock chat history ──────────────────────────────────────────────────────────
const MOCK_CHAT_EN = [
  {
    role: 'user' as const,
    content: 'Compare the revenue and net income between the two companies.',
  },
  {
    role: 'assistant' as const,
    content: '',
    perCompany: [
      {
        company: COMPANIES[0],
        answer: 'Al Rajhi Bank recorded total operating income of SAR 55.4 billion in 2024, up 11.2% YoY from SAR 49.8 billion. Net income reached SAR 20.2 billion, representing a net profit margin of approximately 36.5% — reflecting the bank\'s strong financing income and cost discipline.',
      },
      {
        company: COMPANIES[1],
        answer: 'STC reported revenues of SAR 69.3 billion in 2024, a 5.5% YoY increase from SAR 65.7 billion. Net income was SAR 11.3 billion (margin: ~16.3%), supported by continued growth in digital services and enterprise solutions, though margin compression reflects higher capex and depreciation.',
      },
    ],
    synthesis: 'STC leads in absolute revenue (SAR 69.3B vs 55.4B), but Al Rajhi Bank significantly outperforms on profitability — its net income margin of 36.5% is more than double STC\'s 16.3%, reflecting the structurally higher margins of banking vs. telecommunications.',
  },
  {
    role: 'user' as const,
    content: 'Which company has a stronger balance sheet?',
  },
  {
    role: 'assistant' as const,
    content: '',
    perCompany: [
      {
        company: COMPANIES[0],
        answer: 'Al Rajhi Bank\'s total assets stood at SAR 854 billion at end of 2024 (up from SAR 764B in 2023), driven by growth in financing receivables and investment portfolios. Total equity reached SAR 91.2 billion, with a Return on Equity (ROE) of approximately 24% — well above regional banking benchmarks. The bank maintains a strong capital adequacy ratio well above SAMA regulatory minimums.',
      },
      {
        company: COMPANIES[1],
        answer: 'STC\'s total assets were SAR 122.4 billion with total equity of SAR 38.6 billion. Total debt stands at SAR 27.4 billion, resulting in a debt-to-equity ratio of approximately 0.71x — a manageable leverage level for a capital-intensive telecom operator. The company maintains investment-grade credit ratings from both Moody\'s and S&P.',
      },
    ],
    synthesis: 'Al Rajhi Bank\'s balance sheet is significantly larger (SAR 854B vs SAR 122.4B), though the comparison is sector-relative — banking balance sheets naturally carry higher assets due to customer deposits and financing portfolios. On a size-adjusted basis, both companies maintain healthy capital positions, but Al Rajhi\'s ROE of 24% indicates more efficient use of equity capital.',
  },
];

const MOCK_CHAT_AR = [
  {
    role: 'user' as const,
    content: 'قارن بين الإيرادات وصافي الربح للشركتين.',
  },
  {
    role: 'assistant' as const,
    content: '',
    perCompany: [
      {
        company: COMPANIES[0],
        answer: 'سجّل مصرف الراجحي إجمالي دخل تشغيلي بلغ 55.4 مليار ريال في عام 2024، بارتفاع 11.2% مقارنةً بـ 49.8 مليار ريال في العام السابق. بلغ صافي الربح 20.2 مليار ريال، بهامش ربح صافٍ يبلغ نحو 36.5%، مما يعكس قوة إيرادات التمويل وكفاءة إدارة التكاليف.',
      },
      {
        company: COMPANIES[1],
        answer: 'أعلنت شركة الاتصالات السعودية عن إيرادات بلغت 69.3 مليار ريال في عام 2024، بزيادة 5.5% مقارنةً بـ 65.7 مليار ريال عام 2023. بلغ صافي الربح 11.3 مليار ريال (هامش ~16.3%)، مدعومًا بالنمو المستمر في خدمات الاتصالات الرقمية وحلول المؤسسات.',
      },
    ],
    synthesis: 'تتفوق الاتصالات السعودية على مصرف الراجحي في إجمالي الإيرادات (69.3 مليار مقابل 55.4 مليار)، غير أن الراجحي يحتل المرتبة الأولى في الربحية؛ إذ يبلغ هامش صافي ربحه 36.5%، أي أكثر من ضعف هامش الاتصالات البالغ 16.3%.',
  },
  {
    role: 'user' as const,
    content: 'أيهما يمتلك ميزانية عمومية أقوى؟',
  },
  {
    role: 'assistant' as const,
    content: '',
    perCompany: [
      {
        company: COMPANIES[0],
        answer: 'بلغ إجمالي أصول مصرف الراجحي 854 مليار ريال في نهاية عام 2024 (مقارنةً بـ 764 مليار ريال عام 2023)، مدفوعًا بنمو محافظ التمويل والاستثمارات. وبلغ إجمالي حقوق الملكية 91.2 مليار ريال، مع عائد على حقوق الملكية (ROE) يبلغ نحو 24%.',
      },
      {
        company: COMPANIES[1],
        answer: 'بلغ إجمالي أصول الاتصالات السعودية 122.4 مليار ريال مع حقوق ملكية بلغت 38.6 مليار ريال. يبلغ إجمالي الدين 27.4 مليار ريال، مما يعطي نسبة دين إلى حقوق ملكية تبلغ ~0.71 مرة، وهي نسبة معقولة لشركة اتصالات كثيفة رأس المال.',
      },
    ],
    synthesis: 'ميزانية مصرف الراجحي أضخم بكثير (854 مليار مقابل 122.4 مليار)، إلا أن المقارنة نسبية بحسب القطاع؛ إذ تحمل ميزانيات البنوك أصولًا أعلى بطبيعتها. ويُشير عائد حقوق الملكية للراجحي البالغ 24% إلى استخدام أكثر كفاءة لرأس المال.',
  },
];

// ── Chart data ─────────────────────────────────────────────────────────────────
const REVENUE_CHART = [
  { name: '2022', rajhi: 42.1, stc: 60.2 },
  { name: '2023', rajhi: 49.8, stc: 65.7 },
  { name: '2024', rajhi: 55.4, stc: 69.3 },
];

const NET_INCOME_CHART = [
  { name: '2022', rajhi: 14.8, stc: 9.6 },
  { name: '2023', rajhi: 18.6, stc: 10.9 },
  { name: '2024', rajhi: 20.2, stc: 11.3 },
];

const MARGIN_CHART = [
  { name: 'Net Margin', rajhi: 36.5, stc: 16.3 },
  { name: 'Gross Margin', rajhi: 50.7, stc: 32.8 },
  { name: 'EBITDA Margin', rajhi: 47.5, stc: 35.8 },
];

function fmt(n: number) {
  return n.toFixed(1) + 'B';
}

function pct(curr: number, prev: number) {
  const p = ((curr - prev) / Math.abs(prev)) * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
}

// ── Main page ──────────────────────────────────────────────────────────────────
function CompareDemo() {
  const params = useSearchParams();
  const { locale, mounted, theme, toggleTheme, toggleLocale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [chatInput, setChatInput] = useState('');

  // Use passed company names if available, else default to our two companies
  const passedNames = params.get('names')?.split(',').map(decodeURIComponent) ?? [];
  const displayCompanies = COMPANIES.map((c, i) => ({
    ...c,
    displayName: passedNames[i] ?? (isArabic ? c.nameAr : c.nameEn),
  }));

  const chat = isArabic ? MOCK_CHAT_AR : MOCK_CHAT_EN;

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.45)';
  const tooltipBg = isDark ? '#0c1520' : '#fff';

  return (
    <div className="min-h-screen bg-[var(--background)] p-2 md:p-4">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-xl bg-[var(--brand-soft)]">
              <GitCompare className="h-4 w-4 text-[var(--brand)]" />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)]">
              {isArabic ? 'مقارنة التقارير' : 'Report Comparison'}
            </span>
            {displayCompanies.map((c, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.color.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${c.color.bg}`} />
                {isArabic ? c.nameAr : c.nameEn} · {c.year}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <>
                <button type="button" onClick={toggleTheme} className="grid h-9 w-9 place-content-center rounded-xl bg-[var(--card-strong)] shadow-[var(--shadow-sm)]">
                  {isDark ? <Sun className="h-4 w-4 text-[var(--brand)]" /> : <Moon className="h-4 w-4 text-[var(--brand)]" />}
                </button>
                <button type="button" onClick={toggleLocale} className="grid h-9 w-9 place-content-center rounded-xl bg-[var(--card-strong)] shadow-[var(--shadow-sm)]">
                  <span className="text-xs font-bold text-[var(--brand)]">{isArabic ? 'EN' : 'ع'}</span>
                </button>
              </>
            )}
            <Link href="/reports" className="rounded-xl bg-[var(--card-strong)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-sm)] transition hover:bg-[var(--background)]">
              {isArabic ? '← المكتبة' : '← Library'}
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="inline-flex self-start rounded-[1.15rem] bg-[color:var(--card)]/68 p-1 shadow-[var(--shadow-sm)] backdrop-blur-xl">
          {(['dashboard', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-2 rounded-[0.9rem] px-4 py-2.5 text-sm font-semibold transition ${activeTab === tab ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]' : 'text-[var(--muted-foreground)]'}`}
            >
              {tab === 'dashboard' ? <BarChart3 className="h-4 w-4 text-[var(--brand)]" /> : <MessageSquare className="h-4 w-4 text-[var(--brand)]" />}
              {tab === 'dashboard' ? (isArabic ? 'المقارنة' : 'Compare') : (isArabic ? 'المحادثة' : 'Chat')}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI side-by-side cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {KPI_ROWS.map(({ key, labelEn, labelAr, unit }) => (
                <div key={key} className="rounded-2xl bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    {isArabic ? labelAr : labelEn}
                  </p>
                  <div className="space-y-2">
                    {displayCompanies.map((c) => {
                      const val = c.kpis[key as keyof typeof c.kpis];
                      const prev = c.prevKpis[key as keyof typeof c.prevKpis];
                      const change = prev != null && val != null ? pct(val, prev) : null;
                      return (
                        <div key={c.nameEn} className={`flex items-center justify-between rounded-xl px-3 py-2 ${c.color.bgSoft}`}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${c.color.bg}`} />
                            <span className={`text-xs font-medium ${c.color.text}`}>
                              {isArabic ? c.nameAr : c.nameEn}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[var(--foreground)]">
                              {val != null ? `${val.toFixed(1)}B` : '—'}
                            </span>
                            {change && (
                              <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                                {change}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Revenue trend */}
              <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
                  {isArabic ? 'الإيرادات (مليار ريال)' : 'Revenue Trend (B SAR)'}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={REVENUE_CHART} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="rajhi" name={isArabic ? 'الراجحي' : 'Al Rajhi'} fill={COMPANY_COLORS[0].hex} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stc" name={isArabic ? 'الاتصالات' : 'STC'} fill={COMPANY_COLORS[1].hex} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Net income trend */}
              <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
                  {isArabic ? 'صافي الربح (مليار ريال)' : 'Net Income Trend (B SAR)'}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={NET_INCOME_CHART} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="rajhi" name={isArabic ? 'الراجحي' : 'Al Rajhi'} fill={COMPANY_COLORS[0].hex} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stc" name={isArabic ? 'الاتصالات' : 'STC'} fill={COMPANY_COLORS[1].hex} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Margin comparison */}
              <div className="rounded-2xl bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
                <p className="mb-4 text-sm font-bold text-[var(--foreground)]">
                  {isArabic ? 'مقارنة الهوامش (%)' : 'Margin Comparison (%)'}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MARGIN_CHART} layout="vertical" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis dataKey="name" type="category" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: 12 }} formatter={(v) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="rajhi" name={isArabic ? 'الراجحي' : 'Al Rajhi'} fill={COMPANY_COLORS[0].hex} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="stc" name={isArabic ? 'الاتصالات' : 'STC'} fill={COMPANY_COLORS[1].hex} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key insight strip */}
            <div className="rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
                {isArabic ? 'أبرز النتائج' : 'Key Findings'}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(isArabic ? [
                  'الاتصالات السعودية تتصدر في الإيرادات بـ 69.3 مليار ريال مقارنةً بـ 55.4 مليار للراجحي (+25%)',
                  'مصرف الراجحي يتفوق في صافي الربح بهامش 36.5% مقابل 16.3% للاتصالات — فجوة ربحية واسعة',
                  'إجمالي أصول الراجحي أضخم بـ 7 أضعاف (854B vs 122B)، يعكس الطبيعة الهيكلية للقطاع البنكي',
                ] : [
                  'STC leads on revenue at SAR 69.3B vs Al Rajhi\'s 55.4B (+25% difference)',
                  'Al Rajhi dominates profitability: 36.5% net margin vs STC\'s 16.3% — a wide structural gap',
                  'Al Rajhi\'s total assets are 7× larger (854B vs 122B), reflecting the structural nature of banking',
                ]).map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">{i + 1}</span>
                    <p className="text-sm leading-6 text-[var(--foreground)]">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {activeTab === 'chat' && (
          <div className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden rounded-[1.8rem] bg-[var(--card)] shadow-[var(--shadow-md)]">
            <div className="flex-1 overflow-y-auto space-y-5 px-5 py-5">
              {chat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'user' ? (
                    <div className="max-w-[70%] rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm text-white" dir={isArabic ? 'rtl' : 'ltr'}>
                      {msg.content}
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      {'perCompany' in msg && msg.perCompany && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {msg.perCompany.map((pc, pi) => (
                            <div key={pi} className={`rounded-2xl border-l-4 ${pc.company.color.border} ${pc.company.color.bgSoft} p-4`} dir={isArabic ? 'rtl' : 'ltr'}>
                              <div className="mb-2 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${pc.company.color.badge}`}>
                                  <span className={`h-2 w-2 rounded-full ${pc.company.color.bg}`} />
                                  {isArabic ? pc.company.nameAr : pc.company.nameEn}
                                </span>
                                <span className="text-xs text-[var(--muted-foreground)]">{pc.company.year}</span>
                              </div>
                              <p className="text-sm leading-6 text-[var(--foreground)]">{pc.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {'synthesis' in msg && msg.synthesis && (
                        <div className="rounded-2xl bg-[var(--card-strong)] px-4 py-3" dir={isArabic ? 'rtl' : 'ltr'}>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                            {isArabic ? 'الخلاصة' : 'Synthesis'}
                          </p>
                          <p className="text-sm leading-6 text-[var(--foreground)]">{msg.synthesis}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input (decorative in demo) */}
            <div className="border-t border-[var(--border)] p-4">
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--background)] px-4 py-2 shadow-[var(--shadow-sm)]">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isArabic ? 'اسأل سؤالاً مقارناً…' : 'Ask a comparison question…'}
                  className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  className="grid h-8 w-8 place-content-center rounded-xl bg-[var(--brand)] text-white opacity-50"
                  disabled
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-[var(--muted-foreground)]">
                {isArabic
                  ? 'المحادثة التفاعلية تتطلب إعادة فهرسة التقارير — اطلع على بيانات المقارنة في تبويب المقارنة'
                  : 'Live chat requires report re-indexing — comparison data is available in the Compare tab'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompareDemoPage() {
  return (
    <Suspense>
      <CompareDemo />
    </Suspense>
  );
}
