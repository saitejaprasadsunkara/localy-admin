import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../src/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://localy.me'), // Add your actual domain here
  
  title: {
    default: "Localy Admin Panel",
    template: "%s | Localy Admin",
  },
  description:
    "Admin panel for Localy - Manage sellers, drivers, and delivery agents. Streamline verification and approval processes.",
  keywords: [
    "Localy",
    "Admin Panel",
    "Seller Management",
    "Driver Verification",
    "Delivery Agent Management",
  ],
  authors: [{ name: "Localy Team" }],
  creator: "Localy",
  publisher: "Localy",
  applicationName: "Localy Admin Panel",

  // Icons and Favicons
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },

  // Apple Web App
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Localy Admin",
  },

  // Open Graph (for social media sharing)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://localy.me", // Replace with your actual domain
    siteName: "Localy Admin Panel",
    title: "Localy Admin Panel",
    description:
      "Admin panel for Localy - Manage sellers, drivers, and delivery agents",
    images: [
      {
        url: "/og-image.png", // 1200x630px recommended
        width: 1200,
        height: 630,
        alt: "Localy Admin Panel",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Localy Admin Panel",
    description:
      "Admin panel for Localy - Manage sellers, drivers, and delivery agents",
    images: ["/og-image.png"],
    creator: "@localy", // Replace with your Twitter handle
  },

  // Additional metadata
  robots: {
    index: false, // Don't index admin panel in search engines
    follow: false,
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
