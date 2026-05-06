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
  useVideoConfig,
} from "remotion"
import {
  ArrowRight,
  Check,
  Link2,
  MousePointer2,
  ReceiptText,
  Send,
  Sparkles,
  WalletCards,
} from "lucide-react"

type Format = "landscape" | "square"

type ClipProps = {
  format: Format
}

const C = {
  ink: "#06150c",
  deep: "#0a5f37",
  green: "#07914e",
  bright: "#20b86a",
  mint: "#e8f7ee",
  paper: "#fbfdf9",
  border: "#bfdec9",
  soft: "#f3faf5",
  muted: "#597365",
  red: "#f04438",
  amber: "#f2b84b",
  blue: "#2f5fb3",
  white: "#ffffff",
  black: "#020705",
}

const serif = '"DM Serif Display", Georgia, serif'
const sans = '"Plus Jakarta Sans", Inter, system-ui, sans-serif'
const mono = '"Geist Mono", "SFMono-Regular", Consolas, monospace'

const scenes = {
  coldOpen: { from: 0, duration: 105 },
  link: { from: 105, duration: 165 },
  demo: { from: 270, duration: 300 },
  receipt: { from: 570, duration: 165 },
  cta: { from: 735, duration: 165 },
}

function eased(
  frame: number,
  input: [number, number] | [number, number, number] | [number, number, number, number],
  output: number[],
) {
  return interpolate(frame, input, output, {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
}

function fade(frame: number, duration: number) {
  return interpolate(frame, [0, 14, duration - 18, duration], [0, 1, 1, 0], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
}

function rise(frame: number, delay = 0, distance = 34) {
  const progress = spring({
    frame: frame - delay,
    fps: 30,
    config: { damping: 200 },
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

function pop(frame: number, delay = 0) {
  return spring({
    frame: frame - delay,
    fps: 30,
    config: { damping: 18, stiffness: 190 },
  })
}

function SceneShell({
  children,
  duration,
  format,
  tone = "paper",
}: {
  children: React.ReactNode
  duration: number
  format: Format
  tone?: "paper" | "dark" | "green"
}) {
  const frame = useCurrentFrame()
  const compact = format === "square"
  const background =
    tone === "dark"
      ? `linear-gradient(135deg, ${C.ink} 0%, #102018 52%, #101816 100%)`
      : tone === "green"
        ? `linear-gradient(135deg, #f7fff9 0%, ${C.mint} 58%, #ffffff 100%)`
        : `linear-gradient(135deg, ${C.paper} 0%, #f1faf4 55%, #ffffff 100%)`

  return (
    <AbsoluteFill
      style={{
        opacity: fade(frame, duration),
        background,
        color: tone === "dark" ? C.white : C.ink,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            tone === "dark"
              ? "linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)"
              : "linear-gradient(rgba(6,21,12,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(6,21,12,.045) 1px, transparent 1px)",
          backgroundSize: compact ? "42px 42px" : "54px 54px",
          opacity: tone === "dark" ? 0.24 : 0.42,
        }}
      />
      <Header compact={compact} dark={tone === "dark"} />
      {children}
    </AbsoluteFill>
  )
}

function Header({ compact, dark }: { compact: boolean; dark: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: compact ? 40 : 44,
        left: compact ? 48 : 70,
        right: compact ? 48 : 70,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 16 }}>
        <Img
          src={staticFile("brand-strata/svg/mark-gradient.svg")}
          style={{ width: compact ? 40 : 48, height: compact ? 40 : 48 }}
        />
        <div
          style={{
            color: dark ? C.white : C.ink,
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
          border: `1px solid ${dark ? "rgba(255,255,255,.24)" : C.border}`,
          borderRadius: 999,
          color: dark ? C.white : C.deep,
          background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.78)",
          fontWeight: 850,
          padding: compact ? "10px 16px" : "12px 22px",
          fontSize: compact ? 18 : 22,
          letterSpacing: 0,
        }}
      >
        fundwise.fun
      </div>
    </div>
  )
}

function BrowserFrame({
  src,
  frame,
  compact,
  x,
  y,
  width,
  height,
  zoom = 1,
  objectPosition = "center top",
  delay = 0,
  rotate = 0,
}: {
  src: string
  frame: number
  compact: boolean
  x: number
  y: number
  width: number
  height: number
  zoom?: number
  objectPosition?: string
  delay?: number
  rotate?: number
}) {
  const progress = spring({ frame: frame - delay, fps: 30, config: { damping: 200 } })
  const float = Math.sin((frame + delay) / 42) * (compact ? 3 : 5)

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + float,
        width,
        height,
        overflow: "hidden",
        borderRadius: compact ? 22 : 30,
        border: `1px solid ${C.border}`,
        background: C.white,
        boxShadow: "0 34px 100px rgba(6, 21, 12, 0.18)",
        opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `translateY(${interpolate(progress, [0, 1], [32, 0], {
          extrapolateRight: "clamp",
        })}px) rotate(${rotate}deg) scale(${interpolate(progress, [0, 1], [0.98, 1], {
          extrapolateRight: "clamp",
        })})`,
      }}
    >
      <div
        style={{
          height: compact ? 38 : 44,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 9,
          paddingLeft: compact ? 22 : 28,
          background: "#f8fcf9",
        }}
      >
        {[C.red, C.amber, C.bright].map((color) => (
          <div key={color} style={{ width: 13, height: 13, borderRadius: "50%", background: color }} />
        ))}
      </div>
      <Img
        src={staticFile(`product-shots/${src}`)}
        style={{
          width: "100%",
          height: `calc(100% - ${compact ? 38 : 44}px)`,
          objectFit: "cover",
          objectPosition,
          transform: `scale(${zoom})`,
          transformOrigin: objectPosition,
        }}
      />
    </div>
  )
}

