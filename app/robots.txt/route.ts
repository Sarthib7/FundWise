export const runtime = "edge"

import { getCanonicalUrl } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(`User-agent: *
Allow: /

Sitemap: ${getCanonicalUrl("/sitemap.xml", origin)}
`, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
