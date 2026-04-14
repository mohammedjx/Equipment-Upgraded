import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, getAdminPassword } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isLoginPage = pathname === "/login";

  if (!isAdminArea && !isLoginPage) {
    return NextResponse.next();
  }

  const password = getAdminPassword();
  const expectedToken = password ? createAdminSessionToken(password) : "";
  const sessionToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthed = Boolean(expectedToken && sessionToken === expectedToken);

  if (isLoginPage && isAuthed) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAdminArea && !isAuthed) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/login"],
};
