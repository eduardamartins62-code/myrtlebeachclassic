import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isAdminCookieValue } from "@/lib/adminAuth";

export async function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!isAdminCookieValue(adminCookie)) {
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
