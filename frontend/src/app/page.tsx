'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { FeaturedCompaniesSection } from '@/components/landing/FeaturedCompaniesSection';
import { FinanceBackground } from '@/components/landing/FinanceBackground';
import { FooterSection } from '@/components/landing/FooterSection';
import { Navbar } from '@/components/layout/Navbar';

export default function Home() {
  return (
    <main className="landing-shell relative isolate min-h-screen">
      {/* Full-page interactive background. Sections stay above it with their own surfaces. */}
      <FinanceBackground />
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <FeaturedCompaniesSection />
      <FooterSection />
    </main>
  );
}
