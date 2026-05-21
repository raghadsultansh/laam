import './globals.css';
import { AppPreferencesProvider } from '@/components/providers/AppPreferencesProvider';
import { ibmPlexSans, ibmPlexSansArabic, lora, xbShafigh } from '@/lib/fonts';

export const metadata = {
  title: 'LAAM – AI for Financial Reports | لامّ للتقارير المالية',
  description: 'Understand annual financial reports without reading every page. Ask questions, extract insights, and explore dashboards in one workspace.',
  icons: {
    icon: [
      { url: '/brand/GP logo light english name vertical.svg', media: '(prefers-color-scheme: light)' },
      { url: '/brand/GP logo dark english name vertical.svg',  media: '(prefers-color-scheme: dark)'  },
    ],
  },
  openGraph: {
    title: 'LAAM – AI for Financial Reports | لامّ للتقارير المالية',
    description: 'Understand annual financial reports without reading every page. Ask questions, extract insights, and explore dashboards.',
    url: 'https://laam.sa',
    siteName: 'LAAM',
    images: [
      {
        url: '/og-image.png',
        width: 1512,
        height: 762,
        alt: 'LAAM – AI platform for annual financial reports',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAAM – AI for Financial Reports',
    description: 'Ask questions about annual financial reports and get source-backed answers in seconds.',
    images: ['/og-image.png'],
  },
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
