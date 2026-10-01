# Public synthetic demo boundaries

## Purpose

Allow an ordinary Autodesk account to explore Forma Hub Lens without membership or administrative rights in a real hub. Preserve a clear boundary between real sign-in identity and fictional portfolio data.

The persistent banner is:

> Synthetic demo hub — hub data and actions are simulated. Autodesk is used only for sign-in.

## Isolation

- A separate public repository: [rachermatt/forma-hub-lens](https://github.com/rachermatt/forma-hub-lens).
- A separate demo APS Traditional Web App with identity scopes only.
- A demo-only runtime that rejects live mode and uses a fixed fictional hub identifier.
- In-memory, seeded, immutable synthetic portfolio data.
- No APS hub reads or writes, no customer imports, and no retained APS tokens.
- Browser-only simulations and browser-local personal preferences.

The [live repository](https://github.com/autodesk-platform-services/forma-hub-lens) and its Hub Admin / Executive Overview checks are separate. No code or configuration change in this repository switches the demo into the live build. Optional deployment links navigate between separate websites.

## Allowed external Autodesk traffic

Only OAuth authorization, token exchange, and User Profile identity verification are needed. The token exchange occurs on the server. APS tokens are discarded after the user profile is verified. No custom integration in a real hub is needed.

## Sign-in and privacy

The signed-in user's identity is real and appears in the account controls. A short-lived encrypted cookie carries that identity; it is not added to the fictional people directory. Session expiry is eight hours. OAuth state is browser-bound and expires after ten minutes.

The demo does not store a server-side directory of visitors or persist access/refresh tokens. Deployment-provider request logs may still exist according to that provider's settings. Do not log credentials, cookies, authorization codes, or tokens.

## Simulated actions

Bulk add/remove membership, project creation, and archiving occur only in the current client view. Product choices illustrate requested access; no subscription is assigned. No invitation is sent. Results are verified against the view's simulated workspace and reset when the view is reset or left.

Sample recipes, integration manifests, extraction schedules, and closeout profiles/evidence are immutable examples. They do not create background work, public-feed polling, live project scans, or an administrative audit.

## Browser-local state

Saved views, watchlist bookmarks, tool favorites, and review decisions are conveniences stored in the browser. They do not create automated monitoring or notifications and do not synchronize between devices. Clearing site storage removes them. They are not acceptance records or evidence of a real administrative action.

## Hosting

Use the [Vercel deployment guide](DEPLOYMENT.md). The deployment target is [forma-hub-lens.vercel.app](https://forma-hub-lens.vercel.app/). That address is a target, not proof that the latest repository version is deployed. Publishing source and configuring Vercel are separate steps.
