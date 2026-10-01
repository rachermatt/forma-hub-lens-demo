import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { DEMO_HUB_ID, demoCallbackProblem, hubDeploymentUrl, lensMode } from "../src/lib/demoConfig.ts";

process.env.LENS_MODE = "demo";
process.env.APS_CLIENT_ID = "test-demo-client";
process.env.APS_CLIENT_SECRET = "test-demo-secret";
process.env.APS_CALLBACK_URL = "http://localhost:3003/api/aps/callback";
process.env.DEMO_SESSION_SECRET = randomBytes(32).toString("hex");
delete process.env.FORMA_HUB_ID;
const { configProblems, env } = await import("../src/lib/env.ts");

test("this repository is always synthetic and rejects live or unknown runtime modes", () => {
  assert.equal(lensMode(""), "demo");
  assert.equal(lensMode(" DEMO "), "demo");
  assert.throws(() => lensMode("live"), /demo-only/);
  assert.throws(() => lensMode("pretend-admin"), /LENS_MODE/);
  assert.equal(env.hubId, DEMO_HUB_ID);
  assert.deepEqual(configProblems(), []);
  process.env.LENS_MODE = "live";
  assert.ok(configProblems().some((message) => message.includes("demo-only")));
  assert.throws(() => env.hubId, /demo-only/);
  process.env.LENS_MODE = "demo";
  process.env.FORMA_HUB_ID = "a-real-autodesk-hub";
  assert.ok(configProblems().some((message) => message.includes("must not identify a real hub")));
  delete process.env.FORMA_HUB_ID;
  const original = process.env.DEMO_SESSION_SECRET;
  delete process.env.DEMO_SESSION_SECRET;
  assert.ok(configProblems().some((message) => message.includes("DEMO_SESSION_SECRET")));
  process.env.DEMO_SESSION_SECRET = original;
});

test("deployment links and public demo OAuth callbacks reject unsafe URL configurations", () => {
  assert.equal(hubDeploymentUrl("https://live.example.com"), "https://live.example.com/");
  for (const value of ["javascript:alert(1)", "https://user:pass@example.com", "https://example.com?mode=live", "https://example.com/#token"]) {
    assert.equal(hubDeploymentUrl(value), undefined);
  }
  for (const value of ["https://demo.example.com/api/aps/callback", "http://localhost:3003/api/aps/callback", "http://[::1]:3003/api/aps/callback"]) {
    assert.equal(demoCallbackProblem(value), null);
  }
  for (const value of ["http://demo.example.com/api/aps/callback", "https://demo.example.com/wrong", "https://u:p@demo.example.com/api/aps/callback", "https://demo.example.com/api/aps/callback?x=1"]) {
    assert.ok(demoCallbackProblem(value));
  }
});
