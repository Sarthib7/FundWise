import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Legal · FundWise",
  description:
    "Privacy Policy, Terms of Service, and Disclosures for FundWise. Draft documents pending legal review.",
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          <strong className="font-semibold">Draft v0 — pending legal review.</strong> These pages
          describe how FundWise intends to operate but have not been reviewed by counsel and are not
          yet binding. Final terms will be published before the mainnet public launch. Send
          questions to{" "}
          <a href="https://t.me/funddotsol" className="underline" target="_blank" rel="noopener noreferrer">
            our Telegram
          </a>
          .
        </div>
        <article className="prose prose-neutral max-w-none dark:prose-invert">{children}</article>
      </main>
      <Footer />
    </div>
  )
}
