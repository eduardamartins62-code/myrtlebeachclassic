export const ADMIN_COOKIE_NAME = "mbc_admin";

export const ADMIN_COOKIE_VALUE = "true";

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7
};

export const isAdminCookieValue = (value?: string | null) =>
  value === ADMIN_COOKIE_VALUE;

export const hasAdminCookie = (
  cookieStore: Pick<{ get: (name: string) => { value?: string } | undefined }, "get">
) => isAdminCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
