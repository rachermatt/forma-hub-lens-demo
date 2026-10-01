import { NextResponse } from "next/server";
import { buildAuthorizeUrl, OAUTH_STATE_COOKIE } from "@/lib/aps/auth";
import { configProblems, env } from "@/lib/env";
import { OAUTH_TTL_SECONDS } from "@/lib/demoCookies";

export const dynamic = "force-dynamic";

export async function GET() {
  const problems = configProblems();
  if (problems.length > 0) {
    return NextResponse.json({ error: "Configuration incomplete", problems }, { status: 500 });
  }
  const { url, browserState } = buildAuthorizeUrl();
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE, browserState, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.callbackUrl.startsWith("https://"),
    path: "/api/aps",
    maxAge: OAUTH_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
