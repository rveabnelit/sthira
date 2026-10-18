import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySessionByToken } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  const token = store.get("sthira_session")?.value;
  if (token) destroySessionByToken(token);
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set("sthira_session", "", { path: "/", maxAge: 0 });
  return response;
}
