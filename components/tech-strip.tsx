import Image from "next/image"

const stackItems = [
  {
    name: "Circle",
    logo: "/stack-logos/mono/circle-wordmark-bw.png",
    width: 306,
    height: 90,
    className: "h-9 w-auto sm:h-10",
  },
  {
    name: "Solana",
    logo: "/stack-logos/mono/solana-wordmark-bw.png",
    width: 599,
    height: 102,
    className: "h-8 w-auto sm:h-9",
  },
  {
    name: "LI.FI",
    logo: "/stack-logos/mono/lifi-mark-bw.png",
    width: 111,
    height: 147,
    className: "h-10 w-auto sm:h-11",
  },
  {
    name: "Visa",
    logo: "/stack-logos/mono/visa-wordmark-bw.png",
    width: 410,
    height: 140,
    className: "h-9 w-auto sm:h-10",
  },
  {
    name: "Zerion",
    logo: "/stack-logos/mono/zerion-mark-bw.png",
    width: 123,
    height: 116,
    className: "h-10 w-auto sm:h-11",
  },
  {
    name: "Squads",
    logo: "/stack-logos/mono/squads-mark-bw.png",
    width: 125,
    height: 125,
    className: "h-10 w-auto sm:h-11",
  },
]

const namedMarkLabels = new Set(["LI.FI", "Zerion", "Squads"])

export function TechStrip() {
  return (
    <section
      className="border-y border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfb_52%,#f3f3f3_100%)] px-4 py-14 text-black sm:px-6 sm:py-16 lg:px-[max(24px,calc(50%-660px))]"
      aria-labelledby="fundwise-stack-title"
    >
      <div className="mx-auto max-w-6xl text-center">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-black/55">
            FundWise stack
          </div>
          <h2 id="fundwise-stack-title" className="sr-only">
            FundWise stack
          </h2>
          <div className="h-px w-16 bg-black/20" aria-hidden="true" />
        </div>

        <ul className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-x-8 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
          {stackItems.map((item, index) => (
            <li key={item.name} className="flex justify-center">
              <div className="group inline-flex min-h-14 items-center gap-3 text-black transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="inline-flex animate-stack-logo items-center" style={{ animationDelay: `${index * 240}ms` }}>
                  <Image
                    src={item.logo}
                    alt={`${item.name} logo`}
                    width={item.width}
                    height={item.height}
                    className={`${item.className} object-contain opacity-70 transition-opacity duration-150 ease-out group-hover:opacity-95 motion-reduce:transition-none`}
                  />
                </span>
                {namedMarkLabels.has(item.name) ? (
                  <span className="text-lg font-bold tracking-tight text-black/75 sm:text-xl">{item.name}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
