import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "mbc_admin";

const ADMIN_COOKIE_DELIMITER = ".";

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7
};

const getAdminCookieSecret = () =>
  process.env.ADMIN_COOKIE_SECRET ?? process.env.ADMIN_PASSWORD ?? "";

const signAdminCookie = (token: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(token).digest("hex");

export const createAdminCookieValue = () => {
  const secret = getAdminCookieSecret();
  if (!secret) {
    return null;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const signature = signAdminCookie(token, secret);
  return `${token}${ADMIN_COOKIE_DELIMITER}${signature}`;
};

export const isAdminCookieValue = (value?: string | null) => {
  if (!value) {
    return false;
  }

  const secret = getAdminCookieSecret();
  if (!secret) {
    return false;
  }

  const [token, signature] = value.split(ADMIN_COOKIE_DELIMITER);
  if (!token || !signature) {
    return false;
  }

  const expectedSignature = signAdminCookie(token, secret);
  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

export const hasAdminCookie = (
  cookieStore: Pick<{ get: (name: string) => { value?: string } | undefined }, "get">
) => isAdminCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
