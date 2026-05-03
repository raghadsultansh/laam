'use client';

import Link from 'next/link';
import { ArrowRight, Brain, FileSearch, LayoutDashboard } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { FooterSection } from '@/components/landing/FooterSection';

export default function AboutPage() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const copy = isArabic
    ? {
        title: 'عن لامّ',
        subtitle: 'لامّ مساحة ذكية تساعد المستخدم على فهم التقارير المالية، طرح الأسئلة، ومراجعة المؤشرات المهمة في تجربة واحدة واضحة.',
        cta: 'ابدأ من التقارير',
        points: [
          ['تحليل موجه للتقارير', 'مصمم للتعامل مع التقارير السنوية والبيانات المالية، وليس مجرد عارض ملفات.'],
          ['محادثة داخل الجلسة', 'اسأل عن تقرير واحد أو قارن بين أكثر من تقرير داخل نفس مساحة العمل.'],
          ['لوحات معلومات', 'حوّل الأرقام والنقاط المهمة إلى ملخصات ولوحات قابلة للمراجعة.'],
        ],
      }
    : {
        title: 'About LAAM',
        subtitle: 'LAAM is an intelligent workspace for understanding financial reports, asking questions, and reviewing key indicators in one clear experience.',
        cta: 'Start with reports',
        points: [
          ['Report-first analysis', 'Built around annual reports and financial data, not just file viewing.'],
          ['Session-based chat', 'Ask about one report or compare multiple reports in the same workspace.'],
          ['Dashboard insights', 'Turn key numbers and findings into organized dashboard summaries.'],
        ],
      };

  const icons = [FileSearch, Brain, LayoutDashboard];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className={`rounded-[2rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="text-sm font-semibold text-[var(--brand)]">LAAM / لامّ</p>
          <h1 className={`mt-3 text-4xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>
          <Link href="/reports" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[var(--shadow-sm)]">
            {copy.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {copy.points.map(([title, description], index) => {
            const Icon = icons[index];
            return (
              <div key={title} className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
                <Icon className="h-6 w-6 text-[var(--brand)]" />
                <h2 className="mt-5 text-lg font-bold text-[var(--foreground)]">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
              </div>
            );
          })}
        </section>
      </div>
      <FooterSection />
    </main>
  );
}
