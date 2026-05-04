import { buildAgentSkillMarkdown } from "@/lib/server/fundwise-api-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin

  return new Response(buildAgentSkillMarkdown(origin), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
