'use client';

import Link from 'next/link';
import { Chrome } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { AuthShell } from '@/components/auth/AuthShell';

const registerCopy = {
  en: {
    title: 'Create Account',
    subtitle: 'Create your account to save workspaces and continue your report analysis.',
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullNamePlaceholder: 'Enter your full name',
    emailPlaceholder: 'name@example.com',
    passwordPlaceholder: 'Create a password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    submit: 'Create Account',
    google: 'Sign up with Google',
    divider: 'or',
    footer: 'Already have an account?',
    footerLink: 'Login',
  },
  ar: {
    title: 'إنشاء حساب',
    subtitle: 'أنشئ حسابك لحفظ مساحات العمل ومتابعة تحليل التقارير لاحقًا.',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    fullNamePlaceholder: 'أدخل الاسم الكامل',
    emailPlaceholder: 'name@example.com',
    passwordPlaceholder: 'أنشئ كلمة مرور',
    confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
    submit: 'إنشاء الحساب',
    google: 'التسجيل عبر Google',
    divider: 'أو',
    footer: 'لديك حساب بالفعل؟',
    footerLink: 'تسجيل الدخول',
  },
} as const;

// Visual form only at this stage.
// Connect this to Firebase createUser and Google sign-up when auth wiring starts.
export function RegisterForm() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const copy = registerCopy[locale];

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle} contentWidthClassName="max-w-[470px]">
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
          <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.fullName}</label>
          <input
            type="text"
            placeholder={copy.fullNamePlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.email}</label>
          <input
            type="email"
            placeholder={copy.emailPlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.password}</label>
            <input
              type="password"
              placeholder={copy.passwordPlaceholder}
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.confirmPassword}</label>
            <input
              type="password"
              placeholder={copy.confirmPasswordPlaceholder}
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="h-12 w-full rounded-full bg-[var(--brand)] text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)]"
        >
          {copy.submit}
        </button>

        <p className="text-center text-sm text-[var(--muted-foreground)]">
          {copy.footer}{' '}
          <Link href="/login" className="font-medium text-[var(--brand)] transition hover:text-[var(--brand-alt)]">
            {copy.footerLink}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
