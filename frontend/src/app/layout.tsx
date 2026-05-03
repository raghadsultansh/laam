import './globals.css';
import { AppPreferencesProvider } from '@/components/providers/AppPreferencesProvider';
import { ibmPlexSans, ibmPlexSansArabic, lora, xbShafigh } from '@/lib/fonts';

export const metadata = {
  title: 'LAAM – AI for Financial Reports | لامّ للتقارير المالية',
  description: 'AI-powered platform for reading and analysing Saudi IFRS financial reports. Ask questions, extract insights, and explore dashboards — without reading hundreds of pages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${xbShafigh.variable} ${ibmPlexSansArabic.variable} ${ibmPlexSans.variable} ${lora.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}>
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}
