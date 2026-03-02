import { NextResponse } from "next/server";
import { SessionManager } from "@/lib/session";
import { exportVideo, ExportOptions } from "@/lib/video-export";
import { SESSIONS_DIR } from "@/lib/constants";

const sessions = new SessionManager(SESSIONS_DIR);

export async function POST(request: Request) {
  const { sessionId, format, fps, resolution } = await request.json();

  const session = await sessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const options: ExportOptions = {
      format: format ?? "mp4",
      fps: fps ?? 2,
      resolution,
    };
    const exportUrl = await exportVideo(session, SESSIONS_DIR, options);
    return NextResponse.json({ url: exportUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    );
  }
}
