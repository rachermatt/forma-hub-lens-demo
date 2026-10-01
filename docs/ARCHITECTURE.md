# Architecture and APS endpoints

## Demo boundary

This repository is **demo-only**. `LENS_MODE` defaults to `demo` and rejects any other value. The hub identifier is a fixed fictional ID; no real `FORMA_HUB_ID` is used. The optional Live hub link navigates to a separate deployment and cannot enable live access in this app.

The original [live repository](https://github.com/autodesk-platform-services/forma-hub-lens) remains separate, including its Hub Admin / Executive Overview checks and write authorization.

## Runtime

- Next.js App Router, React, TypeScript, and Node.js 24.x.
- Node's SQLite runtime is used for the bundled fictional reporting and portfolio data in memory.
- Each process initializes the same fictional snapshot, anchored at October 1, 2026, 12:00 UTC. A cold start does not need a persistent disk or shared SQLite file.
- The dataset is immutable to public visitors; server mutations and APS hub calls are blocked.
- Client state handles administrative simulations; browser-local storage handles personal bookmarks, favorites, and review decisions.

No persistent database, Redis service, or Vercel writable-volume configuration is required for the demo. Process-local synthetic data is not used to store OAuth state or sessions.

## Autodesk identity flow

1. `/api/aps/login` generates random browser-bound OAuth state and redirects to Autodesk authorization.
2. An authenticated encrypted, HttpOnly state cookie binds the callback to that browser. It expires after ten minutes and is cleared on callback.
3. `/api/aps/callback` verifies state and exchanges Autodesk's one-use authorization code on the server.
4. The app retrieves the signed-in Autodesk profile and requires a stable Autodesk identity.
5. It creates an AES-256-GCM encrypted identity session containing the verified profile and an absolute eight-hour expiry.
6. APS access and refresh tokens are discarded; there is no token storage or refresh worker.
7. Sign-out clears the application session cookie.

Cookies use HttpOnly and SameSite=Lax; public HTTPS deployments also use Secure. The same random `DEMO_SESSION_SECRET` must be configured for all instances within a deployment environment. Changing it invalidates existing cookies. Cookies are not centralized sessions: logout clears the browser cookie, and an already copied cookie remains subject to its expiry. Keep cookies and the encryption key private.

## APS endpoints used by the demo

| Purpose | Endpoint |
| --- | --- |
| Authorize | `https://developer.api.autodesk.com/authentication/v2/authorize` |
| Exchange authorization code | `https://developer.api.autodesk.com/authentication/v2/token` |
| Verify identity | `https://api.userprofile.autodesk.com/userinfo` |

Requested scopes are `user-profile:read openid`. The application type is **Traditional Web App**, with the client secret held server-side. See [APS OAuth documentation](https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/App-types/) and [User Profile](https://aps.autodesk.com/en/docs/profile/v1/overview/).

The demo does not call account administration, project administration, Data Connector, Files, Assets, Issues, Reviews, Classifications, or other APS hub endpoints. Retained shared modules and test fixtures do not authorize those calls; the demo deployment gate blocks them.

## Data and presentation

`demoFixtures.ts` generates fictional Data Connector-style tables. The demo seed combines these with fictional portfolio, job, permission, integration, and closeout examples. Existing query and dashboard engines operate on those tables, allowing a realistic read experience without customer data.

The persistent banner and sample labels distinguish synthetic data from sign-in identity. Fixture dates are relative to the fixed synthetic snapshot clock and are illustrative. No externally configured data contract, real extract, or customer document is imported.

## State and exports

Administrative previews and results exist only in the current React view. They are not server audit entries and do not update other pages' source dataset. Bookmarks, favorite tools, and review decisions are browser-local; they do not synchronize or trigger monitoring. Exports, where exposed, contain fictional records only. Autodesk file downloads and handover package generation are disabled.

## Deployment

[Vercel configuration](DEPLOYMENT.md) supplies credentials and the shared cookie key through environment variables. The public domain's exact callback must be registered with the separate demo APS application. There is no need to provision the client in a real Forma hub.
