'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Chrome } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { AuthShell } from '@/components/auth/AuthShell';
import { supabase } from '@/lib/supabase';

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
    passwordPlaceholder: 'Min 8 chars, uppercase, symbol',
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
    passwordPlaceholder: '8 أحرف + كبير + رمز خاص',
    confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور',
    submit: 'إنشاء الحساب',
    google: 'التسجيل عبر Google',
    divider: 'أو',
    footer: 'لديك حساب بالفعل؟',
    footerLink: 'تسجيل الدخول',
  },
} as const;

export function RegisterForm() {
  const { locale } = useAppPreferences();
  const isArabic = locale === 'ar';
  const copy = registerCopy[locale];
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !password) {
      setError(isArabic ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError(isArabic ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }
    const passwordValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!passwordValid) {
      setError(
        isArabic
          ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل، وتحتوي على حرف كبير، وحرف صغير، ورمز خاص (مثل ! @ # $).'
          : 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character (e.g. ! @ # $).'
      );
      return;
    }
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 3000);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <AuthShell title={copy.title} subtitle="" contentWidthClassName="max-w-[470px]">
        <div className="rounded-xl bg-green-50 px-6 py-5 text-center text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
          {isArabic
            ? 'تم إنشاء حسابك! تحقق من بريدك الإلكتروني لتأكيد التسجيل.'
            : 'Account created! Check your email to confirm your registration.'}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={copy.title} subtitle={copy.subtitle} contentWidthClassName="max-w-[470px]">
      <form className="space-y-5" dir={isArabic ? 'rtl' : 'ltr'} onSubmit={handleSubmit}>
        <button
          type="button"
          onClick={handleGoogle}
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
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={copy.fullNamePlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={copy.passwordPlaceholder}
              required
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--foreground)]">{copy.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={copy.confirmPasswordPlaceholder}
              required
              className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--card-strong)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:bg-red-900/50 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-[var(--brand)] text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--brand-alt)] disabled:opacity-60"
        >
          {loading ? '...' : copy.submit}
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
