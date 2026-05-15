import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, DM_Serif_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "FundWise - Shared expenses for real Groups",
  description:
    "Start private Groups, track shared Expenses, resolve live Balances, and settle up with clear Receipts everyone can trust.",
  generator: "Next.js",
  applicationName: "FundWise",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FundWise",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/brand-strata/svg/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#1A9151",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${dmSerif.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
