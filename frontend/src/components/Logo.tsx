'use client';

import Image from 'next/image';
import { useAppPreferences } from '@/components/providers/AppPreferencesProvider';

export function Logo({ 
  className = '', 
  priority = true,
  vertical = false,
  compact = false
}: { 
  className?: string;
  priority?: boolean;
  vertical?: boolean;
  compact?: boolean;
}) {
  const { theme, locale, mounted } = useAppPreferences();
  const isArabic = locale === 'ar';

  if (!mounted) {
    return null;
  }

  // Central logo picker. Use this when adding LAAM branding to new pages.
  // File names are based on the theme they belong to, not the color of the logo.
  let logoPath = '';
  let alt = 'LAAM Logo';

  if (vertical) {
    // Vertical logo for collapsed sidebar
    logoPath = theme === 'dark' 
      ? '/brand/GP logo dark english name vertical.svg'
      : '/brand/GP logo light english name vertical.svg';
    
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <Image
          src={logoPath}
          alt={alt}
          height={64}
          width={64}
          className="object-contain"
          priority={priority}
        />
      </div>
    );
  }

  // Horizontal logo - use same logic as Navbar
  const textPosition = isArabic ? 'text right' : 'text left';
  logoPath = theme === 'dark' 
    ? `/brand/GP logo dark english name horizontal ${textPosition}.svg`
    : `/brand/GP logo light english name horizontal ${textPosition}.svg`;
  
  if (compact) {
    // Small horizontal logo for expanded sidebar header
    return (
      <div className={`relative flex items-center h-6 w-auto ${className}`}>
        <Image
          src={logoPath}
          alt={alt}
          height={20}
          width={90}
          className="object-contain"
          priority={priority}
        />
      </div>
    );
  }

  // Full horizontal logo
  return (
    <div className={`relative w-full ${className}`}>
      <Image
        src={logoPath}
        alt={alt}
        height={48}
        width={280}
        className="object-contain"
        priority={priority}
      />
    </div>
  );
}
