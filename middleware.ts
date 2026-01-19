import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  type CookieOptions = Omit<
    Parameters<typeof response.cookies.set>[0],
    "name" | "value"
  >;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/r/:path*/enter"]
};
