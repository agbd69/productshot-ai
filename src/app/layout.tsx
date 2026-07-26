import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://productshot.ai";
const OG_IMAGE = `${APP_URL}/og.png`;

export const metadata: Metadata = {
  title: "ProductShot.ai — AI Product Photos for E-commerce",
  description:
    "Upload one product photo, get studio-quality white-bg, lifestyle, festival, model-on, and detail-page shots. Built for Amazon, Shopify, TikTok Shop, and Temu sellers. $0.07 / image at the Pro tier.",
  keywords: [
    "AI product photo",
    "product image generator",
    "white background",
    "Amazon main image",
    "Shopify product photo",
    "TikTok Shop image",
    "e-commerce AI",
  ],
  openGraph: {
    title: "ProductShot.ai — AI Product Photos",
    description:
      "Studio-quality AI product photos for overseas e-commerce merchants. One upload, five scenes, every platform spec. $0.07 / image.",
    siteName: "ProductShot.ai",
    type: "website",
    url: APP_URL,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "ProductShot.ai — AI Product Photos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProductShot.ai — AI Product Photos",
    description: "Studio-quality AI product photos for overseas e-commerce. $0.07 / image.",
    images: [OG_IMAGE],
  },
  icons: {
    icon: "/favicon.svg",
  },
  alternates: { canonical: APP_URL },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html className="h-full antialiased" data-scroll-behavior="smooth" lang="en">
        <head>
          {/* Plausible Analytics — privacy-friendly, no cookies, GDPR compliant.
              Sign up at https://plausible.io and set NEXT_PUBLIC_PLAUSIBLE_DOMAIN
              in Vercel env to activate. The data-domain below is a placeholder. */}
          {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
            <script
              async
              defer
              data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
              src="https://plausible.io/js/script.js"
            />
          ) : null}
        </head>
        <body className="min-h-full">
          <div className="noise-overlay" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
