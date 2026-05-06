export const runtime = "edge"

import { CANONICAL_PUBLIC_PATHS, getCanonicalUrl } from "@/lib/server/fundwise-discovery"

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const urls = CANONICAL_PUBLIC_PATHS.map(
    (path) => `  <url>
    <loc>${escapeXml(getCanonicalUrl(path, origin))}</loc>
  </url>`,
  ).join("\n")

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/xml; charset=utf-8",
    },
  })
}
