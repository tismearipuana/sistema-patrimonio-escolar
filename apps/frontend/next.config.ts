/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignora erros de ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Adiciona o alias para o Webpack
  webpack: (config) => {
    // Garante que o objeto alias exista
    config.resolve.alias = config.resolve.alias || {};
    // Adiciona nosso alias
    config.resolve.alias['@'] = new URL('./src', import.meta.url).pathname;
    return config;
  },
};

export default nextConfig;