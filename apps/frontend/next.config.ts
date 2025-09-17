/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ATENÇÃO: Isso permite que o build de produção seja concluído
    // mesmo que seu projeto tenha erros de ESLint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;