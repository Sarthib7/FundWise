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
  blue: "#2a4fa8",
  red: "#d94f43",
  amber: "#f6c84c",
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

function Stamp({
  children,
  delay = 0,
  x,
  y,
  rotate = -8,
  color = C.red,
}: {
  children: React.ReactNode
  delay?: number
  x: number
  y: number
  rotate?: number
  color?: string
}) {
  const frame = useCurrentFrame()
  const progress = spring({ frame: frame - delay, fps: 30, config: SPRING.playful })

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        border: `4px solid ${color}`,
        color,
        borderRadius: 18,
        padding: "12px 22px",
        fontFamily: mono,
        fontSize: 30,
        fontWeight: 950,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        transform: `rotate(${rotate}deg) scale(${progress})`,
        opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        background: "rgba(255,255,255,0.78)",
        boxShadow: "0 18px 42px rgba(217, 79, 67, 0.14)",
      }}
    >
      {children}
    </div>
  )
}

function ChatBubble({
  text,
  delay,
  x,
  y,
  rotate = 0,
  mine = false,
  compact,
}: {
  text: string
  delay: number
  x: number
  y: number
  rotate?: number
  mine?: boolean
  compact: boolean
}) {
  const frame = useCurrentFrame()
  const progress = spring({ frame: frame - delay, fps: 30, config: SPRING.playful })

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        maxWidth: compact ? 620 : 520,
        padding: compact ? "20px 24px" : "22px 26px",
        borderRadius: mine ? "26px 26px 8px 26px" : "26px 26px 26px 8px",
        background: mine ? C.green : C.white,
        border: `1px solid ${mine ? C.green : C.softLine}`,
        color: mine ? C.white : C.ink,
        fontSize: compact ? 28 : 29,
        fontWeight: 850,
        lineHeight: 1.15,
        boxShadow: "0 24px 64px rgba(6, 21, 12, 0.13)",
        opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `rotate(${rotate}deg) scale(${progress})`,
      }}
    >
      {text}
    </div>
  )
}

