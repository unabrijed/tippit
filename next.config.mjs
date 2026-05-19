/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
    optimizePackageImports: [
      "@phosphor-icons/react",
      "framer-motion",
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-base",
      "snarkjs",
      "@umbra-privacy/sdk",
      "@umbra-privacy/web-zk-prover"
    ]
  }
};

export default nextConfig;
