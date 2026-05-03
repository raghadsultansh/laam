'use client';

import Link from 'next/link';
import { Chrome } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { AuthShell } from '@/components/auth/AuthShell';

const loginCopy = {
  en: {
    title: 'Login',
    subtitle: 'Enter your email and password to continue to your workspace.',
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'name@example.com',
    passwordPlaceholder: 'Enter your password',
    forgot: 'Forgot password?',
    submit: 'Login',
    google: 'Continue with Google',
    divider: 'or',
    footer: "Don't have an account?",
    footerLink: 'Create one',
  },
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'أدخل البريد الإلكتروني وكلمة المرور للمتابعة إلى مساحة العمل.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    emailPlaceholder: 'name@example.com',
    passwordPlaceholder: 'أدخل كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    submit: 'تسجيل الدخول',
    google: 'المتابعة عبر Google',
    divider: 'أو',
    footer: 'ليس لديك حساب؟',
    footerLink: 'أنشئ حسابًا',
  },
} as const;

// Visual form only at this stage.
// Hook Firebase email/password and Google sign-in here when auth wiring starts.
export function LoginForm() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const copy = loginCopy[locale];

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle} contentWidthClassName="max-w-[420px]">
      <form className="space-y-5" dir={isArabic ? 'rtl' : 'ltr'}>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          <Chrome className="h-4 w-4" />
          {copy.google}
        </button>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            {copy.divider}
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.email}</label>
          <input
            type="email"
            placeholder={copy.emailPlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.password}</label>
          <input
            type="password"
            placeholder={copy.passwordPlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className={isArabic ? 'text-left' : 'text-right'}>
          <Link href="#" className="text-sm font-medium text-[var(--brand)] transition hover:text-[var(--brand-alt)]">
            {copy.forgot}
          </Link>
        </div>

        <button
          type="submit"
          className="h-12 w-full rounded-full bg-[var(--brand)] text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]"
        >
          {copy.submit}
        </button>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          {copy.footer}{' '}
          <Link href="/register" className="font-medium text-[var(--brand)] transition hover:text-[var(--brand-alt)]">
            {copy.footerLink}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
