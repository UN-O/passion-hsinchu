import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "2026 Passion Camp",
  description: "2026 Passion Camp",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={cn("font-sans", inter.variable)}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
