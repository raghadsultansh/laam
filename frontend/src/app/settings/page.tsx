'use client';

import type React from 'react';
import Link from 'next/link';
import { Bell, ChevronLeft, Globe2, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';

export default function SettingsPage() {
  const { locale, mounted, theme, toggleLocale, toggleTheme } = useAppPreferences();
  const isArabic = locale === 'ar';

  const copy = isArabic
    ? {
        back: 'العودة للمساحة',
        title: 'الإعدادات',
        subtitle: 'تحكم في تجربة الاستخدام، اللغة، المظهر، وخيارات الحساب.',
        profile: 'الملف الشخصي',
        profileText: 'إدارة معلومات الحساب وحالة المستخدم.',
        appearance: 'المظهر',
        appearanceText: 'التبديل بين الوضع الفاتح والداكن.',
        language: 'اللغة',
        languageText: 'تبديل واجهة المنصة بين العربية والإنجليزية.',
        security: 'الأمان',
        securityText: 'إعدادات تسجيل الدخول والحساب ستتصل لاحقا بـ Firebase.',
        notifications: 'التنبيهات',
        notificationsText: 'تنبيهات تجهيز التقارير وحفظ الجلسات ستضاف لاحقا.',
        currentTheme: theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح',
        currentLanguage: 'العربية',
      }
    : {
        back: 'Back to workspace',
        title: 'Settings',
        subtitle: 'Control your workspace experience, language, appearance, and account preferences.',
        profile: 'Profile',
        profileText: 'Manage account information and user status.',
        appearance: 'Appearance',
        appearanceText: 'Switch between light and dark mode.',
        language: 'Language',
        languageText: 'Toggle the interface between English and Arabic.',
        security: 'Security',
        securityText: 'Login and account settings will connect to Firebase later.',
        notifications: 'Notifications',
        notificationsText: 'Report processing and saved-session alerts will be added later.',
        currentTheme: theme === 'dark' ? 'Dark mode' : 'Light mode',
        currentLanguage: 'English',
      };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/workspace/demo" className="inline-flex items-center gap-2 rounded-2xl bg-[var(--card)] px-4 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] transition hover:text-[var(--foreground)]">
          <ChevronLeft className="h-4 w-4" />
          {copy.back}
        </Link>

        <section className="mt-8 rounded-[2rem] bg-[color:var(--card)]/78 p-8 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className="text-sm font-semibold text-[var(--brand)]">LAAM / لامّ</p>
            <h1 className={`mt-3 text-4xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{copy.subtitle}</p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <SettingCard icon={UserRound} title={copy.profile} description={copy.profileText} action={<Link href="/profile" className="text-sm font-semibold text-[var(--brand)]">Open</Link>} />
          <SettingCard
            icon={theme === 'dark' ? Moon : Sun}
            title={copy.appearance}
            description={copy.appearanceText}
            action={mounted ? <button onClick={toggleTheme} className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">{copy.currentTheme}</button> : null}
          />
          <SettingCard
            icon={Globe2}
            title={copy.language}
            description={copy.languageText}
            action={<button onClick={toggleLocale} className="rounded-full bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)]">{copy.currentLanguage}</button>}
          />
          <SettingCard icon={ShieldCheck} title={copy.security} description={copy.securityText} />
          <SettingCard icon={Bell} title={copy.notifications} description={copy.notificationsText} />
        </section>
      </div>
    </main>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] bg-[color:var(--card)]/72 p-5 shadow-[var(--shadow-sm)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-11 w-11 place-content-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon className="h-5 w-5" />
        </div>
        {action}
      </div>
      <h2 className="mt-5 text-lg font-bold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}
