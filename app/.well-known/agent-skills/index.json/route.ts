export const runtime = "edge"

import { buildAgentSkillMarkdown } from "@/lib/server/fundwise-api-discovery"
import { sha256Hex } from "@/lib/server/fundwise-discovery"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const skillMarkdown = buildAgentSkillMarkdown(origin)
  const digest = await sha256Hex(skillMarkdown)

  return Response.json(
    {
      $schema: "https://agentskills.io/schemas/agent-skills-index-v0.2.json",
      skills: [
        {
          name: "fundwise",
          type: "text/markdown",
          description:
            "Discover FundWise APIs, wallet-native auth, safe Group reads, draft-safe agent actions, and Settlement guardrails.",
          url: `${origin}/skill.md`,
          digest: `sha256:${digest}`,
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  )
}
