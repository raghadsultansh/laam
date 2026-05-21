import axios from 'axios';
import { supabase } from './supabase';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export const api = axios.create({ baseURL: BASE_URL });

// Attach the Supabase access token to every request automatically.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getMe() {
  const { data } = await api.get('/api/v1/me');
  return data;
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function getReports() {
  const { data } = await api.get<BackendCompanyWithReports[]>('/api/v1/reports');
  return data;
}

export async function getReportStatus(reportId: string) {
  const { data } = await api.get(`/api/v1/reports/${reportId}/status`);
  return data;
}

export async function uploadReport(file: File, companyId?: string) {
  const form = new FormData();
  form.append('file', file);
  if (companyId) form.append('company_id', companyId);
  const { data } = await api.post('/api/v1/reports/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(reportId: string) {
  const { data } = await api.post('/api/v1/sessions', { report_id: reportId });
  return data;
}

export async function listSessions() {
  const { data } = await api.get('/api/v1/sessions');
  return data;
}

export async function getSession(sessionId: string) {
  const { data } = await api.get(`/api/v1/sessions/${sessionId}`);
  return data;
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const { data } = await api.patch(`/api/v1/sessions/${sessionId}/title`, { title });
  return data;
}

export async function deleteSession(sessionId: string) {
  const { data } = await api.delete(`/api/v1/sessions/${sessionId}`);
  return data;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string) {
  const { data } = await api.get(`/api/v1/sessions/${sessionId}/messages`);
  return data;
}

export async function sendMessage(sessionId: string, question: string) {
  const { data } = await api.post(`/api/v1/sessions/${sessionId}/chat`, { question });
  return data as { answer: string; sources: Source[] };
}

// ── Admin ─────────────────────────────────────────────────────────────────────

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(reportId: string) {
  const { data } = await api.get<{ data: DashboardData; generated_at: string }>(
    `/api/v1/reports/${reportId}/dashboard`,
  );
  return data;
}

export async function generateDashboard(reportId: string) {
  const { data } = await api.post<{ data: DashboardData }>(
    `/api/v1/reports/${reportId}/dashboard/generate`,
  );
  return data;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function adminListCompanies() {
  const { data } = await api.get<AdminCompany[]>('/api/v1/admin/companies');
  return data;
}

export async function adminUpdateCompany(
  id: string,
  update: Partial<Pick<AdminCompany, 'name_en' | 'name_ar' | 'sector' | 'logo_url' | 'status'>>,
) {
  const { data } = await api.patch<AdminCompany>(`/api/v1/admin/companies/${id}`, update);
  return data;
}

export async function adminListReports() {
  const { data } = await api.get<AdminReport[]>('/api/v1/admin/reports');
  return data;
}

export async function adminUpdateReport(
  id: string,
  update: { visibility?: string; status?: string; title?: string },
) {
  const { data } = await api.patch<AdminReport>(`/api/v1/admin/reports/${id}`, update);
  return data;
}

export async function adminDeleteReport(id: string) {
  const { data } = await api.delete(`/api/v1/admin/reports/${id}`);
  return data;
}

export async function adminListUsers() {
  const { data } = await api.get<AdminUser[]>('/api/v1/admin/users');
  return data;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Source = {
  page_number: number | null;
  section_title: string | null;
  snippet: string;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
};

export type BackendReport = {
  id: string;
  status: string;
  fiscal_year: string;
  title: string | null;
  file_hash_sha256: string | null;
  qdrant_collection_id: string | null;
  companies: BackendCompany | null;
};

export type BackendCompany = {
  id: string;
  name_en: string;
  name_ar: string;
  sector: string;
  logo_url: string | null;
};

export type BackendCompanyWithReports = BackendCompany & {
  reports: BackendReport[];
};

export type BackendSession = {
  id: string;
  title: string;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  chat_history: Message[];
  reports: BackendReport | null;
};

export type DashExtractedValue = {
  value: number | null;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
  source_quote: string;
};

export type DashIncomeYear = {
  year: number | null;
  revenue: DashExtractedValue;
  cost_of_revenue: DashExtractedValue;
  gross_profit: DashExtractedValue;
  operating_income: DashExtractedValue;
  ebitda: DashExtractedValue;
  net_income: DashExtractedValue;
  interest_expense: DashExtractedValue;
  eps_basic: DashExtractedValue;
  eps_diluted: DashExtractedValue;
  zakat_and_tax: DashExtractedValue;
};

export type DashBalanceYear = {
  year: number | null;
  total_assets: DashExtractedValue;
  current_assets: DashExtractedValue;
  non_current_assets: DashExtractedValue;
  cash_and_equivalents: DashExtractedValue;
  inventory: DashExtractedValue;
  total_liabilities: DashExtractedValue;
  current_liabilities: DashExtractedValue;
  total_equity: DashExtractedValue;
  total_debt: DashExtractedValue;
};

export type DashCashFlowYear = {
  year: number | null;
  operating_cf: DashExtractedValue;
  investing_cf: DashExtractedValue;
  financing_cf: DashExtractedValue;
  capex: DashExtractedValue;
};

export type DashboardData = {
  income_statement: { current_year: DashIncomeYear; prior_year: DashIncomeYear | null };
  balance_sheet: { current_year: DashBalanceYear; prior_year: DashBalanceYear | null };
  cash_flow: { current_year: DashCashFlowYear; prior_year: DashCashFlowYear | null };
  supplemental: {
    fiscal_year: number | null;
    prior_year: number | null;
    company_name: string;
    reporting_currency: string;
    dividend_per_share: DashExtractedValue;
    segments: Array<{ name: string; revenue_value: number | null; revenue_unit: string }>;
  };
};

export type AdminCompany = {
  id: string;
  name_en: string;
  name_ar: string;
  sector: string;
  logo_url: string | null;
  status: string;
  ticker: string | null;
  created_at: string;
};

export type AdminReport = {
  id: string;
  title: string | null;
  fiscal_year: string | null;
  file_name: string | null;
  status: string;
  visibility: string;
  created_at: string;
  companies: { id: string; name_en: string } | null;
};

export type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  sessions: number;
};
