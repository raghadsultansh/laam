'use client';

import { FormEvent, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

export function QuestionInput({
  onSubmit,
  disabled = false,
}: {
  onSubmit?: (question: string) => void;
  disabled?: boolean;
}) {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSubmit?.(trimmed);
    setValue('');
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--card-strong)]/86 p-3 shadow-[var(--shadow-md)]"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          dir={isArabic ? 'rtl' : 'ltr'}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              const trimmed = value.trim();
              if (trimmed && !disabled) {
                onSubmit?.(trimmed);
                setValue('');
                requestAnimationFrame(() => {
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                });
              }
            }
          }}
          placeholder={
            isArabic
              ? 'اكتب سؤالك هنا حول التقرير أو قارن بين التقارير المرفقة...'
              : 'Ask about a report here or compare the attached reports...'
          }
          className={`min-h-[56px] flex-1 resize-none overflow-hidden bg-transparent px-3 py-2 text-sm leading-7 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] ${
            isArabic ? 'text-right' : 'text-left'
          }`}
        />

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-alt)] disabled:opacity-50"
        >
          {isArabic ? 'إرسال' : 'Send'}
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
