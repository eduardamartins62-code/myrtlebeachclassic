const encoder = new TextEncoder();

const base64UrlEncode = (data: Uint8Array) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(data)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  let binary = "";
  data.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const base64UrlDecode = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = padded.length % 4;
  const base64 = padLength ? padded + "=".repeat(4 - padLength) : padded;

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const getSigningKey = async (secret: string) => {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

export type AdminSessionPayload = {
  role: "admin";
  iat: number;
  exp: number;
};

export const createAdminSessionValue = async (
  payload: AdminSessionPayload,
  secret: string
) => {
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(encodedPayload)
  );
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${encodedPayload}.${encodedSignature}`;
};

export const verifyAdminSessionValue = async (
  sessionValue: string,
  secret: string
) => {
  const [payloadPart, signaturePart] = sessionValue.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const key = await getSigningKey(secret);
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart),
    encoder.encode(payloadPart)
  );

  if (!isValid) {
    return null;
  }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadPart));
    const payload = JSON.parse(payloadJson) as AdminSessionPayload;

    if (payload.role !== "admin" || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};
