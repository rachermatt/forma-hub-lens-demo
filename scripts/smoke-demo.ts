/** Exercise the production HTTP app with a locally minted test identity; no APS credentials are used. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { encodeIdentityCookie, SESSION_TTL_SECONDS } from "../src/lib/demoCookies.ts";
import { getDb, closeDb } from "../src/lib/db.ts";
import { TOOL_SPECS } from "../src/lib/dashboards/specs.ts";

const allocation = createServer();
allocation.listen(0, "127.0.0.1");
await once(allocation, "listening");
const port = (allocation.address() as { port: number }).port;
await new Promise<void>((resolve) => allocation.close(() => resolve()));
const base = `http://127.0.0.1:${port}`;
const callback = `${base}/api/aps/callback`;
const key = "a1".repeat(32); // Test-only key, never a deployed secret.
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  env: { ...process.env, LENS_MODE: "demo", APS_CLIENT_ID: "smoke-client", APS_CLIENT_SECRET: "smoke-secret",
    APS_CALLBACK_URL: callback, DEMO_SESSION_SECRET: key, FORMA_HUB_ID: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout!.on("data", (chunk) => { logs += String(chunk); });
server.stderr!.on("data", (chunk) => { logs += String(chunk); });
const cookie = encodeIdentityCookie({ id: "smoke-session", userId: "smoke-user", userName: "Demo Visitor",
  userEmail: "visitor@example.com", expiresAt: Date.now() + SESSION_TTL_SECONDS * 1_000 }, key, `smoke-client|${callback}`);
const headers = { Cookie: `forma_demo_session=${cookie}` };
try {
  let started = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Production server exited: ${logs.slice(-2000)}`);
    try { await fetch(base); started = true; break; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  assert.ok(started, "production server did not start");
  const publicHome = await fetch(base);
  assert.equal(publicHome.status, 200);
  assert.match(await publicHome.text(), /Sign in to the demo with Autodesk/);
  const protectedApi = await fetch(`${base}/api/dashboards/issues`);
  assert.equal(protectedApi.status, 401);
  const login = await fetch(`${base}/api/aps/login`, { redirect: "manual" });
  assert.equal(login.status, 307);
  const authorize = new URL(login.headers.get("location")!);
  assert.equal(authorize.origin, "https://developer.api.autodesk.com");
  assert.equal(authorize.searchParams.get("scope"), "user-profile:read openid");
  assert.match(login.headers.get("set-cookie") ?? "", /HttpOnly/);
  const invalidCallback = await fetch(`${base}/api/aps/callback?code=not-real&state=forged`);
  assert.equal(invalidCallback.status, 400);
  const db = getDb();
  const project = (db.prepare("SELECT id FROM projects ORDER BY id LIMIT 1").get() as { id: string }).id;
  const person = (db.prepare("SELECT id FROM ds_admin_users LIMIT 1").get() as { id: string }).id;
  const company = (db.prepare("SELECT id FROM ds_admin_companies LIMIT 1").get() as { id: string }).id;
  const manifest = (db.prepare("SELECT id FROM integration_manifests LIMIT 1").get() as { id: string }).id;
  const assigned = (db.prepare("SELECT project_id FROM closeout_assignments LIMIT 1").get() as { project_id: string }).project_id;
  const pages = ["/", "/projects", "/people", "/people?view=matrix", "/activity", "/tools", "/governance", "/lifecycle",
    "/extracts", "/data-health", "/integrations", "/integrations/schema", "/integrations/inventory", "/integrations/watch",
    `/integrations/${manifest}`, "/closeout", "/closeout/profiles", `/closeout/${assigned}`, "/manage", "/recipes",
    "/offboarding", "/permissions", "/views", "/search?q=Northwind", `/projects/${project}`, `/people/${person}`, `/companies/${company}`];
  for (const page of pages) {
    const response = await fetch(`${base}${page}`, { headers });
    assert.equal(response.status, 200, `${page}: ${logs.slice(-1500)}`);
    const html = await response.text();
    assert.match(html, /Synthetic demo hub/, page);
    assert.doesNotMatch(html, /Sign in to the demo with Autodesk/, `${page} must accept the encrypted test identity`);
    assert.doesNotMatch(html, /An error occurred in the Server Components render/, page);
  }
  for (const spec of TOOL_SPECS) {
    const response = await fetch(`${base}/api/dashboards/${spec.id}`, { headers });
    assert.equal(response.status, 200, spec.id);
    assert.equal((await response.json()).enabled, true, spec.id);
  }
  const upload = await fetch(`${base}/api/dataset/upload`, { method: "POST", headers });
  assert.equal(upload.status, 403, "real dataset upload must be disabled");
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  const logout = await fetch(`${base}/api/aps/logout`, { method: "POST", headers });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  console.log(`Production HTTP smoke passed: ${pages.length} pages, ${TOOL_SPECS.length} dashboards, sign-in boundaries, upload denial, health and logout.`);
} finally {
  closeDb();
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
}
