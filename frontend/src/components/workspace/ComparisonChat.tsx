'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, GitCompare, Loader2 } from 'lucide-react';
import { getComparisonMessages, sendComparisonMessage, type ComparisonMessage, type BackendReport } from '@/lib/api';
import { COMPANY_COLORS } from '@/lib/comparison-colors';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

type Props = {
  sessionId: string;
  reports: BackendReport[];
};

export function ComparisonChat({ sessionId, reports }: Props) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [messages, setMessages] = useState<ComparisonMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getComparisonMessages(sessionId).then(setMessages).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: ComparisonMessage = {
      id: Date.now().toString(),
      session_id: sessionId,
      role: 'user',
      content: q,
      per_company_answers: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendComparisonMessage(sessionId, q);
      const assistantMsg: ComparisonMessage = {
        id: (Date.now() + 1).toString(),
        session_id: sessionId,
        role: 'assistant',
        content: res.synthesis,
        per_company_answers: res.per_company,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          session_id: sessionId,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          per_company_answers: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const reportColorMap = Object.fromEntries(
    reports.map((r, i) => [r.id, COMPANY_COLORS[i % COMPANY_COLORS.length]])
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] bg-[var(--card)] shadow-[var(--shadow-md)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center py-12">
            <div className="grid h-14 w-14 place-content-center rounded-2xl bg-[var(--brand-soft)]">
              <GitCompare className="h-6 w-6 text-[var(--brand)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                {isArabic ? 'اسأل عن المقارنة' : 'Ask a comparison question'}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {isArabic
                  ? 'مثال: من حقق أعلى إيرادات؟ ما الفرق في صافي الربح؟'
                  : 'e.g. Who had the highest revenue? How do profit margins compare?'}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-[75%] rounded-2xl bg-[var(--brand)] px-4 py-2.5 text-sm text-white">
                {msg.content}
              </div>
            ) : (
              <div className="w-full space-y-3">
                {/* Per-company answer blocks */}
                {msg.per_company_answers && msg.per_company_answers.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {msg.per_company_answers.map((pc) => {
                      const report = reports.find((r) => r.id === pc.report_id);
                      const color = reportColorMap[pc.report_id] ?? COMPANY_COLORS[0];
                      const companyName = (report?.companies as any)?.name_en ?? pc.company_name;
                      return (
                        <div
                          key={pc.report_id}
                          className={`rounded-2xl border-l-4 ${color.border} ${color.bgSoft} p-4`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${color.badge}`}>
                              <span className={`h-2 w-2 rounded-full ${color.bg}`} />
                              {companyName}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">{pc.fiscal_year}</span>
                          </div>
                          <p className="text-sm leading-6 text-[var(--foreground)]">{pc.answer}</p>
                          {pc.sources && pc.sources.length > 0 && (
                            <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                              {pc.sources.length} source{pc.sources.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Synthesis */}
                {msg.content && (
                  <div className="rounded-2xl bg-[var(--card-strong)] px-4 py-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      {isArabic ? 'الخلاصة' : 'Synthesis'}
                    </p>
                    <p className="text-sm leading-6 text-[var(--foreground)]">{msg.content}</p>
                  </div>
                )}

                {/* Plain error/info message with no per_company */}
                {!msg.per_company_answers && msg.content && (
                  <div className="rounded-2xl bg-[var(--card-strong)] px-4 py-3">
                    <p className="text-sm leading-6 text-[var(--foreground)]">{msg.content}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--card-strong)] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
              <span className="text-sm text-[var(--muted-foreground)]">
                {isArabic ? 'جارٍ المقارنة…' : 'Comparing…'}
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--background)] px-4 py-2 shadow-[var(--shadow-sm)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isArabic ? 'اسأل سؤالاً مقارناً…' : 'Ask a comparison question…'}
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
            dir={isArabic ? 'rtl' : 'ltr'}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="grid h-8 w-8 place-content-center rounded-xl bg-[var(--brand)] text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
