/** @type {import('next').NextConfig} */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'
const cspEnabled = process.env.FUNDWISE_ENABLE_CSP === 'true'

function getOrigin(value) {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getOriginsFromCsv(value) {
  return (value || '')
    .split(',')
    .map((item) => getOrigin(item.trim()))
    .filter(Boolean)
}

const dynamicConnectOrigins = [
  getOrigin(process.env.NEXT_PUBLIC_SOLANA_RPC_URL),
  ...getOriginsFromCsv(process.env.NEXT_PUBLIC_SOLANA_RPC_FALLBACK_URLS),
  getOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL),
].filter(Boolean)

const baselineSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=(self)',
      'clipboard-read=(self)',
      'clipboard-write=(self)',
      'geolocation=()',
      'microphone=()',
      'payment=()',
      'usb=()',
      'serial=()',
      'bluetooth=()',
      'browsing-topics=()',
    ].join(', '),
  },
]

if (isProduction) {
  baselineSecurityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  })
}

const connectSrc = [
  "'self'",
  'https://api.devnet.solana.com',
  'https://api.mainnet-beta.solana.com',
  'https://*.helius-rpc.com',
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://li.quest',
  'https://*.li.quest',
  'https://*.lifi.io',
  'https://*.lifi.org',
  'https://*.lifi.xyz',
  'https://*.zerion.io',
  'https://open.er-api.com',
  ...dynamicConnectOrigins,
]

const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${[...new Set(connectSrc)].join(' ')}`,
  "frame-src 'self' https://*.li.quest https://*.lifi.xyz",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = cspEnabled
  ? [...baselineSecurityHeaders, { key: 'Content-Security-Policy', value: cspHeader }]
  : baselineSecurityHeaders

const nextConfig = {
  outputFileTracingRoot: repoRoot,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  // Avoid SegmentViewNode / next-devtools RSC client manifest errors in dev (Next 15.5).
  experimental: {
    devtoolSegmentExplorer: false,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config, { isServer }) => {
    // Fix for pino-pretty and other Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        'pino-pretty': false,
      }
    }

    // Ignore warnings about these modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    return config
  },
}

export default nextConfig
