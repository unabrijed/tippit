import type { Metadata, Viewport } from "next";
import { DM_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono"
});

const siteTitle = "Tippit";
const siteDescription = "Private Solana tip links with Umbra-powered checkout.";

export const metadata: Metadata = {
  applicationName: siteTitle,
  title: {
    default: siteTitle,
    template: `%s · ${siteTitle}`
  },
  description: siteDescription,
  keywords: ["Tippit", "Solana Pay", "Solana tips", "USDC tip links", "crypto tips", "privacy-first checkout"],
  authors: [{ name: "Tippit" }],
  creator: "Tippit",
  publisher: "Tippit",
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
  themeColor: "#FAFBFE"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable}`}>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
