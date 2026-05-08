'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { listSessions } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      const sessions = await listSessions().catch(() => []);
      if (sessions.length > 0) {
        router.replace(`/workspace/${sessions[0].id}`);
      } else {
        router.replace('/reports');
      }
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
    </div>
  );
}
