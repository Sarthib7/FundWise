import type React from "react"
import type { Metadata } from "next"
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
  title: "FundWise — Shared expenses, settled simply.",
  description:
    "Splitwise on Solana. Split expenses with friends, top up from other chains when needed, and settle in USDC. Fund Mode treasury workflows remain a later product layer.",
  generator: "Next.js",
  icons: {
    icon: "/icon.png",
  },
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
