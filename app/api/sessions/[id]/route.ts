import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { SESSIONS_DIR } from "@/lib/constants";

const sessions = new SessionManager(SESSIONS_DIR);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await sessions.get(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sessions.delete(id);
  return NextResponse.json({ ok: true });
}
