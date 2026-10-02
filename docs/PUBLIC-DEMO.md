# Public synthetic demo boundaries

## Purpose

Allow anyone to explore Forma Hub Lens directly in a browser without an Autodesk account, hub membership, or administrative rights. All portfolio records and administrative results are fictional.

The persistent banner is:

> Synthetic demo hub — all data and administrative actions are simulated. No Autodesk sign-in required.

## Isolation

- A separate public repository: [rachermatt/forma-hub-lens-demo](https://github.com/rachermatt/forma-hub-lens-demo).
- An anonymous demo-only runtime that rejects live mode and uses a fixed fictional hub identifier.
- In-memory, seeded, immutable synthetic portfolio data.
- No APS API calls, customer imports, visitor identity verification, or APS token storage.
- Browser-only simulations and browser-local preferences.

The [live repository](https://github.com/autodesk-platform-services/forma-hub-lens) and its Autodesk sign-in, Hub Admin / Executive Overview checks, and Hub Admin write checks are separate. No code or configuration change in this repository switches the demo into the live build. Optional deployment links navigate between separate websites.

## Autodesk traffic and privacy

The demo does not redirect visitors to Autodesk, exchange tokens, call User Profile, or access a real Forma hub. It requires no APS application, credentials, callback registration, or session secret. Old demo login and callback links return to the home page.

No server-side directory of visitors is stored. Browser-local preferences have no account separation and may be visible to other people using the same browser profile. Deployment-provider request logs may still exist according to that provider's settings. Do not upload customer records or include credentials in logs and issue reports.

## Simulated actions

Bulk add/remove membership, project creation, and archiving occur only in the current client view. Product choices illustrate requested access; no subscription is assigned. No invitation is sent. Results are verified against the view's simulated workspace and reset when the view is reset or left.

Sample recipes, integration manifests, extraction schedules, and closeout profiles/evidence are immutable examples. They do not create background work, public-feed polling, live project scans, or an administrative audit.

## Browser-local state

Saved views, watchlist bookmarks, tool favorites, and review decisions are conveniences stored in the browser. They do not create automated monitoring or notifications and do not synchronize between devices. Clearing site storage removes them. They are not acceptance records or evidence of a real administrative action.

## Hosting

Use the [Vercel deployment guide](DEPLOYMENT.md). The deployment target is [forma-hub-lens.vercel.app](https://forma-hub-lens.vercel.app/). That address is a target, not proof that the latest repository version is deployed. Publishing source and deploying it through Vercel are separate steps. Preview URLs need no OAuth callback registration.
