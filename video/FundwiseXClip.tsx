import React from "react"
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion"
import {
  ArrowRight,
  Check,
  Link,
  ReceiptText,
  Split,
  WalletCards,
} from "lucide-react"

type Format = "landscape" | "square"

type ClipProps = {
  format: Format
}

const C = {
  ink: "#06150c",
  forest: "#0d6b3a",
  green: "#179452",
  fresh: "#2db870",
  mint: "#dff5e8",
  surface: "#f5faf6",
  line: "#bfdcc8",
  softLine: "#d7eadc",
  muted: "#557260",
  white: "#ffffff",
  warm: "#fff8e8",
}

const SPRING = {
  smooth: { damping: 200 },
  snappy: { damping: 24, stiffness: 220 },
  playful: { damping: 12, stiffness: 140 },
}

const serif = '"DM Serif Display", Georgia, serif'
const sans = '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
const mono = '"Geist Mono", "SFMono-Regular", Consolas, monospace'

const scenes = {
  hook: { from: 0, duration: 120 },
  messy: { from: 120, duration: 150 },
  demo: { from: 270, duration: 180 },
  settle: { from: 450, duration: 210 },
  receipt: { from: 660, duration: 150 },
  cta: { from: 810, duration: 90 },
}

function useSceneFrame() {
  return useCurrentFrame()
}

