export const runtime = "edge"

import { buildOpenApiSpec } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return Response.json(buildOpenApiSpec(origin), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/openapi+json",
    },
  })
}
