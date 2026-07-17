'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  FileText,
  Pencil,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { Navbar } from '@/components/layout/Navbar';
import {
  adminDeleteReport,
  adminListCompanies,
  adminListReports,
  adminListUsers,
  adminUpdateCompany,
  adminUpdateReport,
  type AdminCompany,
  type AdminReport,
  type AdminUser,
} from '@/lib/api';

// ── Company picker (used in Reports tab to fix orphaned company_id) ───────────
function CompanyPicker({
  report,
  companies,
  onAssign,
}: {
  report: AdminReport;
  companies: AdminCompany[];
  onAssign: (companyId: string) => void;
}) {
  return (
    <select
      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]"
      value={report.company_id ?? ''}
      onChange={e => e.target.value && onAssign(e.target.value)}
    >
      <option value="" disabled>— assign company —</option>
      {companies.map(c => (
        <option key={c.id} value={c.id}>{c.name_en}</option>
      ))}
    </select>
  );
}

type Tab = 'companies' | 'reports' | 'users';

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    pending:  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    ready:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    failed:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    hidden:   'bg-[var(--card-strong)] text-[var(--muted-foreground)]',
    public:   'bg-[var(--brand-soft)] text-[var(--brand)]',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[value] ?? 'bg-[var(--card-strong)] text-[var(--muted-foreground)]'}`}>
      {value}
    </span>
  );
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Companies tab ─────────────────────────────────────────────────────────────

function CompaniesTab() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<AdminCompany>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setCompanies(await adminListCompanies()); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: AdminCompany) {
    setEditId(c.id);
    setEditFields({ name_en: c.name_en, name_ar: c.name_ar, sector: c.sector, logo_url: c.logo_url ?? '', status: c.status });
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      const updated = await adminUpdateCompany(editId, editFields);
      setCompanies(prev => prev.map(c => c.id === editId ? { ...c, ...updated } : c));
      setEditId(null);
    } catch {}
    setSaving(false);
  }

  async function approve(id: string) {
    try {
      await adminUpdateCompany(id, { status: 'approved' });
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
    } catch {}
  }

  if (loading) return <TableSkeleton cols={5} />;

  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--card-strong)]">
            {['Company', 'Sector', 'Logo URL', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {companies.map(c => (
            <tr key={c.id} className="bg-[color:var(--card)] transition hover:bg-[var(--card-strong)]">
              {editId === c.id ? (
                <>
                  <td className="px-4 py-3">
                    <input
                      className="mb-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={editFields.name_en ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, name_en: e.target.value }))}
                      placeholder="English name"
                    />
                    <input
                      className="block w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={editFields.name_ar ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, name_ar: e.target.value }))}
                      placeholder="Arabic name"
                      dir="rtl"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={editFields.sector ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, sector: e.target.value }))}
                      placeholder="Sector"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={editFields.logo_url ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, logo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={editFields.status ?? ''}
                      onChange={e => setEditFields(p => ({ ...p, status: e.target.value }))}
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={saveEdit} disabled={saving} className="grid h-7 w-7 place-content-center rounded-lg bg-[var(--brand)] text-white disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditId(null)} className="grid h-7 w-7 place-content-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--foreground)]">{c.name_en}</p>
                    <p className="text-xs text-[var(--muted-foreground)]" dir="rtl">{c.name_ar}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.sector}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-[var(--muted-foreground)]">
                    {c.logo_url ? (
                      <a href={c.logo_url} target="_blank" rel="noreferrer" className="text-[var(--brand)] hover:underline">
                        {c.logo_url}
                      </a>
                    ) : (
                      <span className="italic opacity-50">none</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.status !== 'approved' && (
                        <button onClick={() => approve(c.id)} className="rounded-lg bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)] transition hover:bg-[var(--brand)] hover:text-white">
                          Approve
                        </button>
                      )}
                      <button onClick={() => startEdit(c)} className="grid h-7 w-7 place-content-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {companies.length === 0 && <EmptyRow message="No companies found." />}
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────

function ReportsTab() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editTitleId, setEditTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([adminListReports(), adminListCompanies()]);
      setReports(r);
      setCompanies(c);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleVisibility(r: AdminReport) {
    const next = r.visibility === 'public' ? 'hidden' : 'public';
    try {
      await adminUpdateReport(r.id, { visibility: next });
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, visibility: next } : x));
    } catch {}
  }

  async function assignCompany(r: AdminReport, companyId: string) {
    const company = companies.find(c => c.id === companyId);
    try {
      await adminUpdateReport(r.id, { company_id: companyId });
      setReports(prev => prev.map(x => x.id === r.id
        ? { ...x, company_id: companyId, companies: company ? { id: company.id, name_en: company.name_en } : x.companies }
        : x));
    } catch {}
  }

  async function del(id: string) {
    setDeletingId(id);
    try {
      await adminDeleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
    } catch {}
    setDeletingId(null);
  }

  function startEditTitle(r: AdminReport) {
    setEditTitleId(r.id);
    setTitleDraft(r.title ?? r.file_name ?? '');
  }

  async function saveTitle(id: string) {
    setSavingTitle(true);
    try {
      await adminUpdateReport(id, { title: titleDraft });
      setReports(prev => prev.map(x => x.id === id ? { ...x, title: titleDraft } : x));
      setEditTitleId(null);
    } catch {}
    setSavingTitle(false);
  }

  if (loading) return <TableSkeleton cols={6} />;

  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--card-strong)]">
            {['Report', 'Company', 'Year', 'Status', 'Visibility', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {reports.map(r => (
            <tr key={r.id} className="bg-[color:var(--card)] transition hover:bg-[var(--card-strong)]">
              <td className="px-4 py-3">
                {editTitleId === r.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveTitle(r.id);
                        if (e.key === 'Escape') setEditTitleId(null);
                      }}
                    />
                    <button onClick={() => saveTitle(r.id)} disabled={savingTitle} className="grid h-7 w-7 shrink-0 place-content-center rounded-lg bg-[var(--brand)] text-white disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditTitleId(null)} className="grid h-7 w-7 shrink-0 place-content-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{r.title || r.file_name || '—'}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{fmt(r.created_at)}</p>
                    </div>
                    <button onClick={() => startEditTitle(r)} className="grid h-6 w-6 shrink-0 place-content-center rounded-lg text-[var(--muted-foreground)] transition hover:text-[var(--foreground)]" title="Rename report">
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">
                {r.company_id ? (
                  <div className="flex flex-col gap-1">
                    <span>{r.companies?.name_en ?? '—'}</span>
                    <CompanyPicker report={r} companies={companies} onAssign={(id) => assignCompany(r, id)} />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-amber-500">Unlinked</span>
                    <CompanyPicker report={r} companies={companies} onAssign={(id) => assignCompany(r, id)} />
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{r.fiscal_year ?? '—'}</td>
              <td className="px-4 py-3"><StatusBadge value={r.status} /></td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleVisibility(r)}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition hover:opacity-75"
                  title="Click to toggle"
                >
                  <StatusBadge value={r.visibility} />
                  <ChevronDown className="h-3 w-3 text-[var(--muted-foreground)]" />
                </button>
              </td>
              <td className="px-4 py-3">
                {(r.status === 'failed' || r.status === 'processing') && (
                  <button
                    onClick={() => del(r.id)}
                    disabled={deletingId === r.id}
                    className="grid h-7 w-7 place-content-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-40"
                    title="Delete report"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reports.length === 0 && <EmptyRow message="No reports found." />}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton cols={4} />;

  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--card-strong)]">
            {['Email', 'Joined', 'Last Sign-in', 'Sessions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {users.map(u => (
            <tr key={u.id} className="bg-[color:var(--card)] transition hover:bg-[var(--card-strong)]">
              <td className="px-4 py-3 font-medium text-[var(--foreground)]">{u.email}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{fmt(u.created_at)}</td>
              <td className="px-4 py-3 text-[var(--muted-foreground)]">{u.last_sign_in_at ? fmt(u.last_sign_in_at) : '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[var(--brand-soft)] px-2 text-xs font-bold text-[var(--brand)]">
                  {u.sessions}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <EmptyRow message="No users found." />}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-[var(--border)] px-4 py-4">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-4 flex-1 animate-pulse rounded bg-[var(--card-strong)]" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">{message}</p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { locale, mounted, theme } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const [tab, setTab] = useState<Tab>('companies');
  const [access, setAccess] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    adminListCompanies()
      .then(() => setAccess('granted'))
      .catch(err => {
        const status = err?.response?.status;
        setAccess(status === 403 || status === 401 ? 'denied' : 'granted');
      });
  }, []);

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f4f1ea 0%, #ede9e1 55%, #e7e3d9 100%)';

  const tabs: { id: Tab; label: string; Icon: typeof Building2 }[] = [
    { id: 'companies', label: isArabic ? 'الشركات' : 'Companies',  Icon: Building2 },
    { id: 'reports',   label: isArabic ? 'التقارير' : 'Reports',   Icon: FileText  },
    { id: 'users',     label: isArabic ? 'المستخدمون' : 'Users',   Icon: Users     },
  ];

  if (access === 'loading') {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-[var(--brand)]" />
        </div>
      </main>
    );
  }

  if (access === 'denied') {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <div className="grid h-16 w-16 place-content-center rounded-2xl bg-red-50 dark:bg-red-900/30">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Access Denied</h1>
          <p className="max-w-xs text-sm text-[var(--muted-foreground)]">
            This page is restricted to LAAM administrators.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="mx-auto max-w-6xl space-y-5 px-6 py-8">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-[2rem] px-8 py-8 md:px-12"
          style={{
            background: panelBg,
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 45% 100% at ${isArabic ? '92%' : '8%'} 50%,
                rgba(36,196,150,${isDark ? '0.18' : '0.22'}) 0%, transparent 62%)`,
            }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-content-center rounded-2xl bg-[var(--brand-soft)]">
              <Shield className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
                {isArabic ? 'لوحة الإدارة' : 'Admin Panel'}
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold text-[var(--foreground)]">
                {isArabic ? 'إدارة المنصة' : 'Platform Management'}
              </h1>
            </div>
          </div>
        </section>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="inline-flex rounded-[1.15rem] bg-[color:var(--card)]/68 p-1 shadow-[var(--shadow-sm)] backdrop-blur-xl">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-[0.9rem] px-5 py-2.5 text-sm font-semibold transition ${
                tab === id
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Icon className="h-4 w-4 text-[var(--brand)]" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────────────── */}
        {tab === 'companies' && <CompaniesTab />}
        {tab === 'reports'   && <ReportsTab />}
        {tab === 'users'     && <UsersTab />}

      </div>
    </main>
  );
}
