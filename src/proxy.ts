import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, ACCESS_COOKIE } from "@/lib/auth";

// Optimistic checks only: read + verify the JWT from the cookie, no DB call.
// The actual authorization boundary is `requireAuth()`/`requireRole()` in the
// route handlers themselves — this just gives a fast redirect for UX.
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_PAGES = ["/login", "/register"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!isProtected && !isAuthPage) return NextResponse.next();

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const session = token ? await verifyAccessToken(token) : null;

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
