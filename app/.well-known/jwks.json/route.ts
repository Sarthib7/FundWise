export const runtime = "edge"

export async function GET() {
  return Response.json(
    {
      keys: [],
      note: "FundWise currently uses Solana wallet signatures and HTTP-only session cookies. No OAuth JWT signing keys are published yet.",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    },
  )
}
