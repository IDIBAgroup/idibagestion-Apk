import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'IDIBAGES',
    short_name: 'IDIBAGES',
    description: 'Plateforme de gestion et de pilotage d’entreprise.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#081C2D',
    theme_color: '#081C2D',
    icons: [
      { src: '/pwa/icon.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/pwa/icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
