'use client';

import { LoginPage } from '@/views/LoginPage';
import { RedirectIfAuth } from '@/components/guards';

export default function Page() {
  return (
    <RedirectIfAuth>
      <LoginPage />
    </RedirectIfAuth>
  );
}
