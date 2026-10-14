'use client';

import type { ReactNode } from 'react';
import { AdminRoute } from '@/components/guards';

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminRoute>{children}</AdminRoute>;
}
