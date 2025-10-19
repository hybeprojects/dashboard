/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Security policies
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: (() => {
              const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
              const parts = [
                "default-src 'self'",
                "base-uri 'self'",
                "frame-ancestors 'none'",
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data:",
              ];
              const connect = ["connect-src 'self'"];
              if (supabase) connect.push(supabase);
              if (apiUrl) connect.push(apiUrl);
              parts.push(connect.join(' '));
              return parts.join('; ') + ';';
            })(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
