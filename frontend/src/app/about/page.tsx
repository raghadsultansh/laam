'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Send, Linkedin, BrainCircuit, Globe2, FileText, Building2 } from 'lucide-react';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';
import { xbShafigh } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { FooterSection } from '@/components/landing/FooterSection';
import { LaamLogoAnimation, LaamLogoAnimationRef } from '@/components/landing/LaamLogoAnimation';

/* ─── Team ──────────────────────────────────────────────────────────────────── */
const TEAM: Array<{
  nameEn: string; nameAr: string;
  roleEn: string; roleAr: string;
  initials: string;
  from: string; to: string;
  image: string;
  linkedinUrl: string;
}> = [
  {
    nameEn: 'Raghad Al Shanar',   nameAr: 'رغد الشنار',
    roleEn: 'Full-Stack, AI & Data Science',        roleAr: 'تطوير شامل، ذكاء اصطناعي وعلوم بيانات',
    initials: 'R', from: '#18a078', to: '#0d6b52',
    image: '/team/raghad.png',
    linkedinUrl: 'https://www.linkedin.com/in/raghad-sultan-al-shanar',
  },
  {
    nameEn: 'Nouf Alnagaidan',    nameAr: 'نوف النقيدان',
    roleEn: 'AI Pipeline & Model Development',       roleAr: 'تطوير النماذج وخط أنابيب الذكاء الاصطناعي',
    initials: 'N', from: '#2563eb', to: '#1d4ed8',
    image: '/team/nouf.jpg',
    linkedinUrl: 'https://www.linkedin.com/in/nouf-turki-alnagaidan-6085a634b/',
  },
  {
    nameEn: 'Latifa Altuwairqi',  nameAr: 'لطيفة الطويرقي',
    roleEn: 'AI, Data & Model Development',          roleAr: 'ذكاء اصطناعي وتطوير البيانات والنماذج',
    initials: 'L', from: '#7c3aed', to: '#5b21b6',
    image: '/team/latifa.png',
    linkedinUrl: 'https://www.linkedin.com/in/latifa-altuwairqi-617691238/',
  },
];

/* ─── Stats strip ───────────────────────────────────────────────────────────── */
const STATS_EN = [
  { icon: Building2,   value: '4+',    label: 'Saudi companies' },
  { icon: FileText,    value: '12+',   label: 'Annual reports'  },
  { icon: Globe2,      value: 'عربي EN', label: 'Bilingual'       },
  { icon: BrainCircuit,value: 'RAG',   label: 'AI pipeline'     },
];
const STATS_AR = [
  { icon: Building2,   value: '٤+',    label: 'شركة سعودية'  },
  { icon: FileText,    value: '١٢+',   label: 'تقرير سنوي'   },
  { icon: Globe2,      value: 'عربي EN', label: 'ثنائي اللغة'  },
  { icon: BrainCircuit,value: 'RAG',   label: 'نموذج ذكاء'   },
];

