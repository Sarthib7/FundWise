import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

// FundFlow - Privacy-First Group Fundraising on Solana
// Built with Next.js, Solana, and modern web technologies

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans"
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
})

export const metadata: Metadata = {
  title: "FundFlow - Privacy-First Group Fundraising on Solana",
  description:
    "Create fundraising groups, share codes, and collect funds together. Built on Solana with ZK compression for complete privacy.",
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
