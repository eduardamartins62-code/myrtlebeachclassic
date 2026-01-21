import { NextResponse, type NextRequest } from "next/server";

const adminCookieName = "mbc_admin";

export function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get(adminCookieName)?.value;

  if (adminCookie !== "1") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin-login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/r/:path*/enter"]
};
