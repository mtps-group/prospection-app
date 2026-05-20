/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/prospects',
        destination: '/crm',
        permanent: true,
      },
      {
        source: '/prospects/:path*',
        destination: '/crm/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
