import Image from "next/image"
import { Bot, Github, Send } from "lucide-react"

const FUNDY_TELEGRAM_URL = "https://t.me/fundyonSol_bot"
const FUNDY_REPO_URL = "https://github.com/Fund-labs/Fundy"

export function AgentSection() {
  return (
    <section id="agent" className="scroll-mt-36 px-4 py-16 sm:px-6 lg:px-[max(24px,calc(50%-660px))]">
      <div className="flex flex-col gap-5 rounded-[22px] border border-brand-border-c bg-brand-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-brand-border-c bg-background text-brand-deep">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-mid">FundWise Agent</div>
            <h2 className="font-serif text-2xl tracking-tight text-foreground">Fundy on Telegram</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-brand-text-2">
              Chat with <span className="font-semibold text-foreground">fundy</span> at <span className="font-semibold text-foreground">@fundyonSol_bot</span>, or scan the QR to open the bot.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={FUNDY_TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Open Fundy on Telegram"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                t.me/@fundyonSol_bot
              </a>
              <a
                href={FUNDY_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-border-c bg-background px-4 text-sm font-semibold text-brand-text-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                Fundy repo
              </a>
            </div>
          </div>
        </div>

        <a
          href={FUNDY_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto block w-36 shrink-0 rounded-[16px] border border-brand-border-c bg-background p-2 transition-colors hover:border-brand-border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:mx-0"
          aria-label="Scan or open Fundy on Telegram"
        >
          <Image
            src="/fundy-telegram-qr.svg"
            width={144}
            height={144}
            alt="QR code to open Fundy on Telegram at @fundyonSol_bot"
            className="aspect-square w-full rounded-[10px]"
          />
        </a>
      </div>
    </section>
  )
}
