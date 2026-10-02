# Vercel deployment

This guide deploys the anonymous **Forma Hub Lens (Demo)** from [rachermatt/forma-hub-lens-demo](https://github.com/rachermatt/forma-hub-lens-demo). It does not deploy, configure, or publish the separate live repository. Visitors open the synthetic portfolio directly; no Autodesk account or sign-in is required.

## 1. Connect Vercel to the demo repository

Import the demo repository as a Next.js project, or change the existing `forma-hub-lens` project's Git connection to this separate demo repository. For the existing public domain, ensure `forma-hub-lens.vercel.app` remains assigned to this project.

Recommended settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Next.js default |
| Node.js version | 24.x |
| Production branch | `main` in the demo repository |

Vercel's Production environment means the deployment associated with the public domain; it does not enable live-hub functionality. See [Vercel Git deployments](https://vercel.com/docs/git) and [supported Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## 2. Remove obsolete demo sign-in settings

The current public demo requires **no environment variables**. It does not need an APS application, client secret, OAuth callback, session secret, or Custom Integration registration in a hub.

If upgrading an earlier demo deployment, remove these obsolete values from this **demo Vercel project**:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_CALLBACK_URL`
- `DEMO_SESSION_SECRET`

Remove them from each environment where they were configured. Do not remove credentials or callbacks from the separate live application or its deployment.

Optional settings:

| Variable | Value |
| --- | --- |
| `LENS_MODE` | `demo`, or leave unset to use the demo default |
| `LENS_LIVE_URL` | Optional URL of a separately hosted live application; otherwise leave unset |

This build rejects live mode. Do not set a real `FORMA_HUB_ID`, copy local runtime databases, or upload customer extracts.

Environment-variable changes apply to new deployments. [Vercel environment-variable documentation](https://vercel.com/docs/environment-variables).

## 3. Deploy the latest demo source

Deploy the latest commit in this **demo** repository. Redeploying an old deployment's source will not update it to the latest anonymous-demo code. Confirm the deployment details show this repository and the expected new commit, then assign it to the existing production domain.

The app seeds its read-only synthetic dataset in memory on each process. It requires no persistent local SQLite file, Redis instance, scheduled worker, external storage, writable volume, authentication cookies, or session store.

## 4. Verify the public sample

- Open [forma-hub-lens.vercel.app](https://forma-hub-lens.vercel.app/) in a private browser window.
- Confirm the portfolio opens immediately without an Autodesk redirect or sign-in prompt.
- Confirm the banner reads **“Synthetic demo hub — all data and administrative actions are simulated. No Autodesk sign-in required.”**
- Confirm the sample portfolio and all 21 dashboards load.
- Confirm no Hub Admin or Executive Overview role is requested.
- Try a bulk simulation and reset it; confirm its results are explicitly simulated.
- Confirm live refreshes, uploads, Data Connector requests, project scans, downloads, package generation, and scheduling are unavailable.
- Confirm saved items and review decisions stay local to the browser.
- Confirm any optional **Live hub** link opens the separate live application, which still requires Autodesk sign-in and its own role checks.

Automated checks use fixtures and require no APS credentials. Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:smoke` locally; then verify the deployed site independently.

## Preview deployments

Preview URLs work without registering OAuth callbacks. No sign-in environment variables are needed for Preview or Production. Browser-local preferences belong to each site's origin and therefore do not automatically appear on another preview domain.

Old `/api/aps/login` and `/api/aps/callback` links return to the demo home page. If a deployed site still asks for credentials or displays a state-mismatch error, check that the latest anonymous-demo commit is deployed.

## Scope

This repository and its Vercel deployment are separate from the live APS application, the live GitHub repository, and any AWS/Dokku configuration. Publishing this repository does not change any of those services or replace an existing Vercel deployment automatically.

## Repository connection

Select **rachermatt/forma-hub-lens-demo** in Vercel Git settings and verify the owner. If the project was previously linked through an old repository transfer or redirect, reconnect it to this personal repository. Its GitHub repository ID is separate from the live Autodesk organization repository.
