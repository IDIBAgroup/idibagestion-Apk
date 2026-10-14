'use client';

import dynamic from 'next/dynamic';
import { PortalUnavailable } from '@/components/guards';

const ClientPortalPage =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/views/ClientPortalPage').then((m) => m.ClientPortalPage), { ssr: false })
    : null;

export default function Page() {
  return ClientPortalPage ? <ClientPortalPage /> : <PortalUnavailable />;
}
