/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5000/:path*' },
      { source: '/accounts/:path*', destination: 'http://localhost:5000/accounts/:path*' },
      { source: '/accounts', destination: 'http://localhost:5000/accounts' },
      { source: '/transactions/:path*', destination: 'http://localhost:5000/transactions/:path*' },
      { source: '/transactions', destination: 'http://localhost:5000/transactions' },
      { source: '/transfer/:path*', destination: 'http://localhost:5000/transfer/:path*' },
      { source: '/transfer', destination: 'http://localhost:5000/transfer' },
      { source: '/auth/:path*', destination: 'http://localhost:5000/auth/:path*' },
      { source: '/auth', destination: 'http://localhost:5000/auth' },
      { source: '/notifications/:path*', destination: 'http://localhost:5000/notifications/:path*' },
      { source: '/notifications', destination: 'http://localhost:5000/notifications' },
      { source: '/kyc/:path*', destination: 'http://localhost:5000/kyc/:path*' },
      { source: '/kyc', destination: 'http://localhost:5000/kyc' },
    ];
  },
};
module.exports = nextConfig;
