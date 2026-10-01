/** Authenticated, encrypted cookies: no filesystem or process-local session state. */
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const OAUTH_TTL_SECONDS = 10 * 60;
const PREFIX = "fhld1";
const CLOCK_SKEW_MS = 60_000;

export function demoSecretProblem(secret: string | undefined): string | null {
  return secret && /^[a-fA-F0-9]{64}$/.test(secret)
    ? null : "DEMO_SESSION_SECRET must contain exactly 64 hexadecimal characters (32 cryptographically random bytes).";
}
function key(secret: string): Buffer {
  if (demoSecretProblem(secret)) throw new Error("Invalid demo session encryption key.");
  return Buffer.from(secret, "hex");
}
function seal(payload: Record<string, unknown>, secret: string, purpose: string, audience: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  cipher.setAAD(Buffer.from(`${PREFIX}|${purpose}|${audience}`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [PREFIX, iv.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}
function open(cookie: string, secret: string, purpose: string, audience: string): Record<string, unknown> | null {
  if (cookie.length > 3_800 || !/^fhld1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(cookie)) return null;
  try {
    const [, ivText, bodyText, tagText] = cookie.split(".");
    const iv = Buffer.from(ivText, "base64url");
    const tag = Buffer.from(tagText, "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(secret), iv);
    decipher.setAAD(Buffer.from(`${PREFIX}|${purpose}|${audience}`));
    decipher.setAuthTag(tag);
    const body = Buffer.concat([decipher.update(Buffer.from(bodyText, "base64url")), decipher.final()]);
    const value: unknown = JSON.parse(body.toString("utf8"));
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch { return null; }
}
function validTime(body: Record<string, unknown>, ttlSeconds: number, now: number): boolean {
  return Number.isSafeInteger(body.issuedAt) && Number.isSafeInteger(body.expiresAt) &&
    Number(body.issuedAt) <= now + CLOCK_SKEW_MS && Number(body.expiresAt) > now &&
    Number(body.expiresAt) > Number(body.issuedAt) &&
    Number(body.expiresAt) - Number(body.issuedAt) <= ttlSeconds * 1_000;
}
function text(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}
export function issueOAuthState(secret: string, audience: string, now = Date.now()): { state: string; cookie: string } {
  const state = `demo.${randomBytes(24).toString("base64url")}`;
  return { state, cookie: seal({ state, issuedAt: now, expiresAt: now + OAUTH_TTL_SECONDS * 1_000 }, secret, "oauth", audience) };
}
export function verifyOAuthState(state: string, cookie: string, secret: string, audience: string, now = Date.now()): boolean {
  if (!/^demo\.[A-Za-z0-9_-]{32}$/.test(state)) return false;
  const body = open(cookie, secret, "oauth", audience);
  if (!body || !validTime(body, OAUTH_TTL_SECONDS, now) || !text(body.state, 37)) return false;
  const expected = Buffer.from(body.state);
  const actual = Buffer.from(state);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export type DemoIdentity = {
  id: string; userId: string; userName: string | null; userEmail: string | null; expiresAt: number;
};
function nullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || (typeof value === "string" && value.length <= maxLength);
}
export function encodeIdentityCookie(identity: DemoIdentity, secret: string, audience: string, now = Date.now()): string {
  if (!text(identity.id, 64) || !text(identity.userId, 256) || !nullableText(identity.userName, 256) ||
      !nullableText(identity.userEmail, 320) || !Number.isSafeInteger(identity.expiresAt) || identity.expiresAt <= now ||
      identity.expiresAt - now > SESSION_TTL_SECONDS * 1_000) throw new Error("Invalid demo identity cookie payload.");
  const cookie = seal({ ...identity, issuedAt: now, mode: "demo" }, secret, "identity", audience);
  if (cookie.length > 3_800) throw new Error("Demo identity exceeds the cookie size limit.");
  return cookie;
}
export function decodeIdentityCookie(cookie: string, secret: string, audience: string, now = Date.now()): DemoIdentity | null {
  const body = open(cookie, secret, "identity", audience);
  if (!body || body.mode !== "demo" || !validTime(body, SESSION_TTL_SECONDS, now) || !text(body.id, 64) ||
      !text(body.userId, 256) || !nullableText(body.userName, 256) || !nullableText(body.userEmail, 320)) return null;
  return { id: body.id, userId: body.userId, userName: body.userName, userEmail: body.userEmail, expiresAt: Number(body.expiresAt) };
}
