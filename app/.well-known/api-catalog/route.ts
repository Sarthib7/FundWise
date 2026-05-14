import { buildApiCatalog } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return Response.json(buildApiCatalog(origin), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
    },
  })
}

export async function HEAD(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(null, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
      "Link": `<${origin}/.well-known/api-catalog>; rel="api-catalog"`,
    },
  })
}
