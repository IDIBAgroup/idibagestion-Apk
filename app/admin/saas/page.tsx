'use client';

import { AdminDashboardPage } from '@/views/AdminDashboardPage';
import { AdminRoute } from '@/components/guards';

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboardPage />
    </AdminRoute>
  );
}
