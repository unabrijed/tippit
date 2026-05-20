/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  // Prevent snarkjs / ZK prover / Umbra SDK from being bundled server-side.
  // These packages use WebAssembly, web workers, and browser-only APIs that
  // crash in a Node.js context. They are always imported dynamically on the
  // client side only (lib/umbra/browser.ts), so marking them external is safe.
  serverExternalPackages: [
    "snarkjs",
    "ffjavascript",
    "@umbra-privacy/sdk",
    "@umbra-privacy/web-zk-prover"
  ],
  experimental: {
    typedRoutes: false,
    // Only include packages suitable for static import analysis here.
    // Do NOT add WebAssembly / web-worker packages (snarkjs, umbra) — they are
    // dynamically imported client-side and must not be statically analysed.
    optimizePackageImports: [
      "@phosphor-icons/react",
      "framer-motion",
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-base"
    ]
  }
};

export default nextConfig;
