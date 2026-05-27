import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Aura Finance AI',
    short_name: 'Aura Finance',
    description: 'Premium AI-Powered Financial Analysis & Savings Planner',
    start_url: '/',
    display: 'standalone',
    background_color: '#080710',
    theme_color: '#0a0a14',
    icons: [
      {
        src: '/LOGO.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  }
}