function Caption({
  children,
  frame,
  delay = 0,
  compact,
  dark = false,
}: {
  children: React.ReactNode
  frame: number
  delay?: number
  compact: boolean
  dark?: boolean
}) {
  return (
    <div
      style={{
        ...rise(frame, delay, 22),
        position: "absolute",
        left: compact ? 56 : 76,
        right: compact ? 56 : 76,
        bottom: compact ? 56 : 58,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: compact ? 910 : 1260,
          borderRadius: 999,
          padding: compact ? "18px 28px" : "20px 34px",
          background: dark ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.9)",
          border: `1px solid ${dark ? "rgba(255,255,255,.22)" : C.border}`,
          color: dark ? C.white : C.ink,
          fontSize: compact ? 30 : 36,
          fontWeight: 900,
          lineHeight: 1.12,
          boxShadow: dark ? "none" : "0 18px 55px rgba(6,21,12,.12)",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ChatBubble({
  text,
  frame,
  delay,
  x,
  y,
  compact,
  mine = false,
  rotate = 0,
}: {
  text: string
  frame: number
  delay: number
  x: number
  y: number
  compact: boolean
  mine?: boolean
  rotate?: number
}) {
  const progress = pop(frame, delay)

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 12,
        maxWidth: compact ? 620 : 560,
        padding: compact ? "20px 24px" : "20px 26px",
        borderRadius: mine ? "26px 26px 8px 26px" : "26px 26px 26px 8px",
        background: mine ? C.green : C.white,
        border: `1px solid ${mine ? C.green : C.border}`,
        color: mine ? C.white : C.ink,
        fontSize: compact ? 29 : 31,
        lineHeight: 1.12,
        fontWeight: 900,
        boxShadow: "0 26px 72px rgba(6, 21, 12, 0.18)",
        opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${interpolate(progress, [0, 1], [0.72, 1], {
          extrapolateRight: "clamp",
        })}) rotate(${rotate}deg)`,
      }}
    >
      {text}
    </div>
  )
}

function Tag({
  children,
  frame,
  delay,
  x,
  y,
  compact,
  tone = "green",
}: {
  children: React.ReactNode
  frame: number
  delay: number
  x: number
  y: number
  compact: boolean
  tone?: "green" | "red" | "blue" | "amber"
}) {
  const progress = pop(frame, delay)
  const colors = {
    green: { bg: C.mint, fg: C.deep, border: C.border },
    red: { bg: "#fff0ee", fg: C.red, border: "#ffc7bf" },
    blue: { bg: "#eff4ff", fg: C.blue, border: "#bdcff6" },
    amber: { bg: "#fff7df", fg: "#7a5510", border: "#f4d893" },
  }[tone]

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 18,
        padding: compact ? "13px 18px" : "14px 22px",
        borderRadius: 999,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        fontSize: compact ? 22 : 25,
        fontWeight: 950,
        boxShadow: "0 18px 48px rgba(6,21,12,.12)",
        opacity: interpolate(progress, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
        transform: `scale(${progress})`,
      }}
    >
      {children}
    </div>
  )
}

function Cursor({
  frame,
  compact,
  start,
  from,
  to,
}: {
  frame: number
  compact: boolean
  start: number
  from: { x: number; y: number }
  to: { x: number; y: number }
}) {
  const move = eased(frame - start, [0, 66], [0, 1])
  const click = pop(frame, start + 68)
  const x = interpolate(move, [0, 1], [from.x, to.x])
  const y = interpolate(move, [0, 1], [from.y, to.y])

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 35,
        color: C.ink,
        filter: "drop-shadow(0 8px 18px rgba(6,21,12,.32))",
        transform: `scale(${interpolate(click, [0, 1], [1, 0.88], {
          extrapolateRight: "clamp",
        })})`,
      }}
    >
      <MousePointer2 size={compact ? 48 : 58} fill={C.white} strokeWidth={2.5} />
      <div
        style={{
          position: "absolute",
          left: compact ? 34 : 40,
          top: compact ? 36 : 44,
          width: interpolate(click, [0, 1], [0, compact ? 96 : 116], {
            extrapolateRight: "clamp",
          }),
          height: interpolate(click, [0, 1], [0, compact ? 96 : 116], {
            extrapolateRight: "clamp",
          }),
          borderRadius: "50%",
          border: `4px solid ${C.green}`,
          opacity: interpolate(click, [0, 0.4, 1], [0, 0.7, 0], {
            extrapolateRight: "clamp",
          }),
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  )
}

function RouteStep({
  icon,
  label,
  frame,
  delay,
  compact,
}: {
  icon: React.ReactNode
  label: string
  frame: number
  delay: number
  compact: boolean
}) {
  return (
    <div
      style={{
        ...rise(frame, delay, 18),
        minWidth: compact ? 245 : 300,
        borderRadius: 22,
        border: `1px solid ${C.border}`,
        background: C.white,
        padding: compact ? "20px 22px" : "22px 26px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 20px 60px rgba(6,21,12,.12)",
      }}
    >
      <div
        style={{
          width: compact ? 46 : 54,
          height: compact ? 46 : 54,
          borderRadius: 16,
          background: C.mint,
          color: C.green,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </div>
      <div style={{ color: C.ink, fontSize: compact ? 23 : 27, fontWeight: 950 }}>{label}</div>
    </div>
  )
}

function ColdOpen({ format }: { format: Format }) {
  const frame = useCurrentFrame()
  const compact = format === "square"
  const chaos = eased(frame, [0, 92], [0, 1])

  return (
    <SceneShell duration={scenes.coldOpen.duration} format={format} tone="dark">
      <div
        style={{
          position: "absolute",
          left: compact ? 58 : 110,
          right: compact ? 58 : 820,
          top: compact ? 142 : 150,
          zIndex: 10,
        }}
      >
        <div
          style={{
            ...rise(frame, 4, 44),
            fontFamily: serif,
            fontSize: compact ? 86 : 118,
            lineHeight: 0.94,
            letterSpacing: 0,
          }}
        >
          “who still owes
          <br />
          the $47?”
        </div>
        <div
          style={{
            ...rise(frame, 26, 26),
            marginTop: compact ? 26 : 30,
            color: "rgba(255,255,255,.72)",
            fontSize: compact ? 32 : 38,
            lineHeight: 1.25,
            fontWeight: 800,
          }}
        >
          The sentence that turns a trip chat into a finance department.
        </div>
      </div>

      <ChatBubble
        text="wait did we ever settle the Airbnb?"
        frame={frame}
        delay={28}
        x={compact ? 110 : 1050}
        y={compact ? 440 : 185}
        compact={compact}
        rotate={-2}
      />
      <ChatBubble
        text="I paid taxi, dinner, and vibes"
        frame={frame}
        delay={42}
        x={compact ? 250 : 1195}
        y={compact ? 570 : 332}
        compact={compact}
        mine
        rotate={2}
      />
      <ChatBubble
        text="please no spreadsheet today"
        frame={frame}
        delay={56}
        x={compact ? 130 : 1000}
        y={compact ? 700 : 482}
        compact={compact}
        rotate={-1}
      />

      <div
        style={{
          position: "absolute",
          right: compact ? 94 : 150,
          bottom: compact ? 120 : 110,
          width: compact ? 820 : 620,
          height: compact ? 180 : 184,
          zIndex: 16,
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,.2)",
          background: "rgba(255,255,255,.08)",
          overflow: "hidden",
          opacity: interpolate(chaos, [0, 1], [0, 1]),
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${26 + chaos * 74}%`,
            background: "linear-gradient(90deg, rgba(240,68,56,.92), rgba(242,184,75,.9))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: compact ? "0 34px" : "0 38px",
            color: C.white,
          }}
        >
          <div style={{ fontSize: compact ? 28 : 30, fontWeight: 950 }}>unsettled social debt</div>
          <div style={{ fontFamily: mono, fontSize: compact ? 58 : 64, fontWeight: 950 }}>$47</div>
        </div>
      </div>

      <Caption frame={frame} delay={66} compact={compact} dark>
        FundWise turns awkward Group IOUs into a clean Settlement.
      </Caption>
    </SceneShell>
  )
}

