/**
 * Edge-runtime-compatible session token verification.
 * Uses the Web Crypto API (SubtleCrypto) instead of Node.js `crypto`.
 *
 * This module is imported by the Next.js middleware and must not reference
 * Node.js-only APIs or Prisma.
 */

export const SESSION_COOKIE_NAME = "admin_session";

let _secret: string | null = null;

function getSecret(): string {
  if (_secret) return _secret;

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_SECRET environment variable is required in production.");
    }
    _secret = "dev-secret-change-in-production";
  } else {
    _secret = secret;
  }
  return _secret;
}

interface SessionPayload {
  sessionId: string;
  userId: number;
  exp: number;
}

/** Convert a string to a Uint8Array. */
function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Convert a Uint8Array to a hex string. */
function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Import the HMAC key for signing. */
async function getKey(): Promise<CryptoKey> {
  const keyData = encode(getSecret());
  return crypto.subtle.importKey(
    "raw",
    keyData.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/** Sign a payload string with HMAC-SHA256 using the Web Crypto API. */
async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const data = encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, data.buffer as ArrayBuffer);
  return toHex(new Uint8Array(sig));
}

/**
 * Convert a hex string to a Uint8Array.
 */
function fromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const val = parseInt(hex.substring(i, i + 2), 16);
    if (isNaN(val)) return null;
    bytes[i / 2] = val;
  }
  return bytes;
}

/**
 * Constant-time comparison of two Uint8Arrays.
 */
function timingSafeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}

/**
 * Verify a signed session token (async, edge-compatible).
 * Returns the decoded payload if the token is valid and not expired, null otherwise.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSig = await sign(payloadB64);

  const sigBytes = fromHex(signature);
  const expectedBytes = fromHex(expectedSig);
  if (!sigBytes || !expectedBytes) return null;
  if (!timingSafeCompare(sigBytes, expectedBytes)) return null;

  try {
    const payloadStr = atob(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/")
    );
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (
      typeof payload.sessionId !== "string" ||
      typeof payload.userId !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}
