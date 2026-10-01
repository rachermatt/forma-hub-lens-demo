import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { decodeIdentityCookie, encodeIdentityCookie, issueOAuthState, verifyOAuthState, OAUTH_TTL_SECONDS, SESSION_TTL_SECONDS, demoSecretProblem } from "../src/lib/demoCookies.ts";

const secret = randomBytes(32).toString("hex");
process.env.LENS_MODE = "demo";
process.env.APS_CLIENT_ID = "demo-test-client";
process.env.APS_CLIENT_SECRET = "demo-test-secret";
process.env.APS_CALLBACK_URL = "https://demo.example.test/api/aps/callback";
process.env.DEMO_SESSION_SECRET = secret;
delete process.env.FORMA_HUB_ID;
const audience = `${process.env.APS_CLIENT_ID}|${process.env.APS_CALLBACK_URL}`;
const { SCOPES, SESSION_COOKIE, OAUTH_STATE_COOKIE, buildAuthorizeUrl, consumeBrowserState, exchangeCode, refreshIfNeeded, readSession } = await import("../src/lib/aps/auth.ts");
const { apsFetch, requireLiveApsSession } = await import("../src/lib/aps/client.ts");
const { getTwoLeggedToken } = await import("../src/lib/aps/twoLegged.ts");
const { verifyHubAccess } = await import("../src/lib/aps/authorization.ts");
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; process.env.LENS_MODE = "demo"; delete process.env.FORMA_HUB_ID; });

function tamper(value: string): string {
  const pieces = value.split(".");
  pieces[2] = (pieces[2][0] === "A" ? "B" : "A") + pieces[2].slice(1);
  return pieces.join(".");
}

test("demo requests identity scopes only and authenticates browser-bound encrypted state", () => {
  assert.deepEqual(SCOPES, ["user-profile:read", "openid"]);
  assert.equal(SESSION_COOKIE, "forma_demo_session");
  assert.equal(OAUTH_STATE_COOKIE, "forma_demo_oauth_state");
  const { url, state, browserState } = buildAuthorizeUrl();
  assert.deepEqual(new URL(url).searchParams.get("scope")?.split(" "), SCOPES);
  assert.equal(consumeBrowserState(state, browserState), true);
  assert.equal(consumeBrowserState(state, undefined), false);
  assert.equal(consumeBrowserState(state, state), false);
  assert.equal(consumeBrowserState(state, buildAuthorizeUrl().browserState), false);
  assert.equal(consumeBrowserState(state, tamper(browserState)), false);
  assert.equal(consumeBrowserState("live.forged", browserState), false);
});

test("OAuth state expires after ten minutes and is bound to client and callback", () => {
  const now = 1_000_000;
  const pending = issueOAuthState(secret, audience, now);
  assert.equal(verifyOAuthState(pending.state, pending.cookie, secret, audience, now + OAUTH_TTL_SECONDS * 1_000 - 1), true);
  assert.equal(verifyOAuthState(pending.state, pending.cookie, secret, audience, now + OAUTH_TTL_SECONDS * 1_000), false);
  assert.equal(verifyOAuthState(pending.state, pending.cookie, secret, "another-client|another-callback", now), false);
  assert.equal(verifyOAuthState(pending.state, pending.cookie, randomBytes(32).toString("hex"), audience, now), false);
  assert.equal(verifyOAuthState(pending.state, pending.cookie, secret, audience, now - 61_000), false);
});

test("identity cookies reject alteration, wrong audience, wrong key, wrong purpose and expiry", () => {
  const now = 2_000_000;
  const identity = { id: "opaque-demo-id", userId: "autodesk-subject", userName: "Visitor", userEmail: "visitor@example.test", expiresAt: now + SESSION_TTL_SECONDS * 1_000 };
  const cookie = encodeIdentityCookie(identity, secret, audience, now);
  assert.deepEqual(decodeIdentityCookie(cookie, secret, audience, now), identity);
  assert.equal(cookie.includes(identity.userId), false);
  assert.equal(cookie.includes(identity.userEmail), false);
  assert.equal(decodeIdentityCookie(tamper(cookie), secret, audience, now), null);
  assert.equal(decodeIdentityCookie(cookie, secret, "another-deployment", now), null);
  assert.equal(decodeIdentityCookie(cookie, randomBytes(32).toString("hex"), audience, now), null);
  assert.equal(decodeIdentityCookie(cookie, secret, audience, identity.expiresAt), null);
  assert.equal(decodeIdentityCookie(issueOAuthState(secret, audience, now).cookie, secret, audience, now), null);
  assert.equal(decodeIdentityCookie("forged-live-session-id", secret, audience, now), null);
  assert.throws(() => encodeIdentityCookie({ ...identity, expiresAt: now + SESSION_TTL_SECONDS * 1_000 + 1 }, secret, audience, now), /Invalid demo identity/);
  assert.throws(() => encodeIdentityCookie({ ...identity, userId: "\u0000".repeat(256), userName: "\u0000".repeat(256), userEmail: "\u0000".repeat(320) }, secret, audience, now), /cookie size limit/);
});

