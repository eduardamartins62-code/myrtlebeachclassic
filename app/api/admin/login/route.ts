import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_VALUE,
  adminCookieOptions
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/admin");
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.redirect(
      new URL("/admin-login?error=missing", request.url)
    );
  }

  if (password !== adminPassword) {
    const url = new URL("/admin-login", request.url);
    url.searchParams.set("error", "invalid");
    if (redirectTo) {
      url.searchParams.set("redirectTo", redirectTo);
    }
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: ADMIN_COOKIE_VALUE,
    ...adminCookieOptions
  });

  return response;
}
