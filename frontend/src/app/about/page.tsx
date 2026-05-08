'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Send, Twitter } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { FooterSection } from '@/components/landing/FooterSection';

/* ─── Team — fill in real info before the presentation ─────────────────────── */
const TEAM: Array<{
  nameEn: string; nameAr: string;
  roleEn: string; roleAr: string;
  initials: string;
  gradient: string;
}> = [
  { nameEn: 'Raghad Sultan Alshanar', nameAr: 'رغد سلطان الشنار', roleEn: 'Full-Stack Developer', roleAr: 'مطورة شاملة', initials: 'R', gradient: 'from-[#18a078] to-[#12705a]' },
  { nameEn: 'Team Member 2',          nameAr: 'عضو الفريق ٢',       roleEn: 'Role',                roleAr: 'الدور',          initials: 'T', gradient: 'from-[#1a7a8a] to-[#0f5a6a]' },
  { nameEn: 'Team Member 3',          nameAr: 'عضو الفريق ٣',       roleEn: 'Role',                roleAr: 'الدور',          initials: 'T', gradient: 'from-[#5a6a18] to-[#3d4a10]' },
  { nameEn: 'Team Member 4',          nameAr: 'عضو الفريق ٤',       roleEn: 'Role',                roleAr: 'الدور',          initials: 'T', gradient: 'from-[#6a3a18] to-[#4a2810]' },
];

