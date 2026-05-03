'use client';

import { Mail, MessageSquare, Send } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { FooterSection } from '@/components/landing/FooterSection';

export default function ContactPage() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const copy = isArabic
    ? {
        title: 'تواصل معنا',
        subtitle: 'صفحة جاهزة لعرض معلومات الفريق أو استقبال ملاحظات المستخدمين لاحقا.',
        email: 'البريد الإلكتروني',
        feedback: 'ملاحظات المشروع',
        placeholder: 'اكتب ملاحظتك هنا...',
        send: 'إرسال',
      }
    : {
        title: 'Contact Us',
        subtitle: 'A clean placeholder for team contact details or future user feedback.',
        email: 'Email',
        feedback: 'Project Feedback',
        placeholder: 'Write your feedback here...',
        send: 'Send',
      };

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <section className={`rounded-[2rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-semibold text-[var(--brand)]">LAAM / لامّ</p>
          <h1 className={`mt-3 text-4xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
            <Mail className="h-6 w-6 text-[var(--brand)]" />
            <h2 className="mt-5 text-lg font-bold text-[var(--foreground)]">{copy.email}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">team@laam.local</p>
          </div>

          <div className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--brand)]" />
              <h2 className="text-lg font-bold text-[var(--foreground)]">{copy.feedback}</h2>
            </div>
            <textarea className="mt-4 min-h-32 w-full resize-none rounded-[1.2rem] bg-[var(--background)] p-4 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]" placeholder={copy.placeholder} />
            <button className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white">
              <Send className="h-4 w-4" />
              {copy.send}
            </button>
          </div>
        </section>
      </div>
      <FooterSection />
    </main>
  );
}
