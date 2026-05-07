'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageBubble } from '@/components/workspace/MessageBubble';
import { QuestionInput } from '@/components/workspace/QuestionInput';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { getMessages, sendMessage, type Message, type Source } from '@/lib/api';

const defaultPrompts = {
  en: [
    'Summarize the main financial performance',
    'What was the net income this year?',
    'What are the major risks mentioned?',
    'Compare revenue trend year over year',
  ],
  ar: [
    'لخص الأداء المالي الرئيسي',
    'ما هو صافي الدخل هذا العام؟',
    'ما أبرز المخاطر المذكورة؟',
    'قارن اتجاه الإيرادات من سنة لأخرى',
  ],
};

export function ChatWindow({
  sessionId,
  onNewSources,
  onSourceClick,
}: {
  sessionId: string;
  onNewSources?: (sources: Source[]) => void;
  onSourceClick?: (sources: Source[], index: number) => void;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages(sessionId)
      .then((data) => setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(question: string) {
    const userMsg: Message = { role: 'user', content: question, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const { answer, sources } = await sendMessage(sessionId, question);
      const assistantMsg: Message = {
        role: 'assistant',
        content: answer,
        sources,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (sources?.length) onNewSources?.(sources);
    } catch {
      const errMsg: Message = {
        role: 'assistant',
        content: isArabic ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'Something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function handlePromptClick(prompt: string) {
    if (!sending) handleSend(prompt);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)] px-5 pb-0 pt-3">
      <div className="clean-chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              {isArabic ? 'لا توجد رسائل بعد. ابدأ بطرح سؤال.' : 'No messages yet. Ask your first question.'}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} message={msg.content} role={msg.role} sources={msg.sources} onSourceClick={onSourceClick} />
          ))
        )}

        {sending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-[1.4rem] border border-[var(--border)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
              {isArabic ? 'جارٍ المعالجة...' : 'Thinking...'}
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 space-y-3 bg-[var(--background)] pb-4 pt-4">
        {messages.length === 0 && !loading ? (
          <div className="flex w-full justify-start" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex w-fit max-w-full flex-wrap justify-start gap-2 text-start">
              {defaultPrompts[locale].map((prompt) => (
                <button
                  key={prompt}
                  dir={isArabic ? 'rtl' : 'ltr'}
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)]/35 hover:text-[var(--foreground)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex w-full justify-start" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-[980px]">
            <QuestionInput onSubmit={handleSend} disabled={sending} />
          </div>
        </div>
      </div>
    </div>
  );
}
