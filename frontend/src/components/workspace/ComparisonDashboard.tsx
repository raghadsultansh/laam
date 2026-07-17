'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { getDashboard, type DashboardData, type BackendReport } from '@/lib/api';
import { COMPANY_COLORS } from '@/lib/comparison-colors';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

type ReportDash = {
  report: BackendReport;
  data: DashboardData | null;
  loading: boolean;
  error: boolean;
};

function fmt(n: number | null | undefined, unit?: string): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1_000_000_000) s = `${(n / 1_000_000_000).toFixed(2)}B`;
  else if (abs >= 1_000_000) s = `${(n / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) s = `${(n / 1_000).toFixed(0)}K`;
  else s = n.toFixed(0);
  return unit ? `${s} ${unit}` : s;
}

function pctChange(curr: number | null, prev: number | null): string | null {
  if (curr == null || prev == null || prev === 0) return null;
  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

const KPI_KEYS: { label: string; labelAr: string; get: (d: DashboardData) => { curr: number | null; prev: number | null; unit: string } }[] = [
  { label: 'Revenue', labelAr: 'الإيرادات', get: (d) => ({ curr: d.income_statement.current_year.revenue?.value ?? null, prev: d.income_statement.prior_year?.revenue?.value ?? null, unit: d.income_statement.current_year.revenue?.unit || '' }) },
  { label: 'Net Income', labelAr: 'صافي الربح', get: (d) => ({ curr: d.income_statement.current_year.net_income?.value ?? null, prev: d.income_statement.prior_year?.net_income?.value ?? null, unit: d.income_statement.current_year.net_income?.unit || '' }) },
  { label: 'Gross Profit', labelAr: 'مجمل الربح', get: (d) => ({ curr: d.income_statement.current_year.gross_profit?.value ?? null, prev: d.income_statement.prior_year?.gross_profit?.value ?? null, unit: d.income_statement.current_year.gross_profit?.unit || '' }) },
  { label: 'EBITDA', labelAr: 'EBITDA', get: (d) => ({ curr: d.income_statement.current_year.ebitda?.value ?? null, prev: d.income_statement.prior_year?.ebitda?.value ?? null, unit: d.income_statement.current_year.ebitda?.unit || '' }) },
  { label: 'Total Assets', labelAr: 'إجمالي الأصول', get: (d) => ({ curr: d.balance_sheet.current_year.total_assets?.value ?? null, prev: d.balance_sheet.prior_year?.total_assets?.value ?? null, unit: d.balance_sheet.current_year.total_assets?.unit || '' }) },
  { label: 'Total Equity', labelAr: 'حقوق الملكية', get: (d) => ({ curr: d.balance_sheet.current_year.total_equity?.value ?? null, prev: d.balance_sheet.prior_year?.total_equity?.value ?? null, unit: d.balance_sheet.current_year.total_equity?.unit || '' }) },
  { label: 'Operating CF', labelAr: 'التدفق التشغيلي', get: (d) => ({ curr: d.cash_flow.current_year.operating_cf?.value ?? null, prev: d.cash_flow.prior_year?.operating_cf?.value ?? null, unit: d.cash_flow.current_year.operating_cf?.unit || '' }) },
  { label: 'Total Debt', labelAr: 'إجمالي الديون', get: (d) => ({ curr: d.balance_sheet.current_year.total_debt?.value ?? null, prev: d.balance_sheet.prior_year?.total_debt?.value ?? null, unit: d.balance_sheet.current_year.total_debt?.unit || '' }) },
];

export function ComparisonDashboard({ reports }: { reports: BackendReport[] }) {
  const { locale, theme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [dashboards, setDashboards] = useState<ReportDash[]>(
    reports.map((r) => ({ report: r, data: null, loading: true, error: false }))
  );

  useEffect(() => {
    reports.forEach((report, i) => {
      getDashboard(report.id)
        .then((res) => {
          setDashboards((prev) =>
            prev.map((d, idx) => idx === i ? { ...d, data: res.data, loading: false } : d)
          );
        })
        .catch(() => {
          setDashboards((prev) =>
            prev.map((d, idx) => idx === i ? { ...d, loading: false, error: true } : d)
          );
        });
    });
  }, []);

  const allLoading = dashboards.every((d) => d.loading);

  if (allLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            {isArabic ? 'جارٍ تحميل لوحات المعلومات…' : 'Loading dashboards…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-1 py-2 space-y-6">
      {/* Company legend */}
      <div className="flex flex-wrap gap-3">
        {dashboards.map((d, i) => {
          const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
          const company = (d.report.companies as any);
          const name = isArabic ? (company?.name_ar || company?.name_en) : company?.name_en;
          return (
            <div key={d.report.id} className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold ${color.badge}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
              {name} · {d.report.fiscal_year}
            </div>
          );
        })}
      </div>

      {/* KPI comparison grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {KPI_KEYS.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {isArabic ? kpi.labelAr : kpi.label}
            </p>
            <div className="space-y-2.5">
              {dashboards.map((d, i) => {
                const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
                const company = (d.report.companies as any);
                const name = isArabic ? (company?.name_ar || company?.name_en) : company?.name_en;

                if (d.loading) {
                  return (
                    <div key={d.report.id} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color.bg}`} />
                      <div className="h-4 w-24 animate-pulse rounded bg-[var(--border)]" />
                    </div>
                  );
                }
                if (d.error || !d.data) {
                  return (
                    <div key={d.report.id} className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${color.bg}`} />
                      <span className="text-xs text-[var(--muted-foreground)]">{name}: —</span>
                    </div>
                  );
                }

                const { curr, prev, unit } = kpi.get(d.data);
                const change = pctChange(curr, prev);

                return (
                  <div key={d.report.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${color.bgSoft}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${color.bg}`} />
                      <span className={`text-xs font-medium ${color.text}`}>{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--foreground)]">{fmt(curr, unit)}</span>
                      {change && (
                        <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
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

      {/* No dashboard data state */}
      {dashboards.every((d) => d.error || !d.data) && (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <BarChart3 className="h-10 w-10 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            {isArabic
              ? 'لا تتوفر بيانات لوحة المعلومات. يرجى إنشاء لوحة المعلومات لكل تقرير أولاً.'
              : 'No dashboard data available. Please generate dashboards for each report first.'}
          </p>
        </div>
      )}
    </div>
  );
}
