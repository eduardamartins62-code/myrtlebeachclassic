import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createAdminSessionValue } from "@/lib/adminSession";

const ADMIN_COOKIE_NAME = "mbc_admin";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminCookieSecret = process.env.ADMIN_COOKIE_SECRET;
  const adminEmail =
    process.env.SUPABASE_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
  const supabaseAdminPassword =
    process.env.SUPABASE_ADMIN_PASSWORD ?? adminPassword ?? "";

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set.");
  }

  if (!adminCookieSecret) {
    throw new Error("ADMIN_COOKIE_SECRET is not set.");
  }

  if (!adminEmail) {
    throw new Error("SUPABASE_ADMIN_EMAIL or ADMIN_EMAIL is not set.");
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const { error: supabaseError } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: supabaseAdminPassword
  });

  if (supabaseError) {
    return NextResponse.json(
      { error: "Unable to establish admin session." },
      { status: 401 }
    );
  }

  const cookieStore = cookies();
  const sessionValue = await createAdminSessionValue(
    {
      role: "admin",
      iat: Date.now(),
      exp: Date.now() + ADMIN_COOKIE_MAX_AGE * 1000
    },
    adminCookieSecret
  );

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: sessionValue,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE
  });

  return NextResponse.json({ ok: true });
}
