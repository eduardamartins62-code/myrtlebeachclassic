import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionValue } from "@/lib/adminSession";

const adminCookieName = "mbc_admin";

export async function middleware(request: NextRequest) {
  const adminCookie = request.cookies.get(adminCookieName)?.value;
  const adminCookieSecret = process.env.ADMIN_COOKIE_SECRET;

  if (!adminCookieSecret) {
    throw new Error("ADMIN_COOKIE_SECRET is not set.");
  }

  const session = adminCookie
    ? await verifyAdminSessionValue(adminCookie, adminCookieSecret)
    : null;

  if (!session) {
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
