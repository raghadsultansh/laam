import { IBM_Plex_Sans, Lora } from 'next/font/google';
import localFont from 'next/font/local';

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
});

export const ibmPlexSansArabic = localFont({
  src: [
    { path: '../assets/fonts/IBMPlexSansArabic-Light.ttf', weight: '300' },
    { path: '../assets/fonts/IBMPlexSansArabic-Regular.ttf', weight: '400' },
    { path: '../assets/fonts/IBMPlexSansArabic-Medium.ttf', weight: '500' },
    { path: '../assets/fonts/IBMPlexSansArabic-SemiBold.ttf', weight: '600' },
    { path: '../assets/fonts/IBMPlexSansArabic-Bold.ttf', weight: '700' },
  ],
  variable: '--font-ibm-plex-sans-arabic',
  display: 'swap',
});

export const xbShafigh = localFont({
  src: [
    { path: '../assets/fonts/XB Shafigh.ttf', weight: '400' },
    { path: '../assets/fonts/XB_ShafighBd.ttf', weight: '700' },
  ],
  variable: '--font-xb-shafigh',
  display: 'swap',
});
