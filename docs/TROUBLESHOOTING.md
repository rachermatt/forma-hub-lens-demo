# Troubleshooting

This guide is for the **demo-only** build. Never share client secrets, session keys, cookies, authorization codes, access tokens, or refresh tokens in screenshots, logs, or issue reports.

## Setup screen or missing configuration

Set `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_CALLBACK_URL`, and `DEMO_SESSION_SECRET`. Keep `LENS_MODE=demo` or leave it unset to use the demo default. The session key must contain exactly 64 hexadecimal characters.

For local development, use `.env.local` in the repository root and restart `npm run dev` after changes. For Vercel, set the variables for the correct environment and create a new deployment. Filled-in local environment files are ignored by Git.

Do not set a real `FORMA_HUB_ID`; this build uses a fixed fictional identifier. It cannot be converted to the live application with an environment toggle.

## Autodesk redirect or callback error

Check that the configured callback is registered on the **demo** APS application and matches the browser origin exactly:

- Local: `http://localhost:3000/api/aps/callback`.
- Existing public domain: `https://forma-hub-lens.vercel.app/api/aps/callback`.

Check the port, scheme, hostname, and path. Public callbacks must use HTTPS; plain HTTP is permitted only on loopback for local testing. The APS application must be a Traditional Web App with User Profile access. Do not use the live application's credentials.

## State mismatch or expired sign-in

Start sign-in again from the application's home page. The browser-bound state expires after ten minutes and is cleared on callback. A callback copied from another browser, a reused callback, a changed domain, blocked cookies, or an expired authorization attempt must fail.

Ensure the `DEMO_SESSION_SECRET` is stable across instances in the same Vercel environment. Rotating it intentionally invalidates existing sessions and pending authorization state.

## Sign-in succeeds but the session disappears

The identity session expires after eight hours; sign in again. Check HTTPS and cookie settings, the callback origin, the configured environment, and a stable session key. A Vercel cold start should not require a shared SQLite session file.

If a request is made through another domain, its cookies are separate. Start sign-in from the final public domain. Do not mix a deployment-preview URL with a production callback.

## Build fails or Node SQLite is unavailable

Use Node.js **24.x** locally and in Vercel. Run `npm ci` from the repository root, then `npm run typecheck` and `npm run build`. Retain the committed package lock. Use the Next.js framework preset and default output-directory handling.

## Vercel still shows the old site

Confirm the Vercel project's Git connection points to **rachermatt/forma-hub-lens**, the production branch is the expected branch in that repository, and the latest deployment shows the expected commit. Confirm the public domain is assigned to that deployment/project. Redeploying an old source commit does not import new demo source automatically.

A successful repository push does not prove a deployment completed. Review Vercel's build/runtime logs without exposing credentials.

## Simulated changes disappear or other pages do not change

This is expected. Bulk administrative changes stay in the current simulator view and reset when you leave or press Reset simulation. Other portfolio pages use the immutable fixture dataset. No real hub record was modified.

## Saved items or review decisions disappear

These use browser-local storage. They do not synchronize across devices and can be removed by clearing site data, private browsing, or browser policy. They are not a server audit or automated watchlist.

## Refresh, upload, monitor, or package action is unavailable

This is expected. The demo blocks APS hub calls and server-side dataset changes. Integration Health and Closeout show read-only seeded examples; they do not scan live data, schedule checks, retrieve files, or build deliverables.

## Sample data appears recent

Fixtures can use time-relative dates to make the demonstration readable. A recent date is not an Autodesk refresh. Check the persistent synthetic-data banner and source badges.

## Opening the optional Live hub link

That link opens a separate deployment with its own sign-in and authorization. Your demo session does not grant live-hub access. Configure `LENS_LIVE_URL` only when that separate destination is available and appropriate.
