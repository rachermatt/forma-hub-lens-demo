# Usage and local setup

## What this build does

Forma Hub Lens (Demo) lets an Autodesk user explore a fictional portfolio. Autodesk provides sign-in identity only. Every hub record and administrative result is simulated.

The banner remains visible throughout the application:

> Synthetic demo hub — hub data and actions are simulated. Autodesk is used only for sign-in.

No Hub Admin or Executive Overview role is required. The separate live application still enforces those roles.

## Local setup

1. Install Node.js 24.x and npm.
2. Create a separate APS **Traditional Web App** and enable User Profile access.
3. Register `http://localhost:3000/api/aps/callback` on that application. If retaining another localhost callback for a separate local preview, keep it as an additional callback.
4. Run `npm ci` and copy `.env.example` to `.env.local`.
5. Set the demo client ID, client secret, exact callback, and a random `DEMO_SESSION_SECRET` of 64 hexadecimal characters. Keep `LENS_MODE=demo`.
6. Run `npm run dev` and open [localhost:3000](http://localhost:3000).

Generate the session key privately with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not set a real hub ID or reuse the live application's credentials. No Custom Integration registration in a real hub is needed. Filled-in `.env.local` files are excluded from Git.

## Suggested walkthrough

### Observe

Start at **Overview** for sample KPIs, the attention queue, favorite tools, and activity summaries. The fictional snapshot is fixed at October 1, 2026, 12:00 UTC and is reproduced across cold starts. Dates and freshness badges belong to that snapshot; they do not report a live Autodesk refresh.

Open **Projects → Project inventory**. **Project members** counts assigned fictional memberships. **Active people (observed)** counts distinct identities seen in the sample activity window. These are different metrics. Use sorting to compare members, observed activity, services, or sheets, then open a project profile.

### Investigate

Use **People & Access** for the directory, access matrix, permission explorer, and offboarding plan examples. Person and company profiles connect the sample relationships. The identity in the account menu is your Autodesk identity; it is not one of the fictional portfolio members.

Under **Insights**, open any of the 21 tool dashboards, filter **Activity**, or inspect grouped **Governance** findings. Multi-selection uses checkboxes and Select all shown. No observed activity is a sample-window observation, not a finding that a real project is inactive. Personal governance and lifecycle review decisions appear on individual rows; they do not remove findings from, or change counts in, the fixed sample portfolio summaries.

### Review data and closeout

Under **Data**, inspect sample extracts, Data Health, and Integration Health. Read a sample integration manifest and its migration or contract findings. No production pipeline is contacted and no scheduler is started.

Under **Projects → Closeout**, inspect a project, its turnover profile, source evidence, and exception list. The document metadata and asset relationships are fictional. This demo does not download project files or produce an accepted handover package.

### Practice administration

Open **Admin → Bulk management**. Choose sample projects and fictional email addresses, preview an operation, check the confirmation box, and run the simulation. The simulator verifies against its own in-memory workspace and displays simulated results. **Reset simulation** restores the initial view; leaving the view also resets it.

Try adding members, removing members, creating projects, and archiving projects. Product choices are demonstration inputs, not subscriptions or entitlements. The provisioning recipe is an immutable example.

## Personal browser state

Saved views, watchlist entries, governance/lifecycle review decisions, and favorite tools are stored locally in the browser. They are not server audit records, cross-device preferences, notifications, or scheduled checks. Clearing browser storage removes them. **Reset my demo preferences** clears saved views, watchlist entries, and governance/lifecycle decisions for the signed-in account in this browser. Tool favorites are separate and can be changed in the tool library. Shared computers require the same care as any browser-local bookmark store.

## Sign-out and session expiry

The encrypted identity session expires after eight hours. Sign out to clear the application's cookie; this does not sign out of Autodesk globally. Sign in again after expiry. No APS access or refresh token is retained after identity verification.

For public hosting, follow [Vercel deployment](DEPLOYMENT.md).
