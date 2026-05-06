import { NextResponse, type NextRequest } from "next/server"
import {
  HOMEPAGE_LINK_HEADER,
  buildHomeMarkdown,
  estimateMarkdownTokens,
  isPublicMarkdownPath,
  wantsMarkdown,
} from "@/lib/server/fundwise-discovery"

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

  if (request.method === "GET" && isPublicMarkdownPath(pathname) && wantsMarkdown(request.headers.get("accept"))) {
    const markdown = buildHomeMarkdown(pathname, origin)

    return new NextResponse(markdown, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "Content-Type": "text/markdown; charset=utf-8",
        "Link": HOMEPAGE_LINK_HEADER,
        "Vary": "Accept",
        "x-markdown-tokens": estimateMarkdownTokens(markdown),
      },
    })
  }

  const response = NextResponse.next()

  if (pathname === "/") {
    response.headers.set("Link", HOMEPAGE_LINK_HEADER)
    response.headers.set("Vary", "Accept")
  }

  return response
}

export const config = {
  matcher: ["/", "/about", "/demo", "/groups", "/story"],
}
