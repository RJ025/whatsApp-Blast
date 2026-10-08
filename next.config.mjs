/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ['@whiskeysockets/baileys', 'pino', 'pino-pretty', 'pdf-parse'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]),
        '@whiskeysockets/baileys',
        'pino',
        'pino-pretty',
        'pdf-parse',
      ];
    }
    return config;
  },
};

export default nextConfig;
