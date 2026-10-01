import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { configProblems, env } from "../env";
import type { HubRole } from "./authorization";
import { AUTHORIZE_URL, TOKEN_URL, USERINFO_URL } from "./endpoints";
import { decodeIdentityCookie, encodeIdentityCookie, issueOAuthState, verifyOAuthState, SESSION_TTL_SECONDS } from "../demoCookies";

export { AUTHORIZE_URL, TOKEN_URL, USERINFO_URL } from "./endpoints";
export type SessionMode = "live" | "demo";
export const SESSION_COOKIE = "forma_demo_session";
export const OAUTH_STATE_COOKIE = "forma_demo_oauth_state";
export const DEMO_SCOPES = ["user-profile:read", "openid"];
export const SCOPES = DEMO_SCOPES;

/** Compatibility shape for the synthetic workflows. No Autodesk tokens are retained. */
export type Session = {
  id: string; mode: SessionMode; accessToken: string; refreshToken: string | null;
  expiresAt: number; scope: string | null; userId: string | null; userName: string | null;
  userEmail: string | null; hubVerifiedAt: number | null; hubRole: HubRole | null;
};

function assertConfiguration(): void {
  if (configProblems().length) throw new Error("The demo sign-in configuration is incomplete or invalid.");
}
function audience(): string { return `${env.clientId}|${env.callbackUrl}`; }

/** The encrypted browser cookie carries the pending state across serverless instances. */
export function buildAuthorizeUrl(): { url: string; state: string; browserState: string } {
  assertConfiguration();
  const { state, cookie: browserState } = issueOAuthState(env.demoSessionSecret, audience());
  const params = new URLSearchParams({
    response_type: "code", client_id: env.clientId, redirect_uri: env.callbackUrl,
    scope: SCOPES.join(" "), state,
  });
  return { url: `${AUTHORIZE_URL}?${params.toString()}`, state, browserState };
}

/** Authenticate the pending browser state; callback responses delete its cookie. */
export function consumeBrowserState(state: string, browserState: string | undefined): boolean {
  if (!browserState || configProblems().length) return false;
  return verifyOAuthState(state, browserState, env.demoSessionSecret, audience());
}

/** Verify an Autodesk identity, then discard the short-lived APS response and tokens. */
export async function exchangeCode(code: string): Promise<Session> {
  assertConfiguration();
  if (!code || code.length > 4_096) throw new Error("Invalid Autodesk authorization code.");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.clientId}:${env.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: env.callbackUrl }),
    cache: "no-store", signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Autodesk could not complete sign-in (${response.status}). Start sign-in again.`);
  const token = await response.json() as { access_token?: unknown; token_type?: unknown };
  if (typeof token.access_token !== "string" || !token.access_token || token.access_token.length > 16_384 ||
      typeof token.token_type !== "string" || token.token_type.toLowerCase() !== "bearer") {
    throw new Error("Autodesk returned an unreadable sign-in response.");
  }
  const identityResponse = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/json" },
    cache: "no-store", signal: AbortSignal.timeout(20_000),
  });
  if (!identityResponse.ok) throw new Error("Autodesk could not verify your identity. Start sign-in again.");
  const profile = await identityResponse.json() as { sub?: unknown; userId?: unknown; name?: unknown; email?: unknown };
  const userId = typeof profile.sub === "string" && profile.sub.trim()
    ? profile.sub.trim() : typeof profile.userId === "string" ? profile.userId.trim() : "";
  if (!userId || userId.length > 256) throw new Error("Autodesk did not return a verifiable user identity for the demo.");
  return {
    id: randomBytes(24).toString("base64url"), mode: "demo", accessToken: "", refreshToken: null,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1_000, scope: SCOPES.join(" "), userId,
    userName: typeof profile.name === "string" ? profile.name.slice(0, 256) : null,
    userEmail: typeof profile.email === "string" ? profile.email.slice(0, 320) : null,
    hubVerifiedAt: null, hubRole: null,
  };
}

/** Decode a verified identity cookie; neither a live session ID nor a raw user ID is accepted. */
export function readSession(cookie: string): Session | null {
  if (configProblems().length) return null;
  const identity = decodeIdentityCookie(cookie, env.demoSessionSecret, audience());
  if (!identity) return null;
  return {
    id: identity.id, mode: "demo", accessToken: "", refreshToken: null,
    expiresAt: identity.expiresAt, scope: SCOPES.join(" "), userId: identity.userId,
    userName: identity.userName, userEmail: identity.userEmail, hubVerifiedAt: null, hubRole: null,
  };
}
export async function getSession(): Promise<Session | null> {
  if (configProblems().length) return null;
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE)?.value;
  return cookie ? readSession(cookie) : null;
}

/** Identity sessions have an absolute expiry and never refresh Autodesk tokens. */
export async function refreshIfNeeded(session: Session): Promise<Session | null> {
  return session.mode === "demo" && !session.accessToken && !session.refreshToken &&
    session.userId && session.expiresAt > Date.now() ? session : null;
}
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
export const requirePortfolioAccess = requireSession;
export class UnauthorizedError extends Error {
  constructor() { super("Sign in with Autodesk to explore the synthetic demo."); this.name = "UnauthorizedError"; }
}
export class HubAdminRequiredError extends Error {
  constructor() { super("Live Autodesk administrative actions are disabled in this demo."); this.name = "HubAdminRequiredError"; }
}
/** There is no path from a demo identity to a live Autodesk administrative token. */
export async function requireHubAdminSession(): Promise<Session> {
  await requireSession();
  throw new HubAdminRequiredError();
}
/** Stateless logout removes the cookie. Rotating the encryption key invalidates every identity. */
export function destroySession(_id: string): void { /* No server-side session database. */ }
export async function setSessionCookie(session: Session): Promise<void> {
  assertConfiguration();
  if (session.mode !== "demo" || !session.userId || session.accessToken || session.refreshToken || session.hubRole) {
    throw new Error("Only a verified, token-free demo identity can create a cookie.");
  }
  const value = encodeIdentityCookie({ id: session.id, userId: session.userId,
    userName: session.userName, userEmail: session.userEmail, expiresAt: session.expiresAt }, env.demoSessionSecret, audience());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, {
    httpOnly: true, sameSite: "lax", secure: env.callbackUrl.startsWith("https://"), path: "/",
    maxAge: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1_000)),
  });
}
export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  const secure = process.env.APS_CALLBACK_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
  jar.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure, path: "/api/aps", maxAge: 0 });
}
