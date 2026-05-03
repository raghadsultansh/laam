'use client';

import { ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
  // Authentication logic here
  return <>{children}</>;
}
