import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { themeScript } from "@/components/theme";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://get.isworking.dev";
const description =
  "Claim your own name.isworking.eth: a permanent on-chain ENS subname for $0.99 (plus gas). Connect a wallet, pay in ETH or stablecoins, done.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "get.isworking.dev: your name.isworking.eth", template: "%s · get.isworking.dev" },
  description,
  applicationName: "get.isworking.dev",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "get.isworking.dev",
    title: "Get your name.isworking.eth",
    description,
  },
  twitter: { card: "summary_large_image", title: "Get your name.isworking.eth", description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eff1f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e2e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
