'use client';

import type React from 'react';
import Link from 'next/link';
import { ChevronLeft, Mail, Shield, UserRound } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export default function ProfilePage() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';

  const copy = isArabic
    ? {
        back: 'الإعدادات',
        title: 'الملف الشخصي',
        subtitle: 'صفحة جاهزة للربط مع حسابات Firebase لاحقا.',
        name: 'مستخدم تجريبي',
        role: 'ضيف',
        email: 'guest@laam.local',
        status: 'غير مسجل الدخول',
        savePrompt: 'سجل الدخول لاحقا لحفظ الجلسات ولوحات المعلومات بشكل دائم.',
      }
    : {
        back: 'Settings',
        title: 'Profile',
        subtitle: 'A backend-ready profile screen for Firebase account integration later.',
        name: 'Demo User',
        role: 'Guest',
        email: 'guest@laam.local',
        status: 'Not signed in',
        savePrompt: 'Sign in later to permanently save sessions and dashboards.',
      };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/settings" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)]">
          <ChevronLeft className="h-4 w-4" />
          {copy.back}
        </Link>

        <section className="mt-8 rounded-[2rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className={`flex flex-col gap-6 md:flex-row md:items-center md:justify-between ${isArabic ? 'md:flex-row-reverse text-right' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-[var(--brand)]">LAAM Account</p>
              <h1 className={`mt-3 text-4xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>
            </div>
            <div className="grid h-24 w-24 place-content-center rounded-[2rem] bg-[var(--brand-soft)] text-[var(--brand)]">
              <UserRound className="h-11 w-11" />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard icon={UserRound} label={copy.name} value={copy.role} />
            <InfoCard icon={Mail} label={copy.email} value={copy.status} />
            <InfoCard icon={Shield} label={copy.status} value={copy.savePrompt} />
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.4rem] bg-[var(--card-strong)]/78 p-5 shadow-[var(--shadow-sm)]">
      <Icon className="h-5 w-5 text-[var(--brand)]" />
      <p className="mt-4 text-sm font-bold text-[var(--foreground)]">{label}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{value}</p>
    </div>
  );
}
