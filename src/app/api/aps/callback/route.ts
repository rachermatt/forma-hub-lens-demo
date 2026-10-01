import { NextResponse, type NextRequest } from "next/server";
import { consumeBrowserState, exchangeCode, OAUTH_STATE_COOKIE, setSessionCookie } from "@/lib/aps/auth";
import { configProblems, env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Autodesk verifies identity only; this callback grants no live hub permissions. */
export async function GET(request: NextRequest) {
  if (configProblems().length > 0) {
    return clearOAuthState(errorPage("This deployment's APS configuration is incomplete. Ask its operator to check the setup."));
  }
  const params = request.nextUrl.searchParams;

  const error = params.get("error");
  if (error) {
    const description = params.get("error_description") ?? "";
    return clearOAuthState(errorPage(`Autodesk returned "${error}". ${description}`));
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return clearOAuthState(errorPage("The callback was missing the authorization code or state parameter."));
  }
  if (!consumeBrowserState(state, request.cookies.get(OAUTH_STATE_COOKIE)?.value)) {
    return clearOAuthState(errorPage(
      "State parameter did not match a pending sign-in. Start again from the sign-in button.",
    ));
  }

  try {
    const session = await exchangeCode(code);
    await setSessionCookie(session);
    return clearOAuthState(NextResponse.redirect(new URL("/", env.callbackUrl)));
  } catch (cause) {
    console.warn("Demo Autodesk sign-in did not complete.");
    return clearOAuthState(errorPage("Autodesk could not complete or verify sign-in. Please start sign-in again."));
  }
}

function clearOAuthState(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/api/aps", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function errorPage(
  message: string,
  heading = "Autodesk sign-in failed",
  status = 400,
): NextResponse {
  const hint = `<p style="color:#666;font-size:12px">Check that the separate demo APS app is a
         <strong>Traditional Web App</strong> and that this deployment's callback URL is
         registered on it.</p>`;

  const body = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(heading)}</title>
<style>
  body{background:#F5F5F0;color:#000;font:14px/1.6 Arial,sans-serif;padding:3rem}
  code{background:#fff;border:1px solid #D5D5CB;padding:.15rem .35rem;border-radius:3px}
  a{color:#1278AF}
  .box{max-width:46rem;border:1px solid #D5D5CB;border-radius:8px;padding:1.25rem;background:#fff}
</style></head>
<body><div class="box">
<h1 style="font-size:1rem;margin:0 0 .75rem;font-weight:700">${escapeHtml(heading)}</h1>
<p style="color:#666">${escapeHtml(message)}</p>
${hint}
<p><a href="/">Back to Forma Hub Lens</a></p>
</div></body></html>`;

  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );
}
