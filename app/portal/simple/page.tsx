'use client';

import dynamic from 'next/dynamic';
import { PortalUnavailable } from '@/components/guards';

const SimplePortalPage =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/views/SimplePortalPage').then((m) => m.SimplePortalPage), { ssr: false })
    : null;

export default function Page() {
  return SimplePortalPage ? <SimplePortalPage /> : <PortalUnavailable />;
}
