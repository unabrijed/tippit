import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/@") && pathname.length > 2) {
    const slug = pathname.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = `/creator/${slug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/@:path*"]
};
