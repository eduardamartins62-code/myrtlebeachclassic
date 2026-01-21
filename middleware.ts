import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "mbc_admin";

export function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (adminCookie !== "1") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin-login";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/r/:path*/enter"]
};
