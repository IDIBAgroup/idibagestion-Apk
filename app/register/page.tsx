'use client';

import { RegisterPage } from '@/views/RegisterPage';
import { ProtectedRoute } from '@/components/guards';

export default function Page() {
  return (
    <ProtectedRoute>
      <RegisterPage />
    </ProtectedRoute>
  );
}
