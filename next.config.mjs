import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    // Redirect @umbra-privacy/umbra-codama to our shim so that the four
    // PDA-finder stubs are available for the SDK's deposit subpath bundle,
    // which references functions not yet published in umbra-codama@3.0.0-rc.0.
    // Use exact-match alias ($) so only `import "…/umbra-codama"` is intercepted,
    // not subpath imports like `…/umbra-codama/dist/index.js` (used by the shim).
    config.resolve.alias["@umbra-privacy/umbra-codama$"] = path.resolve(
      __dirname,
      "lib/umbra/umbra-codama-shim.js"
    );

    if (!isServer) {
      // The SDK's burn and deposit modules reference Node built-ins (fs, path, etc.)
      // in code paths that are never reached in the browser. Tell webpack to provide
      // empty stubs so the client bundle compiles without errors.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    return config;
  },
  compress: true,
  poweredByHeader: false,
  // Prevent snarkjs / ZK prover / Umbra SDK from being bundled server-side.
  // These packages use WebAssembly, web workers, and browser-only APIs that
  // crash in a Node.js context. They are always imported dynamically on the
  // client side only (lib/umbra/browser.ts), so marking them external is safe.
  experimental: {
    typedRoutes: false,
    // Prevent snarkjs / ZK prover / Umbra SDK from being bundled server-side.
    // These packages use WebAssembly, web workers, and browser-only APIs that
    // crash in a Node.js context. They are always imported dynamically on the
    // client side only (lib/umbra/browser.ts), so marking them external is safe.
    serverComponentsExternalPackages: [
      "snarkjs",
      "ffjavascript",
      "@umbra-privacy/sdk",
      "@umbra-privacy/web-zk-prover"
    ],
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