function ExpenseChip({
  label,
  amount,
  delay,
  x,
  y,
  color,
  compact,
}: {
  label: string
  amount: string
  delay: number
  x: number
  y: number
  color: string
  compact: boolean
}) {
  const frame = useCurrentFrame()
  const inProgress = spring({ frame: frame - delay, fps: 30, config: SPRING.playful })
  const tidy = spring({ frame: frame - 96, fps: 30, config: SPRING.smooth })
  const drift = Math.sin((frame + delay) * 0.045) * 8

  return (
    <div
      style={{
        position: "absolute",
        left: interpolate(tidy, [0, 1], [x, compact ? 132 : 1020]),
        top: interpolate(tidy, [0, 1], [y + drift, compact ? 650 + delay * 1.2 : 330 + delay * 0.9]),
        width: compact ? 290 : 280,
        padding: "18px 20px",
        borderRadius: 22,
        background: C.white,
        border: `2px solid ${color}`,
        boxShadow: "0 22px 58px rgba(6, 21, 12, 0.12)",
        opacity: interpolate(inProgress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${interpolate(inProgress, [0, 1], [0.74, 1], {
          extrapolateRight: "clamp",
        })}) rotate(${interpolate(tidy, [0, 1], [-6 + delay * 0.25, 0])}deg)`,
      }}
    >
      <div style={{ color: C.muted, fontSize: compact ? 22 : 21, fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ color: C.ink, fontSize: compact ? 36 : 34, fontWeight: 950 }}>
        {amount}
      </div>
    </div>
  )
}

function Confetti({ compact }: { compact: boolean }) {
  const frame = useCurrentFrame()
  const pieces = Array.from({ length: 34 }, (_, i) => i)

  return (
    <>
      {pieces.map((i) => {
        const start = 22 + (i % 9) * 2
        const progress = interpolate(frame - start, [0, 64], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
        const colors = [C.green, C.fresh, C.amber, C.blue, C.red]
        const baseX = compact ? 180 + (i * 71) % 740 : 340 + (i * 91) % 1180
        const baseY = compact ? 210 : 170
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: baseX + Math.sin(i) * 34,
              top: baseY + progress * (compact ? 640 : 570),
              width: i % 2 === 0 ? 14 : 22,
              height: i % 2 === 0 ? 32 : 12,
              borderRadius: 4,
              background: colors[i % colors.length],
              opacity: interpolate(progress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
              transform: `rotate(${i * 29 + progress * 290}deg)`,
            }}
          />
        )
      })}
    </>
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
          left: compact ? 70 : 130,
          right: compact ? 70 : 820,
          top: compact ? 170 : 190,
          textAlign: compact ? "center" : "left",
        }}
      >
        <div
          style={{
            ...title,
            fontFamily: serif,
            fontSize: compact ? 92 : 112,
            lineHeight: 0.96,
            color: C.ink,
          }}
        >
          the real trip villain:
          <br />
          the unpaid $47
        </div>
        <div
          style={{
            ...sub,
            color: C.muted,
            fontSize: compact ? 34 : 38,
            lineHeight: 1.35,
            marginTop: 34,
          }}
        >
          Not the airport delay. Not the Airbnb sofa bed. This.
        </div>
      </div>
      <div
        style={{
          ...entrance(localFrame, 28, 42),
          position: "absolute",
          right: compact ? 160 : 160,
          top: compact ? 640 : 230,
          width: compact ? 760 : 610,
          borderRadius: 34,
          background: C.white,
          border: `1px solid ${C.line}`,
          padding: compact ? 34 : 40,
          boxShadow: "0 34px 110px rgba(6, 21, 12, 0.18)",
        }}
      >
        <div style={{ color: C.muted, fontSize: compact ? 28 : 26, fontWeight: 850 }}>
          Lisbon Trip
        </div>
        <div style={{ color: C.red, fontSize: compact ? 120 : 124, fontWeight: 950 }}>
          $47
        </div>
        <div style={{ color: C.ink, fontSize: compact ? 30 : 30, fontWeight: 900 }}>
          still hanging around
        </div>
      </div>
      <Stamp delay={48} x={compact ? 180 : 1180} y={compact ? 870 : 610}>
        3 months later
      </Stamp>
      {!compact && <Stamp delay={62} x={1120} y={755} rotate={6} color={C.blue}>not a vibe</Stamp>}
      <Pill delay={42} x={compact ? 86 : 170} y={compact ? 900 : 820} rotate={-4}>
        Lisbon Trip
      </Pill>
      <Pill
        delay={48}
        x={compact ? 380 : 560}
        y={compact ? 935 : 865}
        tone="warm"
        rotate={3}
      >
        Priya's Gift
      </Pill>
      <Pill
        delay={56}
        x={compact ? 665 : 960}
        y={compact ? 900 : 820}
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

  return (
    <Shell localFrame={localFrame} duration={scenes.messy.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 80 : 140,
          top: compact ? 165 : 185,
          width: compact ? 920 : 690,
        }}
      >
        <div
          style={{
            ...headline,
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 76 : 92,
            lineHeight: 0.98,
          }}
        >
          the group chat
          <br />
          becomes accounting.
        </div>
        <div
          style={{
            ...entrance(localFrame, 20, 26),
            fontSize: compact ? 33 : 37,
            lineHeight: 1.3,
            color: C.muted,
            marginTop: 26,
          }}
        >
          Friendly reminder: nobody joined the trip to audit tapas.
        </div>
      </div>

      <ChatBubble
        text="who still owes for the Airbnb?"
        delay={28}
        x={compact ? 120 : 930}
        y={compact ? 395 : 205}
        rotate={-2}
        compact={compact}
      />
      <ChatBubble
        text="i think dinner was in the sheet?"
        delay={40}
        x={compact ? 300 : 1095}
        y={compact ? 510 : 340}
        rotate={3}
        mine
        compact={compact}
      />
      <ChatBubble
        text="can we not do math in here"
        delay={52}
        x={compact ? 145 : 880}
        y={compact ? 635 : 485}
        rotate={-3}
        compact={compact}
      />
      <ChatBubble
        text="just send the FundWise link"
        delay={76}
        x={compact ? 330 : 1110}
        y={compact ? 760 : 650}
        rotate={2}
        mine
        compact={compact}
      />

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
        bottom: compact ? 70 : 92,
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
          FundWise cleans it up
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
    { icon: Link, title: "Group", text: "Lisbon Trip" },
    { icon: Split, title: "Expenses", text: "Airbnb, dinner, taxis" },
    { icon: ArrowRight, title: "Next move", text: "Settle Maya $40" },
  ]

  return (
    <Shell localFrame={localFrame} duration={scenes.demo.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 78 : 130,
          top: compact ? 150 : 170,
          right: compact ? 78 : 130,
        }}
      >
        <div
          style={{
            ...entrance(localFrame, 0),
            fontFamily: serif,
            fontSize: compact ? 80 : 96,
            lineHeight: 0.98,
            color: C.ink,
          }}
        >
          throw expenses in.
          <br />
          FundWise finds
          <br />
          the clean way out.
        </div>
      </div>
      <ExpenseChip
        label="Airbnb"
        amount="$184"
        delay={26}
        x={compact ? 130 : 210}
        y={compact ? 500 : 620}
        color={C.green}
        compact={compact}
      />
      <ExpenseChip
        label="Dinner"
        amount="$96"
        delay={38}
        x={compact ? 500 : 460}
        y={compact ? 585 : 745}
        color={C.amber}
        compact={compact}
      />
      <ExpenseChip
        label="Taxi"
        amount="$38"
        delay={50}
        x={compact ? 320 : 740}
        y={compact ? 715 : 590}
        color={C.blue}
        compact={compact}
      />
      <Stamp
        delay={104}
        x={compact ? 600 : 1260}
        y={compact ? 565 : 260}
        rotate={5}
        color={C.green}
      >
        netted
      </Stamp>
      <div
        style={{
          position: "absolute",
          left: compact ? 78 : 130,
          right: compact ? 78 : 130,
          bottom: compact ? 66 : 90,
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
                minHeight: compact ? 138 : 218,
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
                  marginTop: compact ? 14 : 20,
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
  const ring = interpolate(localFrame, [64, 112], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  })

  return (
    <Shell localFrame={localFrame} duration={scenes.settle.duration} format={format}>
      <div
        style={{
          position: "absolute",
          left: compact ? 80 : 150,
          top: compact ? 160 : 190,
          width: compact ? 900 : 720,
        }}
      >
        <div
          style={{
            ...entrance(localFrame, 0),
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 86 : 106,
            lineHeight: 0.96,
          }}
        >
          tap the green button.
          <br />
          be done.
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
          No custom math. No "I'll send it later."
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
            position: "absolute",
            left: "50%",
            bottom: compact ? 40 : 44,
            width: interpolate(ring, [0, 1], [280, compact ? 720 : 510]),
            height: interpolate(ring, [0, 1], [88, compact ? 132 : 118]),
            borderRadius: 999,
            border: `4px solid rgba(45, 184, 112, ${interpolate(ring, [0, 1], [0, 0.34])})`,
            transform: "translateX(-50%)",
          }}
        />
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
            background: `linear-gradient(135deg, ${C.green}, ${C.fresh})`,
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
            position: "relative",
            zIndex: 2,
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
      <Confetti compact={compact} />
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
          paid.
          <br />
          proven.
          <br />
          done.
        </div>
        <div
          style={{
            ...entrance(localFrame, 18),
            marginTop: 26,
            color: C.muted,
            fontSize: compact ? 32 : 38,
          }}
        >
          A Receipt your whole Group can trust.
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
              Receipt unlocked
            </div>
            <div style={{ color: C.muted, fontSize: compact ? 24 : 22, marginTop: 3 }}>
              USDC transfer confirmed
            </div>
          </div>
        </div>
        <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
          <ReceiptLine label="Settled" value="$40.00 USDC" compact={compact} />
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
            fontSize: compact ? 82 : 104,
            lineHeight: 0.95,
          }}
        >
          Send this to
          <br />
          the group chat.
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
        <div
          style={{
            ...entrance(localFrame, 54),
            marginTop: 18,
            color: C.muted,
            fontSize: compact ? 28 : 32,
            fontWeight: 800,
          }}
        >
          Group money, done right.
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
