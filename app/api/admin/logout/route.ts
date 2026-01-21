import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieOptions } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin-login", request.url));
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    ...adminCookieOptions,
    maxAge: 0
  });
  return response;
}