function LinkScene({ format }: { format: Format }) {
  const frame = useCurrentFrame()
  const compact = format === "square"

  return (
    <SceneShell duration={scenes.link.duration} format={format} tone="paper">
      <BrowserFrame
        src="fundwise-story.png"
        frame={frame}
        compact={compact}
        x={compact ? 60 : 760}
        y={compact ? 155 : 146}
        width={compact ? 960 : 1040}
        height={compact ? 600 : 680}
        zoom={compact ? 1.15 : 1.08}
        objectPosition={compact ? "38% top" : "58% top"}
        delay={8}
      />

      <div
        style={{
          position: "absolute",
          left: compact ? 70 : 120,
          top: compact ? 770 : 220,
          width: compact ? 920 : 610,
          zIndex: 20,
        }}
      >
        <div
          style={{
            ...rise(frame, 0, 34),
            color: C.deep,
            fontFamily: mono,
            fontSize: compact ? 24 : 26,
            fontWeight: 950,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          product move
        </div>
        <div
          style={{
            ...rise(frame, 14, 34),
            marginTop: 22,
            fontFamily: serif,
            fontSize: compact ? 72 : 94,
            lineHeight: 0.96,
            color: C.ink,
          }}
        >
          send one link.
          <br />
          skip the chase.
        </div>
        <div
          style={{
            ...rise(frame, 34, 24),
            marginTop: 26,
            color: C.muted,
            fontSize: compact ? 31 : 36,
            lineHeight: 1.28,
            fontWeight: 750,
          }}
        >
          A Member opens a live Group Balance, settles exact USDC, and gets a Receipt
          everyone can trust.
        </div>
      </div>

      <Tag frame={frame} delay={60} x={compact ? 98 : 955} y={compact ? 325 : 395} compact={compact}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Link2 size={compact ? 24 : 28} /> Settlement Request Link
        </span>
      </Tag>
      <Tag
        frame={frame}
        delay={74}
        x={compact ? 430 : 1126}
        y={compact ? 455 : 520}
        compact={compact}
        tone="blue"
      >
        live Group Balance
      </Tag>
      <Tag
        frame={frame}
        delay={88}
        x={compact ? 590 : 1210}
        y={compact ? 590 : 650}
        compact={compact}
        tone="green"
      >
        verifiable Receipt
      </Tag>

      <Caption frame={frame} delay={104} compact={compact}>
        It feels like a group chat link, but it closes the ledger.
      </Caption>
    </SceneShell>
  )
}

function DemoScene({ format }: { format: Format }) {
  const frame = useCurrentFrame()
  const compact = format === "square"
  const arrowProgress = eased(frame, [86, 126], [0, 1])

  const frameProps = compact
    ? {
        x: 74,
        y: 146,
        width: 932,
        height: 596,
        zoom: 1.1,
        objectPosition: "50% 8%",
      }
    : {
        x: 520,
        y: 136,
        width: 1240,
        height: 716,
        zoom: 1.08,
        objectPosition: "52% 8%",
      }

  return (
    <SceneShell duration={scenes.demo.duration} format={format} tone="green">
      <div
        style={{
          position: "absolute",
          left: compact ? 72 : 116,
          top: compact ? 765 : 180,
          width: compact ? 920 : 410,
          zIndex: 20,
          opacity: compact
            ? interpolate(frame, [106, 136], [1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1,
        }}
      >
        <div
          style={{
            ...rise(frame, 0, 30),
            color: C.deep,
            fontFamily: mono,
            fontSize: compact ? 23 : 24,
            fontWeight: 950,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          actual flow
        </div>
        <div
          style={{
            ...rise(frame, 12, 30),
            marginTop: 18,
            fontFamily: serif,
            color: C.ink,
            fontSize: compact ? 66 : 78,
            lineHeight: 0.98,
          }}
        >
          find the cleanest next Settlement.
        </div>
      </div>

      <BrowserFrame
        src="fundwise-app-mock.png"
        frame={frame}
        compact={compact}
        x={frameProps.x}
        y={frameProps.y}
        width={frameProps.width}
        height={frameProps.height}
        zoom={frameProps.zoom}
        objectPosition={frameProps.objectPosition}
        delay={6}
      />

      <Tag
        frame={frame}
        delay={42}
        x={compact ? 136 : 700}
        y={compact ? 300 : 310}
        compact={compact}
        tone="red"
      >
        you owe $40.00
      </Tag>
      <Tag
        frame={frame}
        delay={60}
        x={compact ? 552 : 1160}
        y={compact ? 542 : 646}
        compact={compact}
      >
        Settle $40.00
      </Tag>

      <Cursor
        frame={frame}
        compact={compact}
        start={92}
        from={{ x: compact ? 210 : 835, y: compact ? 390 : 418 }}
        to={{ x: compact ? 770 : 1510, y: compact ? 624 : 735 }}
      />

      <div
        style={{
          position: "absolute",
          left: compact ? 92 : 116,
          right: compact ? 92 : 126,
          bottom: compact ? 54 : 66,
          zIndex: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: compact ? "center" : "space-between",
          gap: compact ? 16 : 22,
          flexWrap: compact ? "wrap" : "nowrap",
        }}
      >
        <RouteStep
          icon={<WalletCards size={compact ? 25 : 29} />}
          label="Group Balance"
          frame={frame}
          delay={142}
          compact={compact}
        />
        <ArrowRight
          size={compact ? 28 : 34}
          color={C.deep}
          style={{ opacity: arrowProgress, flex: "0 0 auto" }}
        />
        <RouteStep
          icon={<Send size={compact ? 25 : 29} />}
          label="USDC Settlement"
          frame={frame}
          delay={158}
          compact={compact}
        />
        <ArrowRight
          size={compact ? 28 : 34}
          color={C.deep}
          style={{ opacity: arrowProgress, flex: "0 0 auto" }}
        />
        <RouteStep
          icon={<ReceiptText size={compact ? 25 : 29} />}
          label="shared Receipt"
          frame={frame}
          delay={174}
          compact={compact}
        />
      </div>
    </SceneShell>
  )
}

function ReceiptScene({ format }: { format: Format }) {
  const frame = useCurrentFrame()
  const compact = format === "square"
  const check = pop(frame, 44)

  return (
    <SceneShell duration={scenes.receipt.duration} format={format} tone="paper">
      <BrowserFrame
        src="fundwise-groups.png"
        frame={frame}
        compact={compact}
        x={compact ? 72 : 108}
        y={compact ? 150 : 138}
        width={compact ? 936 : 920}
        height={compact ? 610 : 704}
        zoom={compact ? 1.12 : 1.06}
        objectPosition="48% top"
        delay={0}
      />

      <div
        style={{
          position: "absolute",
          right: compact ? 92 : 132,
          top: compact ? 745 : 190,
          width: compact ? 890 : 680,
          zIndex: 22,
          borderRadius: 34,
          border: `1px solid ${C.border}`,
          background: C.white,
          padding: compact ? 38 : 46,
          boxShadow: "0 38px 120px rgba(6,21,12,.18)",
          ...rise(frame, 18, 38),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                color: C.deep,
                fontFamily: mono,
                fontSize: compact ? 22 : 24,
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              receipt
            </div>
            <div
              style={{
                marginTop: 14,
                color: C.ink,
                fontFamily: serif,
                fontSize: compact ? 62 : 72,
                lineHeight: 0.98,
              }}
            >
              settled.
              <br />
              no follow-up.
            </div>
          </div>
          <div
            style={{
              width: compact ? 78 : 88,
              height: compact ? 78 : 88,
              borderRadius: 28,
              display: "grid",
              placeItems: "center",
              background: C.green,
              color: C.white,
              transform: `scale(${interpolate(check, [0, 1], [0.2, 1], {
                extrapolateRight: "clamp",
              })})`,
            }}
          >
            <Check size={compact ? 42 : 48} strokeWidth={3.2} />
          </div>
        </div>

        <div
          style={{
            marginTop: compact ? 34 : 38,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {[
            ["from", "You"],
            ["to", "Asha"],
            ["asset", "USDC"],
            ["amount", "$40.00"],
          ].map(([label, value], index) => (
            <div
              key={label}
              style={{
                ...rise(frame, 52 + index * 8, 16),
                borderRadius: 20,
                background: C.soft,
                border: `1px solid ${C.border}`,
                padding: compact ? "18px 20px" : "20px 22px",
              }}
            >
              <div
                style={{
                  color: C.muted,
                  fontSize: compact ? 20 : 22,
                  fontWeight: 850,
                  textTransform: "uppercase",
                  letterSpacing: 1.8,
                }}
              >
                {label}
              </div>
              <div style={{ marginTop: 8, color: C.ink, fontSize: compact ? 29 : 34, fontWeight: 950 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            ...rise(frame, 92, 16),
            marginTop: 22,
            borderRadius: 18,
            background: C.ink,
            color: C.white,
            padding: compact ? "18px 20px" : "20px 22px",
            fontFamily: mono,
            fontSize: compact ? 22 : 25,
            fontWeight: 850,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <span>tx 4Kt...mN7x</span>
          <span style={{ color: "#7cf0ae" }}>confirmed</span>
        </div>
      </div>

      <Caption frame={frame} delay={112} compact={compact}>
        The money moves on-chain. The social awkwardness does not.
      </Caption>
    </SceneShell>
  )
}

function CtaScene({ format }: { format: Format }) {
  const frame = useCurrentFrame()
  const compact = format === "square"
  const shine = eased(frame, [34, 116], [-28, 128])

  return (
    <SceneShell duration={scenes.cta.duration} format={format} tone="dark">
      <BrowserFrame
        src="fundwise-home.png"
        frame={frame}
        compact={compact}
        x={compact ? 70 : 850}
        y={compact ? 152 : 145}
        width={compact ? 940 : 910}
        height={compact ? 520 : 650}
        zoom={compact ? 1.22 : 1.16}
        objectPosition="center top"
        delay={0}
      />

      <div
        style={{
          position: "absolute",
          left: compact ? 70 : 120,
          top: compact ? 725 : 188,
          width: compact ? 940 : 660,
          zIndex: 24,
        }}
      >
        <div
          style={{
            ...rise(frame, 6, 38),
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.24)",
            background: "rgba(255,255,255,.1)",
            color: "#b8ffd4",
            fontSize: compact ? 23 : 26,
            fontWeight: 950,
          }}
        >
          <Sparkles size={compact ? 24 : 28} />
          for the group chat
        </div>
        <div
          style={{
            ...rise(frame, 18, 42),
            marginTop: 26,
            fontFamily: serif,
            fontSize: compact ? 74 : 104,
            lineHeight: 0.94,
            color: C.white,
          }}
        >
          Send the link
          <br />
          before it becomes
          <br />
          a spreadsheet.
        </div>
        <div
          style={{
            ...rise(frame, 52, 28),
            position: "relative",
            marginTop: 34,
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            overflow: "hidden",
            borderRadius: 999,
            background: C.white,
            color: C.ink,
            padding: compact ? "20px 28px" : "22px 34px",
            fontSize: compact ? 34 : 42,
            fontWeight: 950,
            boxShadow: "0 28px 90px rgba(0,0,0,.34)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "-35%",
              bottom: "-35%",
              width: "26%",
              left: `${shine}%`,
              background: "linear-gradient(90deg, transparent, rgba(32,184,106,.22), transparent)",
              transform: "rotate(18deg)",
            }}
          />
          <span>fundwise.fun</span>
          <ArrowRight size={compact ? 34 : 40} />
        </div>
      </div>

      <Caption frame={frame} delay={104} compact={compact} dark>
        Trips, dinners, shared tabs: Group money, done right.
      </Caption>
    </SceneShell>
  )
}

export function FundwiseXClip({ format }: ClipProps) {
  const { fps } = useVideoConfig()
  const _fps = fps

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence from={scenes.coldOpen.from} durationInFrames={scenes.coldOpen.duration} premountFor={_fps}>
        <ColdOpen format={format} />
      </Sequence>
      <Sequence from={scenes.link.from} durationInFrames={scenes.link.duration} premountFor={_fps}>
        <LinkScene format={format} />
      </Sequence>
      <Sequence from={scenes.demo.from} durationInFrames={scenes.demo.duration} premountFor={_fps}>
        <DemoScene format={format} />
      </Sequence>
      <Sequence from={scenes.receipt.from} durationInFrames={scenes.receipt.duration} premountFor={_fps}>
        <ReceiptScene format={format} />
      </Sequence>
      <Sequence from={scenes.cta.from} durationInFrames={scenes.cta.duration} premountFor={_fps}>
        <CtaScene format={format} />
      </Sequence>
    </AbsoluteFill>
  )
}