export default function AboutPage() {
  const { locale, theme, mounted } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const contactRef = useRef<HTMLElement>(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#contact') {
      setTimeout(() => contactRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!senderEmail.trim() || !message.trim()) {
      setError(isArabic ? 'يرجى ملء جميع الحقول.' : 'Please fill in all fields.');
      return;
    }
    window.location.href = `mailto:team@laam.sa?subject=Message from ${encodeURIComponent(senderEmail)}&body=${encodeURIComponent(message)}`;
    setSent(true);
  }

  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f4f1ea 0%, #ede9e1 55%, #e7e3d9 100%)';
  const titleColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(15,23,42,0.90)';
  const mutedColor = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(15,23,42,0.52)';

  const c = isArabic ? {
    label01: '٠١ — المشروع',
    label02: '٠٢ — الفريق',
    label03: '٠٣ — تواصل',
    gradBadge: 'مشروع تخرج',
    title: 'عن لامّ',
    subtitle: 'لامّ منصة ذكية لفهم التقارير المالية السنوية. بدلاً من قراءة مئات الصفحات، يمكنك طرح الأسئلة مباشرةً والحصول على إجابات موثقة من مصدرها في ثوانٍ.',
    why: 'التقارير المالية معقدة وطويلة، وغالبًا ما يصعب فهمها دون خبرة متخصصة. لامّ يجعل هذه المعلومات في متناول الجميع — المستثمرون، الطلاب، والمهنيون.',
    whyLabel: 'السبب',
    cta: 'تصفح التقارير',
    teamTitle: 'فريق العمل',
    contactTitle: 'تواصل معنا',
    contactSub: 'لأي استفسار أو ملاحظة — نسعد بسماعك.',
    emailLabel: 'بريدك الإلكتروني',
    emailPlaceholder: 'name@example.com',
    msgLabel: 'رسالتك',
    msgPlaceholder: 'اكتب رسالتك هنا...',
    send: 'إرسال الرسالة',
    sentMsg: 'شكرًا! سيفتح تطبيق البريد الإلكتروني لإرسال رسالتك.',
    emailUs: 'راسلونا مباشرةً',
    followUs: 'تابعونا',
  } : {
    label01: '01 — The Project',
    label02: '02 — The Team',
    label03: '03 — Contact',
    gradBadge: 'Graduation Project',
    title: 'About LAAM',
    subtitle: 'LAAM is an intelligent platform for understanding annual financial reports. Instead of reading hundreds of pages, ask questions directly and get source-backed answers in seconds.',
    why: 'Financial reports are long and complex, rarely accessible without specialist knowledge. LAAM makes this information available to everyone — investors, students, and professionals.',
    whyLabel: 'Why we built this',
    cta: 'Browse reports',
    teamTitle: 'The Team',
    contactTitle: 'Contact Us',
    contactSub: "For any questions or feedback — we'd love to hear from you.",
    emailLabel: 'Your email',
    emailPlaceholder: 'name@example.com',
    msgLabel: 'Message',
    msgPlaceholder: 'Write your message here...',
    send: 'Send message',
    sentMsg: 'Thank you! Your email client will open to send the message.',
    emailUs: 'Email us directly',
    followUs: 'Follow us',
  };

  return (
    <main className="min-h-screen bg-[var(--background)]" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* ── 01 Hero / About ──────────────────────────────────────────────── */}
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className="relative overflow-hidden rounded-[2.2rem]"
            style={{
              background: panelBg,
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
              boxShadow: isDark
                ? '0 32px 80px rgba(0,0,0,0.45), 0 0 120px rgba(18,112,90,0.08)'
                : '0 20px 60px rgba(0,0,0,0.10)',
            }}
          >
            {/* Glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: isDark
                  ? `radial-gradient(ellipse 60% 80% at ${isArabic ? '90%' : '10%'} 50%, rgba(24,160,120,0.18) 0%, transparent 65%)`
                  : `radial-gradient(ellipse 60% 80% at ${isArabic ? '90%' : '10%'} 50%, rgba(24,160,120,0.22) 0%, transparent 65%)`,
              }}
            />

            <div className={`relative z-10 grid gap-0 lg:grid-cols-[1fr_1fr] ${isArabic ? '' : ''}`}>
              {/* Text */}
              <div className={`flex flex-col justify-center px-8 py-14 md:px-14 md:py-16 ${isArabic ? 'text-right' : 'text-left'}`}>
                <span
                  className="mb-6 block h-px w-16 origin-left"
                  style={{ background: 'linear-gradient(90deg,#18a078,#12705a)', transform: isArabic ? 'scaleX(-1)' : undefined }}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#18a078' }}>
                  {c.label01}
                </span>
                <h1
                  className={`mt-4 text-4xl font-bold leading-tight lg:text-5xl ${
                    isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
                  }`}
                  style={{ color: titleColor }}
                >
                  {c.title}
                </h1>
                <p className="mt-5 max-w-md text-base leading-8" style={{ color: mutedColor }}>
                  {c.subtitle}
                </p>

                <div
                  className="mt-8 rounded-[1.2rem] p-5"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#18a078' }}>{c.whyLabel}</p>
                  <p className="mt-2 text-sm leading-7" style={{ color: mutedColor }}>{c.why}</p>
                </div>

                <Link
                  href="/reports"
                  className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#18a078,#12705a)', boxShadow: '0 0 24px rgba(18,112,90,0.35)' }}
                >
                  {c.cta}
                  <ArrowRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
                </Link>
              </div>

              {/* Right decoration */}
              <div className="hidden items-center justify-center lg:flex" aria-hidden>
                <div className="relative flex h-full w-full items-center justify-center py-16">
                  {/* Big emerald circle */}
                  <div
                    className="absolute h-72 w-72 rounded-full opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, #18a078, transparent 70%)' }}
                  />
                  <div
                    className="absolute h-52 w-52 rounded-full border opacity-10"
                    style={{ borderColor: '#18a078' }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <span
                      className={`text-7xl font-bold tracking-[-0.06em] ${isArabic ? `${xbShafigh.className}` : 'display-heading'}`}
                      style={{ color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                    >
                      {isArabic ? 'لامّ' : 'LAAM'}
                    </span>
                    <div className="h-px w-24" style={{ background: 'linear-gradient(90deg,transparent,#18a078,transparent)' }} />
                    <span className="text-xs font-semibold tracking-widest" style={{ color: '#18a078' }}>
                      {isArabic ? 'مشروع تخرج' : 'GRADUATION PROJECT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 Team ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-6 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div className={`mb-8 flex items-end justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <span
                className="mb-3 block h-px w-12"
                style={{ background: 'linear-gradient(90deg,#18a078,#12705a)', transform: isArabic ? 'scaleX(-1)' : undefined }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#18a078' }}>
                {c.label02}
              </span>
              <h2
                className={`mt-2 text-3xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
              >
                {c.teamTitle}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-[1.8rem] p-6 transition hover:-translate-y-1"
                style={{
                  background: isDark ? '#111927' : 'rgba(255,255,255,0.7)',
                  border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Subtle top accent line */}
                <div
                  className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 rounded-t-full transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: 'linear-gradient(90deg,#18a078,#12705a)' }}
                />

                <div
                  className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${member.gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg`}
                >
                  {member.initials}
                </div>

                <div className={`mt-5 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className={`text-sm font-bold text-[var(--foreground)] ${isArabic ? `${xbShafigh.className}` : ''}`}>
                    {isArabic ? member.nameAr : member.nameEn}
                  </p>
                  <p className="mt-1 text-xs font-semibold" style={{ color: '#18a078' }}>
                    {isArabic ? member.roleAr : member.roleEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 Contact ───────────────────────────────────────────────────── */}
      <section id="contact" ref={contactRef} className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className="overflow-hidden rounded-[2.2rem]"
            style={{
              background: isDark ? '#111927' : 'rgba(255,255,255,0.6)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className={`grid lg:grid-cols-[1fr_380px] ${isArabic ? 'lg:grid-cols-[380px_1fr]' : ''}`}>
              {/* Form */}
              <div className={`px-8 py-12 md:px-12 ${isArabic ? 'text-right' : 'text-left'}`}>
                <span
                  className="mb-3 block h-px w-12"
                  style={{ background: 'linear-gradient(90deg,#18a078,#12705a)', transform: isArabic ? 'scaleX(-1)' : undefined }}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#18a078' }}>
                  {c.label03}
                </span>
                <h2 className={`mt-2 text-3xl font-bold ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}>
                  {c.contactTitle}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">{c.contactSub}</p>

                {sent ? (
                  <div
                    className="mt-8 rounded-2xl p-5 text-sm"
                    style={{ background: 'rgba(24,160,120,0.12)', border: '1px solid rgba(24,160,120,0.25)', color: '#18a078' }}
                  >
                    {c.sentMsg}
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="mt-8 space-y-4">
                    <div>
                      <label className={`mb-2 block text-xs font-semibold text-[var(--muted-foreground)] ${isArabic ? 'text-right' : ''}`}>
                        {c.emailLabel}
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder={c.emailPlaceholder}
                        className="h-12 w-full rounded-2xl px-4 text-sm text-[var(--foreground)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--muted-foreground)] focus:ring-[var(--brand)]"
                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                      />
                    </div>
                    <div>
                      <label className={`mb-2 block text-xs font-semibold text-[var(--muted-foreground)] ${isArabic ? 'text-right' : ''}`}>
                        {c.msgLabel}
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={c.msgPlaceholder}
                        rows={5}
                        className="w-full resize-none rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--muted-foreground)] focus:ring-[var(--brand)]"
                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}
                      />
                    </div>
                    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#18a078,#12705a)', boxShadow: '0 0 20px rgba(18,112,90,0.30)' }}
                    >
                      <Send className="h-4 w-4" />
                      {c.send}
                    </button>
                  </form>
                )}
              </div>

              {/* Sidebar info */}
              <div
                className={`flex flex-col justify-center gap-6 p-8 md:p-12 ${isArabic ? 'text-right' : 'text-left'}`}
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderInlineStart: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                    {c.emailUs}
                  </p>
                  <a
                    href="mailto:team@laam.sa"
                    className="mt-2 inline-block text-base font-semibold transition hover:underline"
                    style={{ color: '#18a078' }}
                  >
                    team@laam.sa
                  </a>
                </div>

                <div className="h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                    {c.followUs}
                  </p>
                  <Link
                    href="https://x.com/laam_sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold transition hover:underline"
                    style={{ color: '#18a078' }}
                  >
                    <Twitter className="h-4 w-4" />
                    @laam_sa
                  </Link>
                </div>

                <div className="h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                <div
                  className="rounded-2xl p-5 text-center"
                  style={{ background: isDark ? 'rgba(24,160,120,0.08)' : 'rgba(24,160,120,0.06)', border: '1px solid rgba(24,160,120,0.15)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#18a078' }}>
                    {isArabic ? 'مشروع تخرج' : 'Graduation Project'}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${isArabic ? `${xbShafigh.className}` : 'display-heading'}`} style={{ color: '#18a078' }}>
                    {isArabic ? 'لامّ' : 'LAAM'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
