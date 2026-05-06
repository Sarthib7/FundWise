export const runtime = "edge"

import { buildMcpServerCard } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return Response.json(buildMcpServerCard(origin), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  })
}
