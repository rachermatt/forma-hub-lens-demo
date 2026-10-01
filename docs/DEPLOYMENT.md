# Vercel deployment

This guide deploys **Forma Hub Lens (Demo)** from [rachermatt/forma-hub-lens](https://github.com/rachermatt/forma-hub-lens). It does not deploy, configure, or publish the separate live repository.

## 1. Configure the demo APS application

Use a separate **Traditional Web App** with User Profile access. Register this exact callback for the existing public domain:

```text
https://forma-hub-lens.vercel.app/api/aps/callback
```

Keep any localhost callback needed for development, such as `http://localhost:3000/api/aps/callback`, as an additional registered callback. Existing separate localhost previews can retain their own callback entries. Use this demo application's credentials, not the live application's credentials. No real-hub Custom Integration registration is needed.

## 2. Connect Vercel to the demo repository

Import the demo repository as a Next.js project, or change the existing `forma-hub-lens` project's Git connection to this separate demo repository. For the existing domain, ensure `forma-hub-lens.vercel.app` remains assigned to this project.

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

## 3. Set Production environment variables

Enter values privately in the Vercel dashboard:

| Variable | Value |
| --- | --- |
| `LENS_MODE` | `demo` |
| `APS_CLIENT_ID` | Client ID of the separate demo APS application |
| `APS_CLIENT_SECRET` | Secret of the separate demo APS application |
| `APS_CALLBACK_URL` | `https://forma-hub-lens.vercel.app/api/aps/callback` |
| `DEMO_SESSION_SECRET` | A cryptographically random 32-byte key encoded as exactly 64 hexadecimal characters |
| `LENS_LIVE_URL` | Optional URL of a separately hosted live deployment; otherwise leave unset |

Generate the session key locally and paste it privately:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env.local`, copy local runtime databases, upload customer extracts, or set a real hub ID. Keep one stable session key across instances in the same deployment environment. Rotate it to invalidate existing demo cookies after suspected exposure.

Environment variable changes apply to new deployments. [Vercel environment-variable documentation](https://vercel.com/docs/environment-variables).

## 4. Deploy the new source

Deploy the latest commit in this **demo** repository. Redeploying an old deployment's source will not update it to the latest demo code. Confirm the deployment details show this repository and the expected new commit, then assign it to the existing production domain.

The app seeds its read-only synthetic dataset in memory on each process. Its sign-in state and session use encrypted browser cookies. It requires no persistent local SQLite file, Redis instance, scheduled worker, external storage, or writable volume.

## 5. Verify the public sample

- Open the production domain in a private browser window.
- Confirm the synthetic-data banner is present.
- Sign in with an ordinary Autodesk account that is not a member of a configured customer hub.
- Confirm the sample portfolio and all 21 dashboards load.
- Confirm no Hub Admin or Executive Overview role is requested.
- Try a bulk simulation and reset it; confirm its results are explicitly simulated.
- Confirm live refreshes, uploads, Data Connector requests, project scans, downloads, package generation, and scheduling are unavailable.
- Confirm saved items and review decisions stay local to the browser.
- Sign out, then confirm authenticated sample pages require sign-in again.

Automated tests cannot validate your APS credentials or public callback registration. An end-to-end public sign-in check is required after deployment.

## Preview deployments

A randomly generated preview domain is not automatically an APS callback. Use a stable preview domain with its exact callback registered, configure Preview environment variables separately, and keep Production settings intact. Do not use the production callback while testing a different origin. Alternatively, test locally and use the stable production domain for the final sign-in smoke test.

## Scope

This repository and its Vercel deployment are separate from the live APS application, the live GitHub repository, and any AWS/Dokku configuration. Publishing this repository does not change any of those services or replace an existing Vercel deployment automatically.

## Repository connection

Select **rachermatt/forma-hub-lens** in Vercel Git settings and verify the owner. If the project was previously linked through an old repository transfer or redirect, reconnect it to this newly created personal repository. Its GitHub repository ID is separate from the live Autodesk organization repository.