export default function AboutPage() {
  const { locale, theme, mounted } = useAppPreferences();
  const isArabic = locale === 'ar';
  const isDark = !mounted || theme === 'dark';
  const contactRef = useRef<HTMLElement>(null);
  const animRef = useRef<LaamLogoAnimationRef>(null);
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
    window.location.href = `mailto:laam.ai.team@gmail.com?subject=Message from ${encodeURIComponent(senderEmail)}&body=${encodeURIComponent(message)}`;
    setSent(true);
  }

  /* Panel tokens — identical to HeroSection */
  const panelBg = isDark
    ? 'linear-gradient(145deg, #0e1f32 0%, #091725 45%, #050f1c 100%)'
    : 'linear-gradient(135deg, #f6f6f6 0%, #eaf4f2 55%, #e7e3d9 100%)';
  const panelBorder  = isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)';
  const panelShadow  = isDark
    ? '0 32px 80px rgba(0,0,0,0.50), 0 0 0 1px rgba(18,112,90,0.10), 0 0 120px rgba(18,112,90,0.09)'
    : '0 20px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(18,112,90,0.07)';
  const topHighlight = isDark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.85)';
  const titleColor   = isDark ? 'rgba(255,255,255,0.93)' : 'rgba(15,23,42,0.90)';
  const mutedColor   = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(15,23,42,0.52)';

  const stats = isArabic ? STATS_AR : STATS_EN;

  const c = isArabic ? {
    superTitle: '٠١ — المشروع',
    teamSection: '٠٢ — الفريق',
    contactSection: '٠٣ — تواصل',
    badge: 'مشروع تخرج',
    title: 'عن لامّ',
    subtitle: 'لامّ منصة ذكية لفهم التقارير المالية السنوية. بدلاً من قراءة مئات الصفحات، اطرح أسئلتك مباشرةً واحصل على إجابات موثقة في ثوانٍ.',
    why: 'التقارير المالية معقدة وطويلة. لامّ يجعل هذه المعلومات في متناول الجميع — المستثمرون، الطلاب، والمهنيون.',
    whyLabel: 'الهدف',
    cta: 'تصفح التقارير',
    teamTitle: 'فريق العمل',
    teamSub: 'ثلاثة طلاب بنوا هذا من الصفر.',
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
    superTitle: '01 — The Project',
    teamSection: '02 — The Team',
    contactSection: '03 — Contact',
    badge: 'Graduation Project',
    title: 'About LAAM',
    subtitle: 'LAAM is an intelligent platform for understanding annual financial reports. Instead of reading hundreds of pages, ask questions directly and get source-backed answers in seconds.',
    why: 'Financial reports are long and complex, rarely accessible without specialist knowledge. LAAM makes this information reachable for everyone.',
    whyLabel: 'Why we built this',
    cta: 'Browse reports',
    teamTitle: 'The Team',
    teamSub: 'Three students who built this from the ground up.',
    contactTitle: 'Get in Touch',
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

  /* ─── text col (shared between LTR / RTL) ──────────────────────────────── */
  const textCol = (
    <div className={`flex flex-col justify-center px-8 py-14 md:px-14 md:py-16 ${isArabic ? 'text-right' : 'text-left'}`}>
      <h1
        className={`mt-3 text-4xl font-bold leading-[1.08] tracking-[-0.04em] lg:text-[3.4rem] ${
          isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'
        }`}
        style={{ color: titleColor }}
      >
        {c.title}
      </h1>

      <p className={`mt-5 max-w-md ${isArabic ? 'text-base leading-9' : 'text-lg leading-8'}`} style={{ color: mutedColor }}>
        {c.subtitle}
      </p>

      {/* Why box */}
      <div
        className="mt-7 rounded-[1.3rem] p-5"
        style={{
          background: isDark ? 'rgba(24,160,120,0.07)' : 'rgba(24,160,120,0.06)',
          border: '1px solid rgba(24,160,120,0.18)',
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: '#18a078' }}>{c.whyLabel}</p>
        <p className="mt-2 text-sm leading-7" style={{ color: mutedColor }}>{c.why}</p>
      </div>

    </div>
  );

  /* ─── animation col ──────────────────────────────────────────────────────── */
  const animCol = (
    <div
      className="relative flex min-h-[380px] cursor-pointer items-center justify-center md:min-h-[460px]"
      onMouseEnter={() => animRef.current?.replay()}
    >
      <div className="relative z-10">
        <LaamLogoAnimation ref={animRef} />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--background)]" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════════
          01 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className="relative overflow-hidden rounded-[2.4rem]"
            style={{ background: panelBg, border: panelBorder, boxShadow: panelShadow }}
          >
            {/* Top edge highlight */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[2.4rem]" style={{ boxShadow: topHighlight }} />

            {/* Brand glow — behind animation col */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: isArabic
                  ? isDark
                    ? 'radial-gradient(ellipse 56% 90% at 20% 50%, rgba(36,196,150,0.36) 0%, rgba(24,160,120,0.16) 42%, transparent 70%)'
                    : 'radial-gradient(ellipse 56% 90% at 20% 50%, rgba(36,196,150,0.48) 0%, rgba(28,172,132,0.26) 38%, rgba(24,160,120,0.08) 58%, transparent 74%)'
                  : isDark
                    ? 'radial-gradient(ellipse 56% 90% at 80% 50%, rgba(36,196,150,0.36) 0%, rgba(24,160,120,0.16) 42%, transparent 70%)'
                    : 'radial-gradient(ellipse 56% 90% at 80% 50%, rgba(36,196,150,0.48) 0%, rgba(28,172,132,0.26) 38%, rgba(24,160,120,0.08) 58%, transparent 74%)',
              }}
            />

            {/* Grid — always dir=ltr so text/anim sides are controlled manually */}
            <div dir="ltr" className={`relative z-10 grid items-center ${isArabic ? 'lg:grid-cols-[0.92fr_1.08fr]' : 'lg:grid-cols-[1.08fr_0.92fr]'}`}>
              {isArabic ? <>{animCol}{textCol}</> : <>{textCol}{animCol}</>}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.8rem] lg:grid-cols-4"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
            }}
          >
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div
                key={i}
                className={`group flex flex-col items-center justify-center gap-2 px-6 py-8 transition-colors duration-300 ${isArabic ? 'text-center' : 'text-center'}`}
                style={{ background: isDark ? '#0c1824' : '#ffffff' }}
              >
                <div
                  className="mb-1 grid h-10 w-10 place-content-center rounded-2xl transition-colors duration-300 group-hover:bg-[rgba(24,160,120,0.15)]"
                  style={{ background: isDark ? 'rgba(24,160,120,0.10)' : 'rgba(24,160,120,0.08)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: '#18a078' }} />
                </div>
                <span
                  className={`text-2xl font-bold tracking-tight ${isArabic ? `${xbShafigh.className}` : 'display-heading'}`}
                  style={{ color: titleColor }}
                >
                  {value}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: mutedColor }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          02 — TEAM
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-6 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className={`mb-10 ${isArabic ? 'text-right' : 'text-left'}`}>
            <span
              className="mb-3 block h-px w-12"
              style={{ background: 'linear-gradient(90deg,#18a078,#12705a)', transform: isArabic ? 'scaleX(-1)' : undefined }}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: '#18a078' }}>
              {c.teamSection}
            </span>
            <h2
              className={`mt-2 text-3xl font-bold tracking-tight lg:text-4xl ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
              style={{ color: titleColor }}
            >
              {c.teamTitle}
            </h2>
            <p className="mt-2 text-sm" style={{ color: mutedColor }}>{c.teamSub}</p>
          </div>

          {/* Cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            {TEAM.map((member, i) => (
              <div
                key={i}
                className="group relative flex flex-col items-center overflow-hidden rounded-[2rem] px-6 pb-7 pt-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                style={{
                  background: isDark ? '#0d1923' : '#ffffff',
                  border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.07)',
                }}
              >
                {/* Photo avatar */}
                <div
                  className="relative h-20 w-20 overflow-hidden rounded-2xl"
                  style={{
                    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Initials fallback (always rendered under the image) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white"
                    style={{ background: `linear-gradient(145deg, ${member.from}, ${member.to})` }}
                    aria-hidden
                  >
                    {member.initials}
                  </div>
                  <img
                    src={member.image}
                    alt={isArabic ? member.nameAr : member.nameEn}
                    className="relative z-10 h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                {/* Name */}
                <p className={`mt-4 font-bold leading-snug text-[var(--foreground)] ${isArabic ? `${xbShafigh.className} text-base` : 'text-sm'}`}>
                  {isArabic ? member.nameAr : member.nameEn}
                </p>

                {/* Role */}
                <p className="mt-1.5 text-xs font-semibold leading-5 text-[var(--muted-foreground)]">
                  {isArabic ? member.roleAr : member.roleEn}
                </p>

                {/* LinkedIn */}
                <a
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--brand)]"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          03 — CONTACT
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" ref={contactRef} className="px-4 pb-16 pt-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <div
            className="overflow-hidden rounded-[2.4rem]"
            style={{
              background: isDark ? '#0c1824' : 'rgba(255,255,255,0.82)',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)',
              boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.40)' : '0 20px 60px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className={`grid lg:grid-cols-[1fr_340px] ${isArabic ? 'lg:grid-cols-[340px_1fr]' : ''}`}>
              {/* Form side */}
              <div className={`px-8 py-12 md:px-12 ${isArabic ? 'text-right' : 'text-left'}`}>
                <span
                  className="mb-3 block h-px w-12"
                  style={{ background: 'linear-gradient(90deg,#18a078,#12705a)', transform: isArabic ? 'scaleX(-1)' : undefined }}
                />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: '#18a078' }}>
                  {c.contactSection}
                </span>
                <h2
                  className={`mt-2 text-3xl font-bold lg:text-4xl ${isArabic ? `${xbShafigh.className} arabic-display` : 'display-heading'}`}
                  style={{ color: titleColor }}
                >
                  {c.contactTitle}
                </h2>
                <p className="mt-3 text-sm leading-7" style={{ color: mutedColor }}>{c.contactSub}</p>

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
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                        }}
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
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                        }}
                      />
                    </div>
                    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#18a078,#12705a)', boxShadow: '0 0 24px rgba(18,112,90,0.32)' }}
                    >
                      <Send className="h-4 w-4" />
                      {c.send}
                    </button>
                  </form>
                )}
              </div>

              {/* Info sidebar */}
              <div
                className={`flex flex-col justify-center gap-7 p-8 md:p-12 ${isArabic ? 'text-right' : 'text-left'}`}
                style={{
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
                  borderInlineStart: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {/* Email */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{c.emailUs}</p>
                  <a
                    href="mailto:laam.ai.team@gmail.com"
                    className="mt-2 inline-block text-base font-semibold transition hover:underline"
                    style={{ color: '#18a078' }}
                  >
                    laam.ai.team@gmail.com
                  </a>
                </div>

                <div className="h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                {/* Twitter */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{c.followUs}</p>
                  <Link
                    href="https://x.com/laam_sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold transition hover:underline"
                    style={{ color: '#18a078' }}
                  >
                    {/* X (Twitter) logo */}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @laam_sa
                  </Link>
                </div>

                <div className="h-px" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                {/* GP badge */}
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: isDark ? 'rgba(24,160,120,0.08)' : 'rgba(24,160,120,0.06)', border: '1px solid rgba(24,160,120,0.18)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#18a078' }}>
                    {isArabic ? 'مشروع تخرج' : 'Graduation Project'}
                  </p>
                  <p
                    className={`mt-3 text-3xl font-bold ${isArabic ? `${xbShafigh.className}` : 'display-heading'}`}
                    style={{ color: '#18a078' }}
                  >
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
