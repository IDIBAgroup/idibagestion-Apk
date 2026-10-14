'use client';

import dynamic from 'next/dynamic';
import { PortalUnavailable } from '@/components/guards';

const VendorPortalPage =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/views/VendorPortalPage').then((m) => m.VendorPortalPage), { ssr: false })
    : null;

export default function Page() {
  return VendorPortalPage ? <VendorPortalPage /> : <PortalUnavailable />;
}
