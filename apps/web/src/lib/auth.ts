import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { findAdminUserById } from "@/lib/services/auth.service";
import {
  storeSession,
  findSessionById,
  deleteSessionById,
  deleteSessionsByUserId,
} from "@/lib/services/session.service";

/**
 * Resolve the HMAC signing secret for admin sessions.
 * In production, ADMIN_SECRET is mandatory -- the app will refuse to start
 * without it to prevent silent use of a known default secret.
 * In development, a local-only fallback is used for convenience.
 */
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

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

interface SessionPayload {
  sessionId: string;
  userId: number;
  exp: number;
}

/**
 * Sign a payload string with HMAC-SHA256.
 */
function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Encode a session payload into a signed token (base64url payload + HMAC signature).
 */
function encodeToken(payload: SessionPayload): string {
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Decode and verify a signed token. Returns the payload if valid, null otherwise.
 */
function decodeToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSig = sign(payloadB64);

  // Timing-safe comparison to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }

  try {
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr) as SessionPayload;

    if (typeof payload.userId !== "number" || typeof payload.exp !== "number") {
      return null;
    }

    // Check expiration
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Create a session for the given admin user ID.
 * 1. Generate a unique session ID
 * 2. Store session in DynamoDB (server-side session store)
 * 3. Set a signed cookie with the session reference
 */
export async function createSession(userId: number): Promise<void> {
  const sessionId = randomUUID();
  const expiresAtMs = Date.now() + SESSION_MAX_AGE * 1000;
  const expiresAtSec = Math.floor(expiresAtMs / 1000);

  // Store in DynamoDB
  await storeSession({
    sessionId,
    userId: String(userId),
    expiresAt: expiresAtSec,
    createdAt: new Date().toISOString(),
  });

  // Set signed cookie
  const payload: SessionPayload = {
    sessionId,
    userId,
    exp: expiresAtMs,
  };

  const token = encodeToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the currently authenticated admin user from the session cookie.
 * 1. Read and verify the HMAC-signed cookie
 * 2. Look up the session in DynamoDB (confirms not revoked)
 * 3. Look up the admin user in PostgreSQL
 * Returns the admin user record or null if not authenticated.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  // Verify session still exists in DynamoDB (handles server-side revocation)
  try {
    const session = await findSessionById(payload.sessionId);
    if (!session) return null;
  } catch {
    // DynamoDB unavailable — fall through to deny access
    return null;
  }

  try {
    return await findAdminUserById(payload.userId);
  } catch {
    return null;
  }
}

/**
 * Destroy the current session by removing it from DynamoDB and clearing the cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Delete from DynamoDB if we can read the session ID
  if (token) {
    const payload = decodeToken(token);
    if (payload?.sessionId) {
      try {
        await deleteSessionById(payload.sessionId);
      } catch {
        // Best effort — clear the cookie regardless
      }
    }
  }

  // Clear the cookie
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Revoke all sessions for a given user.
 * Useful for password changes or forced logout.
 */
export async function revokeAllSessions(userId: number): Promise<void> {
  await deleteSessionsByUserId(String(userId));
}
