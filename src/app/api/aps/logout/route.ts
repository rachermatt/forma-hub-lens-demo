import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/aps/auth";

export const dynamic = "force-dynamic";

/**
 * Ends the current session.
 *
 * Delete this browser's identity and pending OAuth cookies. A copied identity
 * cookie remains valid until its absolute expiry; no server session is stored.
 * POST only, so a stray link cannot sign someone out.
 */
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
