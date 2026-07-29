import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/json-ld";
import { siteConfig } from "@/lib/site-config";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.edition}《${siteConfig.themeZh}》`,
    template: `%s — ${siteConfig.edition}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: siteConfig.orgName,
    title: `${siteConfig.edition}《${siteConfig.themeZh}》`,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.edition}《${siteConfig.themeZh}》`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.edition}《${siteConfig.themeZh}》`,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  viewportFit: "cover",
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.orgName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/images/passion-logo.png`,
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.contactAddress,
    addressLocality: "新竹市",
    addressCountry: "TW",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">
        <JsonLd data={organizationJsonLd} />
        {children}
      </body>
    </html>
  )
}
