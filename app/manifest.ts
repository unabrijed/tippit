import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tippit",
    short_name: "Tippit",
    description: "Private-first Solana tip links with Umbra-inspired checkout and cleaner supporter flows.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F4EF",
    theme_color: "#2C4A3E",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
