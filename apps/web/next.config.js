/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

function buildCSP() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const parts = [
    "default-src 'self'",
    "base-uri 'self'",
    isDev ? 'frame-ancestors *' : "frame-ancestors 'none'",
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com"
      : "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    isDev
      ? "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
      : "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    isDev ? "img-src 'self' data: https:" : "img-src 'self' data: https:",
  ];
  const connect = ["connect-src 'self' https://*.ingest.sentry.io"];
  if (isDev) connect.push('ws:', 'wss:', 'blob:');
  if (apiUrl) connect.push(apiUrl);
  parts.push(connect.join(' '));
  if (!isDev) parts.push('upgrade-insecure-requests');
  return parts.join('; ') + ';';
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'lib', 'hooks', 'state', 'styles', 'types', '.'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // In dev, allow embedding in iframes (Builder preview); in prod, keep strict settings
          ...(isDev ? [] : [{ key: 'X-Frame-Options', value: 'DENY' }]),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: buildCSP() },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