function entrance(frame: number, delay = 0, distance = 36) {
  const progress = spring({
    frame: frame - delay,
    fps: 30,
    config: SPRING.smooth,
  })

  return {
    opacity: interpolate(progress, [0, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px)`,
  }
}

function sceneFade(localFrame: number, duration: number) {
  return interpolate(localFrame, [0, 18, duration - 18, duration], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  })
}

function Shell({
  children,
  localFrame,
  duration,
  format,
}: {
  children: React.ReactNode
  localFrame: number
  duration: number
  format: Format
}) {
  const pulse = Math.sin((useCurrentFrame() / 30) * 1.4) * 0.5 + 0.5
  const compact = format === "square"

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #fbfefb 0%, #effaf2 42%, #ffffff 100%)",
        opacity: sceneFade(localFrame, duration),
        overflow: "hidden",
        fontFamily: sans,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: compact ? 520 : 720,
          height: compact ? 520 : 720,
          borderRadius: "50%",
          background: `rgba(45, 184, 112, ${0.08 + pulse * 0.04})`,
          filter: "blur(8px)",
          top: compact ? -180 : -240,
          right: compact ? -190 : -220,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: compact ? 420 : 560,
          height: compact ? 420 : 560,
          borderRadius: "50%",
          background: "rgba(255, 248, 232, 0.9)",
          left: compact ? -190 : -230,
          bottom: compact ? -170 : -220,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(13, 107, 58, 0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 107, 58, 0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.45), transparent 68%)",
        }}
      />
      <Header compact={compact} />
      {children}
    </AbsoluteFill>
  )
}

function Header({ compact }: { compact: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: compact ? 42 : 46,
        left: compact ? 52 : 72,
        right: compact ? 52 : 72,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 3,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Img
          src={staticFile("brand-strata/svg/mark-gradient.svg")}
          style={{ width: compact ? 42 : 52, height: compact ? 42 : 52 }}
        />
        <div
          style={{
            color: C.ink,
            fontFamily: serif,
            fontSize: compact ? 30 : 38,
            lineHeight: 1,
          }}
        >
          FundWise
        </div>
      </div>
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 999,
          color: C.forest,
          background: "rgba(255,255,255,0.72)",
          fontWeight: 700,
          padding: compact ? "10px 18px" : "12px 22px",
          fontSize: compact ? 18 : 22,
        }}
      >
        fundwise.fun
      </div>
    </div>
  )
}

function Pill({
  children,
  delay = 0,
  tone = "green",
  x = 0,
  y = 0,
  rotate = 0,
}: {
  children: React.ReactNode
  delay?: number
  tone?: "green" | "warm" | "white"
  x?: number
  y?: number
  rotate?: number
}) {
  const frame = useCurrentFrame()
  const progress = spring({ frame: frame - delay, fps: 30, config: SPRING.playful })
  const toneMap = {
    green: { bg: C.mint, border: C.line, color: C.forest },
    warm: { bg: C.warm, border: "#ead9a8", color: "#785b11" },
    white: { bg: C.white, border: C.softLine, color: C.ink },
  }
  const t = toneMap[tone]

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `rotate(${rotate}deg) scale(${progress})`,
        opacity: interpolate(progress, [0, 1], [0, 1], {
          extrapolateRight: "clamp",
        }),
        padding: "14px 22px",
        borderRadius: 999,
        border: `1px solid ${t.border}`,
        background: t.bg,
        color: t.color,
        fontSize: 24,
        fontWeight: 800,
        boxShadow: "0 16px 38px rgba(13, 107, 58, 0.12)",
      }}
    >
      {children}
    </div>
  )
}

function HookScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"
  const title = entrance(localFrame, 8, 52)
  const sub = entrance(localFrame, 30, 32)

  return (
    <Shell localFrame={localFrame} duration={scenes.hook.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 70 : 150,
          right: compact ? 70 : 150,
          top: compact ? 220 : 250,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...title,
            fontFamily: serif,
            fontSize: compact ? 92 : 118,
            lineHeight: 0.96,
            color: C.ink,
          }}
        >
          someone still owes you from that trip?
        </div>
        <div
          style={{
            ...sub,
            color: C.muted,
            fontSize: compact ? 34 : 40,
            lineHeight: 1.35,
            marginTop: 34,
          }}
        >
          FundWise turns friend-group IOUs into clean Settlements.
        </div>
      </div>
      <Pill delay={40} x={compact ? 94 : 210} y={compact ? 720 : 780} rotate={-4}>
        Lisbon Trip
      </Pill>
      <Pill
        delay={48}
        x={compact ? 390 : 620}
        y={compact ? 770 : 820}
        tone="warm"
        rotate={3}
      >
        Priya's Gift
      </Pill>
      <Pill
        delay={56}
        x={compact ? 710 : 1030}
        y={compact ? 720 : 780}
        tone="white"
        rotate={-2}
      >
        Flatmates
      </Pill>
      {!compact && (
        <Pill delay={64} x={1370} y={820} tone="green" rotate={5}>
          Berlin Conf
        </Pill>
      )}
    </Shell>
  )
}

function MessyScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"
  const headline = entrance(localFrame, 0, 34)
  const cards = [
    { text: "“who paid for dinner?”", x: compact ? 110 : 260, y: compact ? 440 : 450, r: -4 },
    { text: "“wait, I sent my share”", x: compact ? 340 : 710, y: compact ? 540 : 560, r: 3 },
    { text: "“can someone check the sheet?”", x: compact ? 185 : 1080, y: compact ? 655 : 440, r: -2 },
  ]

  return (
    <Shell localFrame={localFrame} duration={scenes.messy.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 80 : 140,
          top: compact ? 220 : 220,
          width: compact ? 920 : 760,
        }}
      >
        <div
          style={{
            ...headline,
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 72 : 88,
            lineHeight: 0.98,
          }}
        >
          the spreadsheet knows.
          <br />
          the group chat knows.
        </div>
        <div
          style={{
            ...entrance(localFrame, 20, 26),
            fontSize: compact ? 34 : 38,
            lineHeight: 1.3,
            color: C.muted,
            marginTop: 26,
          }}
        >
          nobody wants the awkward follow-up.
        </div>
      </div>

      {cards.map((card, index) => {
        const progress = spring({
          frame: localFrame - 34 - index * 10,
          fps: 30,
          config: SPRING.playful,
        })
        const settle = spring({
          frame: localFrame - 104,
          fps: 30,
          config: SPRING.smooth,
        })
        return (
          <div
            key={card.text}
            style={{
              position: "absolute",
              left: card.x,
              top: card.y,
              width: compact ? 560 : 520,
              padding: "26px 30px",
              borderRadius: 24,
              background: C.white,
              border: `1px solid ${C.softLine}`,
              color: C.ink,
              fontSize: compact ? 30 : 32,
              fontWeight: 800,
              boxShadow: "0 22px 70px rgba(6, 21, 12, 0.12)",
              transform: `rotate(${interpolate(
                settle,
                [0, 1],
                [card.r, 0],
              )}deg) scale(${progress}) translateY(${interpolate(settle, [0, 1], [0, compact ? -28 : -22])}px)`,
              opacity: interpolate(progress, [0, 1], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            {card.text}
          </div>
        )
      })}

      <CleanLedger localFrame={localFrame} compact={compact} />
    </Shell>
  )
}

function CleanLedger({ localFrame, compact }: { localFrame: number; compact: boolean }) {
  const progress = spring({ frame: localFrame - 110, fps: 30, config: SPRING.smooth })
  return (
    <div
      style={{
        position: "absolute",
        right: compact ? 95 : 170,
        bottom: compact ? 90 : 120,
        width: compact ? 820 : 580,
        borderRadius: 28,
        background: C.surface,
        border: `1px solid ${C.line}`,
        padding: 32,
        boxShadow: "0 28px 90px rgba(13, 107, 58, 0.14)",
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(progress, [0, 1], [46, 0])}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Split color={C.green} size={compact ? 34 : 30} />
        <div style={{ color: C.ink, fontWeight: 900, fontSize: compact ? 34 : 30 }}>
          clean Group ledger
        </div>
      </div>
      <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
        {["Dinner split", "Airbnb share", "One suggested Settlement"].map((item, i) => (
          <div
            key={item}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: compact ? "16px 18px" : "14px 16px",
              borderRadius: 16,
              background: C.white,
              border: `1px solid ${C.softLine}`,
              color: C.muted,
              fontSize: compact ? 25 : 22,
              fontWeight: 700,
            }}
          >
            <span>{item}</span>
            <Check color={C.green} size={compact ? 28 : 24} />
          </div>
        ))}
      </div>
    </div>
  )
}

function DemoScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"
  const items = [
    { icon: Link, title: "Private Groups", text: "Trips, dinners, gifts, flatmates." },
    { icon: Split, title: "Shared Expenses", text: "Log what happened, not a novel." },
    { icon: ArrowRight, title: "Exact Settlements", text: "The app shows the next clean move." },
  ]

  return (
    <Shell localFrame={localFrame} duration={scenes.demo.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 78 : 130,
          top: compact ? 190 : 190,
          right: compact ? 78 : 130,
        }}
      >
        <div
          style={{
            ...entrance(localFrame, 0),
            fontFamily: serif,
            fontSize: compact ? 78 : 98,
            lineHeight: 0.98,
            color: C.ink,
          }}
        >
          make a Group.
          <br />
          log the Expense.
          <br />
          see who owes what.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: compact ? 78 : 130,
          right: compact ? 78 : 130,
          bottom: compact ? 88 : 125,
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "repeat(3, 1fr)",
          gap: compact ? 18 : 28,
        }}
      >
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              style={{
                ...entrance(localFrame, 30 + index * 12, 28),
                minHeight: compact ? 146 : 250,
                borderRadius: 26,
                padding: compact ? 26 : 32,
                border: `1px solid ${C.line}`,
                background: "rgba(255,255,255,0.82)",
                boxShadow: "0 24px 70px rgba(13, 107, 58, 0.1)",
              }}
            >
              <div
                style={{
                  width: compact ? 52 : 60,
                  height: compact ? 52 : 60,
                  borderRadius: 16,
                  background: C.mint,
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon color={C.green} size={compact ? 28 : 32} />
              </div>
              <div
                style={{
                  marginTop: compact ? 16 : 28,
                  fontSize: compact ? 31 : 34,
                  fontWeight: 900,
                  color: C.ink,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: compact ? 23 : 25,
                  lineHeight: 1.25,
                  color: C.muted,
                }}
              >
                {item.text}
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

function SettleScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"
  const buttonProgress = spring({
    frame: localFrame - 56,
    fps: 30,
    config: SPRING.snappy,
  })

  return (
    <Shell localFrame={localFrame} duration={scenes.settle.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 80 : 150,
          top: compact ? 190 : 230,
          width: compact ? 900 : 720,
        }}
      >
        <div
          style={{
            ...entrance(localFrame, 0),
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 84 : 104,
            lineHeight: 0.96,
          }}
        >
          then settle the exact amount.
        </div>
        <div
          style={{
            ...entrance(localFrame, 22),
            color: C.muted,
            fontSize: compact ? 32 : 38,
            lineHeight: 1.3,
            marginTop: 28,
          }}
        >
          USDC Settlement. Wallet confirmed. SOL only for gas.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: compact ? 80 : 190,
          bottom: compact ? 105 : 140,
          width: compact ? 820 : 600,
          borderRadius: 34,
          border: `1px solid ${C.line}`,
          background: C.white,
          padding: compact ? 34 : 38,
          boxShadow: "0 34px 100px rgba(6, 21, 12, 0.16)",
          ...entrance(localFrame, 28),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 30,
          }}
        >
          <div style={{ color: C.ink, fontSize: compact ? 32 : 31, fontWeight: 900 }}>
            Lisbon Trip
          </div>
          <div
            style={{
              color: C.forest,
              background: C.mint,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: compact ? 22 : 19,
              fontWeight: 800,
            }}
          >
            live Balance
          </div>
        </div>
        <BalanceRow name="You owe Maya" amount="$40.00" compact={compact} />
        <BalanceRow name="Alex owes you" amount="$12.00" quiet compact={compact} />
        <div
          style={{
            marginTop: 28,
            height: compact ? 92 : 82,
            borderRadius: 22,
            background: C.green,
            color: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            fontSize: compact ? 31 : 30,
            fontWeight: 950,
            transform: `scale(${interpolate(buttonProgress, [0, 1], [0.88, 1], {
              extrapolateRight: "clamp",
            })})`,
            boxShadow: "0 22px 54px rgba(13, 107, 58, 0.22)",
          }}
        >
          <WalletCards size={compact ? 34 : 30} />
          Settle $40.00
        </div>
      </div>
    </Shell>
  )
}

function BalanceRow({
  name,
  amount,
  quiet = false,
  compact,
}: {
  name: string
  amount: string
  quiet?: boolean
  compact: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: compact ? "22px 0" : "18px 0",
        borderTop: quiet ? `1px solid ${C.softLine}` : undefined,
        color: quiet ? C.muted : C.ink,
        fontSize: compact ? 30 : 28,
        fontWeight: quiet ? 700 : 900,
      }}
    >
      <span>{name}</span>
      <span>{amount}</span>
    </div>
  )
}

function ReceiptScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"

  return (
    <Shell localFrame={localFrame} duration={scenes.receipt.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 80 : 150,
          right: compact ? 80 : 150,
          top: compact ? 190 : 220,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...entrance(localFrame, 0),
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 82 : 104,
            lineHeight: 0.98,
          }}
        >
          everyone gets a Receipt.
        </div>
        <div
          style={{
            ...entrance(localFrame, 18),
            marginTop: 26,
            color: C.muted,
            fontSize: compact ? 32 : 38,
          }}
        >
          awkward follow-up: gone.
        </div>
      </div>
      <div
        style={{
          ...entrance(localFrame, 36),
          position: "absolute",
          left: "50%",
          bottom: compact ? 100 : 110,
          width: compact ? 790 : 780,
          transform: `${entrance(localFrame, 36).transform} translateX(-50%)`,
          borderRadius: 34,
          border: `1px solid ${C.line}`,
          background: C.white,
          padding: compact ? 34 : 40,
          boxShadow: "0 34px 100px rgba(6, 21, 12, 0.16)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 18,
              background: C.mint,
              border: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReceiptText color={C.green} size={34} />
          </div>
          <div>
            <div style={{ color: C.ink, fontWeight: 950, fontSize: compact ? 34 : 32 }}>
              Settlement Receipt
            </div>
            <div style={{ color: C.muted, fontSize: compact ? 24 : 22, marginTop: 3 }}>
              USDC transfer confirmed
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
          <ReceiptLine label="Amount" value="$40.00 USDC" compact={compact} />
          <ReceiptLine label="From" value="You" compact={compact} />
          <ReceiptLine label="To" value="Maya" compact={compact} />
          <ReceiptLine label="Signature" value="8n3...Qp9" mono compact={compact} />
        </div>
      </div>
    </Shell>
  )
}

function ReceiptLine({
  label,
  value,
  mono: useMono = false,
  compact,
}: {
  label: string
  value: string
  mono?: boolean
  compact: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderTop: `1px solid ${C.softLine}`,
        paddingTop: 14,
        fontSize: compact ? 26 : 24,
      }}
    >
      <span style={{ color: C.muted, fontWeight: 700 }}>{label}</span>
      <span
        style={{
          color: C.ink,
          fontWeight: 900,
          fontFamily: useMono ? mono : sans,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function CtaScene({ format }: { format: Format }) {
  const localFrame = useSceneFrame()
  const compact = format === "square"
  const logoProgress = spring({
    frame: localFrame - 8,
    fps: 30,
    config: SPRING.playful,
  })

  return (
    <Shell localFrame={localFrame} duration={scenes.cta.duration} format={format}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: compact ? 70 : 90,
          textAlign: "center",
        }}
      >
        <Img
          src={staticFile("brand-strata/svg/mark-gradient.svg")}
          style={{
            width: compact ? 110 : 128,
            height: compact ? 110 : 128,
            transform: `scale(${logoProgress})`,
          }}
        />
        <div
          style={{
            ...entrance(localFrame, 24),
            marginTop: 38,
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 84 : 110,
            lineHeight: 0.95,
          }}
        >
          Group money,
          <br />
          done right.
        </div>
        <div
          style={{
            ...entrance(localFrame, 42),
            marginTop: 36,
            color: C.forest,
            fontSize: compact ? 38 : 44,
            fontWeight: 950,
          }}
        >
          fundwise.fun
        </div>
      </div>
    </Shell>
  )
}

export const FundwiseXClip: React.FC<ClipProps> = ({ format }) => {
  return (
    <AbsoluteFill style={{ background: C.surface }}>
      <Sequence from={scenes.hook.from} durationInFrames={scenes.hook.duration}>
        <HookScene format={format} />
      </Sequence>
      <Sequence from={scenes.messy.from} durationInFrames={scenes.messy.duration}>
        <MessyScene format={format} />
      </Sequence>
      <Sequence from={scenes.demo.from} durationInFrames={scenes.demo.duration}>
        <DemoScene format={format} />
      </Sequence>
      <Sequence from={scenes.settle.from} durationInFrames={scenes.settle.duration}>
        <SettleScene format={format} />
      </Sequence>
      <Sequence from={scenes.receipt.from} durationInFrames={scenes.receipt.duration}>
        <ReceiptScene format={format} />
      </Sequence>
      <Sequence from={scenes.cta.from} durationInFrames={scenes.cta.duration}>
        <CtaScene format={format} />
      </Sequence>
    </AbsoluteFill>
  )
}
