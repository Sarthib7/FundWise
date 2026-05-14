export const runtime = "edge"

import { buildOAuthAuthorizationServerMetadata } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return Response.json(buildOAuthAuthorizationServerMetadata(origin), {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  })
}
