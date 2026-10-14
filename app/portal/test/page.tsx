'use client';

import dynamic from 'next/dynamic';
import { PortalUnavailable } from '@/components/guards';

const TestPage =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/views/TestPage').then((m) => m.TestPage), { ssr: false })
    : null;

export default function Page() {
  return TestPage ? <TestPage /> : <PortalUnavailable />;
}
