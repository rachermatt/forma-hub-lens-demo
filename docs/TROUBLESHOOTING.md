# Troubleshooting

This guide is for the anonymous **demo-only** build. The current demo opens directly, makes no APS API calls, and requires no Autodesk account, credentials, callback registration, or session secret.

## The site still asks for Autodesk sign-in or shows a state-mismatch error

The deployed source is from the older sign-in-based demo. Open the home page directly and deploy the latest anonymous-demo commit from **rachermatt/forma-hub-lens-demo**. Old `/api/aps/login` and `/api/aps/callback` links return home in the current build; they do not run OAuth.

Check the Vercel deployment's source repository and commit. Redeploying an older source commit will preserve its old behavior. Remove obsolete `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, `APS_CALLBACK_URL`, and `DEMO_SESSION_SECRET` variables from the **demo Vercel project**, then create a new deployment of the latest source. The separate live application still requires its own Autodesk sign-in and credentials.

## Setup screen or invalid mode

Keep `LENS_MODE=demo` or leave it unset to use the demo default. This build rejects live mode. Do not set a real `FORMA_HUB_ID`; it uses a fixed fictional identifier and cannot be converted to the live application with an environment toggle.

No `.env.local` file is required. If using optional settings locally, place them in the repository root and restart `npm run dev` after changes. For Vercel, optional environment-variable changes apply to a new deployment. Local environment files are ignored by Git.

## Build fails or Node SQLite is unavailable

Use Node.js **24.x** locally and in Vercel. Run `npm ci` from the repository root, then `npm run typecheck` and `npm run build`. Retain the committed package lock. Use the Next.js framework preset and default output-directory handling.

## Vercel still shows the old site

Confirm the Vercel project's Git connection points to **rachermatt/forma-hub-lens-demo**, the production branch is the expected branch in that repository, and the latest deployment shows the expected commit. Confirm the public domain is assigned to that deployment/project. Redeploying an old source commit does not import new demo source automatically.

A successful repository push does not prove a deployment completed. Review Vercel's build/runtime logs without exposing credentials or customer records.

## Simulated changes disappear or other pages do not change

This is expected. Bulk administrative changes stay in the current simulator view and reset when you leave or press Reset simulation. Other portfolio pages use the immutable fixture dataset. No real hub record was modified.

## Saved items or review decisions disappear

These use browser-local storage. They do not synchronize across devices and can be removed by clearing site data, private browsing, or browser policy. Preview domains have separate site storage. There is no account separation within a browser profile; people using that profile share its demo preferences. Preferences are not a server audit or automated watchlist.

## Refresh, upload, monitor, or package action is unavailable

This is expected. The demo blocks APS API calls and server-side dataset changes. Integration Health and Closeout show read-only seeded examples; they do not scan live data, schedule checks, retrieve files, or build deliverables.

## Sample dates or freshness badges do not advance

The fixture snapshot is fixed at October 1, 2026, 12:00 UTC. Its dates illustrate the demonstration; they are not a live Autodesk refresh. Check the persistent synthetic-data banner and source badges.

## Opening the optional Live hub link

That link opens a separate deployment requiring Autodesk sign-in and its own authorization. Opening the demo grants no live-hub access. Configure `LENS_LIVE_URL` only when that separate destination is available and appropriate.
