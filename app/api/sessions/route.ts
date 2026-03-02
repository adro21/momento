import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { SESSIONS_DIR } from "@/lib/constants";
import { ensureDirs } from "@/lib/ensure-dirs";

const sessions = new SessionManager(SESSIONS_DIR);

export async function GET() {
  await ensureDirs();
  const list = await sessions.list();
  return NextResponse.json(list);
}
