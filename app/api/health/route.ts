export const runtime = "edge"

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "fundwise",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    },
  )
}
