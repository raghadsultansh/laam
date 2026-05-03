'use client';

import { MessageBubble } from '@/components/workspace/MessageBubble';
import { QuestionInput } from '@/components/workspace/QuestionInput';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

const messages = {
  en: [
    { role: 'assistant' as const, text: 'I can summarize one report or compare multiple reports inside this session.' },
    { role: 'user' as const, text: 'Compare revenue direction between Aramco 2024 and STC 2023.' },
    { role: 'assistant' as const, text: 'Aramco shows large-scale energy revenue with stronger absolute volume, while STC reflects telecom growth patterns and a more service-led mix. A dashboard can break that down report by report.' },
  ],
  ar: [
    { role: 'assistant' as const, text: 'يمكنني تلخيص تقرير واحد أو المقارنة بين عدة تقارير داخل هذه الجلسة.' },
    { role: 'user' as const, text: 'قارن اتجاه الإيرادات بين أرامكو 2024 وإس تي سي 2023.' },
    { role: 'assistant' as const, text: 'تعكس أرامكو حجم إيرادات أكبر مرتبطا بقطاع الطاقة، بينما تظهر إس تي سي نمط نمو تقني واتصالات أكثر اعتمادا على الخدمات. يمكن للوحة المعلومات توضيح ذلك لكل تقرير.' },
  ],
};

const prompts = {
  en: [
    'Summarize the main financial performance',
    'What was the net income in 2024?',
    'Compare revenue between the selected reports',
    'Show the major risks mentioned',
  ],
  ar: [
    'لخص الأداء المالي الرئيسي',
    'ما هو صافي الدخل في 2024؟',
    'قارن الإيرادات بين التقارير المحددة',
    'اعرض أبرز المخاطر المذكورة',
  ],
};

export function ChatWindow() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--background)] px-5 pb-0 pt-3">
      <div className="clean-chat-scroll min-h-0 flex-1 space-y-4 overflow-y-auto">
        {/* Mock messages for now. Replace this with chat history from the backend. */}
        {messages[locale].map((message, index) => (
          <MessageBubble key={`${message.role}-${index}`} message={message.text} role={message.role} />
        ))}
      </div>

      <div className="shrink-0 space-y-3 bg-[var(--background)] pb-4 pt-4">
        <div className="flex w-full justify-start" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="flex w-fit max-w-full flex-wrap justify-start gap-2 text-start">
            {/* Prompt chips are just starters. Later they can come from selected report context. */}
            {prompts[locale].map((prompt) => (
              <button
                key={prompt}
                dir={isArabic ? 'rtl' : 'ltr'}
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:border-[var(--brand)]/35 hover:text-[var(--foreground)]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full justify-start" dir={isArabic ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-[980px]">
            <QuestionInput />
          </div>
        </div>
      </div>
    </div>
  );
}
