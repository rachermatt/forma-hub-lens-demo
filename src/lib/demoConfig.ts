/** Public demo identifiers are fictional and never identify an Autodesk hub. */
export const DEMO_HUB_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_HUB_NAME = "Northwind Builders · Sample hub";

export type LensMode = "live" | "demo";

export function lensMode(value = process.env.LENS_MODE): LensMode {
  const mode = value?.trim().toLowerCase() || "demo";
  if (mode !== "demo") throw new Error("This repository is demo-only. LENS_MODE must be demo; live mode is unavailable.");
  return "demo";
}

/** Mode links are deployment links, never a switch of authorization or storage. */
export function hubDeploymentUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return undefined;
    return url.toString();
  } catch { return undefined; }
}

/** Public demo sign-in requires TLS; HTTP is allowed only for local review. */
export function demoCallbackProblem(value: string | undefined): string | null {
  if (!value) return null; // Missing configuration is reported separately.
  try {
    const url = new URL(value);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/api/aps/callback" ||
      !(url.protocol === "https:" || (loopback && url.protocol === "http:"))) {
      return "Demo APS_CALLBACK_URL must use HTTPS (HTTP is allowed on localhost), end in /api/aps/callback, and contain no credentials, query or fragment.";
    }
    return null;
  } catch { return "Demo APS_CALLBACK_URL must be a valid absolute callback URL."; }
}