test("identity validation works in another cold server process without a database", () => {
  const now = Date.now();
  const identity = { id: "cold-start-demo", userId: "verified-subject", userName: null, userEmail: null, expiresAt: now + 60_000 };
  const cookie = encodeIdentityCookie(identity, secret, audience, now);
  const output = execFileSync(process.execPath, ["--conditions=react-server", "--import", "./scripts/resolve-ts.mjs", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--input-type=module", "-e",
    "import {decodeIdentityCookie} from './src/lib/demoCookies.ts'; const identity=decodeIdentityCookie(process.env.TEST_COOKIE,process.env.DEMO_SESSION_SECRET,process.env.TEST_AUDIENCE); process.stdout.write(JSON.stringify(identity));"],
    { cwd: process.cwd(), env: { ...process.env, TEST_COOKIE: cookie, TEST_AUDIENCE: audience }, encoding: "utf8" });
  assert.deepEqual(JSON.parse(output), identity);
});

test("verified Autodesk identity produces a token-free session and all hub APIs remain denied", async () => {
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/authentication/v2/token")) {
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("redirect_uri"), process.env.APS_CALLBACK_URL);
      return Response.json({ access_token: "temporary-aps-token", refresh_token: "discard-me", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.endsWith("/userinfo")) {
      assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer temporary-aps-token");
      return Response.json({ sub: "verified-visitor", name: "Visitor", email: "visitor@example.test" });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const session = await exchangeCode("one-use-autodesk-code");
  assert.equal(session.mode, "demo");
  assert.equal(session.userId, "verified-visitor");
  assert.equal(session.accessToken, "");
  assert.equal(session.refreshToken, null);
  assert.equal(session.hubRole, null);
  assert.equal(session.hubVerifiedAt, null);
  assert.equal(calls.length, 2);
  const cookie = encodeIdentityCookie({ id: session.id, userId: session.userId!, userName: session.userName, userEmail: session.userEmail, expiresAt: session.expiresAt }, secret, audience);
  assert.deepEqual(readSession(cookie), session);
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error("Network prohibited"); };
  await assert.rejects(() => apsFetch(session, "/construction/admin/v1/accounts/real-hub/projects"), /disabled/);
  await assert.rejects(() => getTwoLeggedToken(), /disabled/);
  assert.throws(() => requireLiveApsSession(session), /disabled/);
  assert.equal((await verifyHubAccess("", session.userEmail)).ok, false);
  assert.equal(await refreshIfNeeded({ ...session, expiresAt: Date.now() - 1 }), null);
  assert.equal(await refreshIfNeeded({ ...session, mode: "live" }), null);
  assert.equal(networkCalls, 0);
});

test("unverified or missing Autodesk identity fails closed", async () => {
  for (const profile of [{ name: "No ID" }, { sub: 123 }, { sub: " ", userId: false }]) {
    globalThis.fetch = async (input) => String(input).endsWith("/authentication/v2/token")
      ? Response.json({ access_token: "temporary-token", token_type: "Bearer" }) : Response.json(profile);
    await assert.rejects(() => exchangeCode("code"), /verifiable user identity/);
  }
  globalThis.fetch = async (input) => String(input).endsWith("/authentication/v2/token")
    ? Response.json({ access_token: "temporary-token", token_type: "Bearer" }) : new Response(null, { status: 401 });
  await assert.rejects(() => exchangeCode("code"), /could not verify/);
});

test("live runtime configuration blocks authorization, session admission and APS exchange", async () => {
  process.env.LENS_MODE = "live";
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Network prohibited"); };
  assert.throws(() => buildAuthorizeUrl(), /configuration/);
  assert.equal(readSession("anything"), null);
  assert.equal(consumeBrowserState("demo.forged", "anything"), false);
  await assert.rejects(() => exchangeCode("code"), /configuration/);
  assert.equal(calls, 0);
});

test("session encryption keys reject short, missing and invalid encodings", () => {
  assert.equal(demoSecretProblem(secret), null);
  for (const value of [undefined, "", "short", "a".repeat(63), "g".repeat(64), "a".repeat(128)]) {
    assert.ok(demoSecretProblem(value));
  }
});
