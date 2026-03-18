// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TuTienda Chords Pro',
    short_name: 'TuChords',
    description: 'Lienzo profesional para compositores y músicos.',
    start_url: '/editor', // Fundamental: donde arranca la app offline
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192x192.png', // Tienes que crear estas imágenes en /public
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}