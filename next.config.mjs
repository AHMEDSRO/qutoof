/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Next.js can't trace the dynamically-built fs paths used by @react-pdf/renderer
  // (Font.register/Image with process.cwd()-joined paths) — without this, the
  // invoice route works in dev but 500s on Vercel because the font/logo never
  // ship with the serverless function bundle.
  outputFileTracingIncludes: {
    '/api/orders/[id]/invoice': ['./public/fonts/**', './public/logo.jpg'],
  },
};

export default nextConfig;
