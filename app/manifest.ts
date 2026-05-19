import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GhostPay",
    short_name: "GhostPay",
    description: "Private-feeling Solana payment links with a refined merchant and checkout flow.",
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
