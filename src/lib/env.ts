import "server-only";
import { DEMO_HUB_ID, demoCallbackProblem, hubDeploymentUrl, lensMode } from "./demoConfig";
import { demoSecretProblem } from "./demoCookies";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get mode() { return lensMode(); },
  get demoMode() { return lensMode() === "demo"; },
  get demoHubUrl() { return hubDeploymentUrl(process.env.LENS_DEMO_URL); },
  get liveHubUrl() { return hubDeploymentUrl(process.env.LENS_LIVE_URL); },
  get clientId() {
    return required("APS_CLIENT_ID");
  },
  get clientSecret() {
    return required("APS_CLIENT_SECRET");
  },
  get callbackUrl() {
    return required("APS_CALLBACK_URL");
  },
  get demoSessionSecret() {
    const secret = required("DEMO_SESSION_SECRET");
    if (demoSecretProblem(secret)) throw new Error("Invalid DEMO_SESSION_SECRET configuration.");
    return secret;
  },
  get hubId() {
    lensMode();
    return DEMO_HUB_ID;
  },
  get region() {
    const region = process.env.FORMA_REGION?.trim().toUpperCase();
    return region && region.length > 0 ? region : undefined;
  },
  get dataDir() {
    return process.env.DATA_DIR?.trim() || ".data";
  },
  /**
   * Set on deployments with no persistent disk,
   * where the cache is wiped on every restart, redeploy or idle spin-down.
   * Purely cosmetic — it drives a warning banner so the data loss is expected
   * rather than mysterious.
   */
  get ephemeralStorage() {
    const value = process.env.EPHEMERAL_STORAGE?.trim().toLowerCase();
    return value === "true" || value === "1";
  },
};

/** Reports config problems without throwing, so the UI can show a setup screen. */
export function configProblems(): string[] {
  const problems: string[] = [];
  try { lensMode(); } catch (error) { problems.push((error as Error).message); }
  for (const name of ["APS_CLIENT_ID", "APS_CLIENT_SECRET", "APS_CALLBACK_URL"]) {
    if (!process.env[name]) problems.push(`${name} is not set`);
  }
  const secretProblem = demoSecretProblem(process.env.DEMO_SESSION_SECRET);
  if (secretProblem) problems.push(secretProblem);
  const callbackProblem = demoCallbackProblem(process.env.APS_CALLBACK_URL);
  if (callbackProblem) problems.push(callbackProblem);
  if (process.env.FORMA_HUB_ID?.trim() && process.env.FORMA_HUB_ID.trim() !== DEMO_HUB_ID) {
    problems.push("FORMA_HUB_ID must not identify a real hub in the synthetic demo. Remove this variable.");
  }
  for (const name of ["LENS_DEMO_URL", "LENS_LIVE_URL"]) {
    if (process.env[name]?.trim() && !hubDeploymentUrl(process.env[name])) problems.push(`${name} must be an http(s) deployment URL without credentials, query or fragment.`);
  }
  const region = process.env.FORMA_REGION?.trim().toUpperCase();
  if (region && !["US", "EMEA", "AUS"].includes(region)) {
    problems.push(`FORMA_REGION must be US, EMEA or AUS (got "${region}")`);
  }
  return problems;
}
