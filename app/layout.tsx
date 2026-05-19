import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display"
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans"
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono"
});

const siteTitle = "GhostPay";
const siteDescription = "Private-feeling Solana payment links with a refined merchant and checkout flow.";

export const metadata: Metadata = {
  applicationName: siteTitle,
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`
  },
  description: siteDescription,
  keywords: [
    "GhostPay",
    "Solana Pay",
    "Solana payments",
    "USDC payment links",
    "crypto checkout",
    "privacy-first payments"
  ],
  authors: [{ name: "GhostPay" }],
  creator: "GhostPay",
  publisher: "GhostPay",
  category: "finance",
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "32x32" },
      { url: "/icon", type: "image/png", sizes: "192x192" }
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon"]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: siteTitle,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteTitle
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EF" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1917" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable} ${mono.variable}`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
