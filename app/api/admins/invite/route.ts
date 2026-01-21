import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasAdminCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!hasAdminCookie(cookies())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: "Admin invites are disabled." },
    { status: 410 }
  );
}
