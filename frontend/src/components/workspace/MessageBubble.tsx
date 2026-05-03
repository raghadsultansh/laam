'use client';

import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

export function MessageBubble({
  message,
  role,
}: {
  message: string;
  role: 'user' | 'assistant';
}) {
  const { locale } = useAppPreferences();
  const isUser = role === 'user';
  const isArabic = locale === 'ar';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-[1.4rem] px-4 py-3 text-sm leading-7 shadow-[var(--shadow-sm)] ${
          isUser
            ? 'border border-[color:var(--brand-alt)]/35 bg-[var(--brand)] text-white'
            : 'border border-[var(--border)] bg-[var(--card-strong)] text-[var(--foreground)]'
        } ${isArabic ? 'text-right' : 'text-left'}`}
      >
        <p className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${isUser ? 'text-white/70' : 'text-[var(--muted-foreground)]'}`}>
          {isUser ? (isArabic ? 'أنت' : 'You') : isArabic ? 'المساعد' : 'Assistant'}
        </p>
        <p>{message}</p>
      </div>
    </div>
  );
}
