import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD is not set.");
  }

  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const cookieStore = cookies();
  cookieStore.set({
    name: "mbc_admin",
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  return NextResponse.json({ ok: true });
}
