import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  env: { BPMN_WEB_ROOT: __dirname },
};

export default nextConfig;