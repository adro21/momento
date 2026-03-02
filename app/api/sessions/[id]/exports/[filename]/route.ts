import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SESSIONS_DIR } from "@/lib/constants";

const CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  gif: "image/gif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const { id, filename } = await params;
  const filePath = path.join(SESSIONS_DIR, id, "exports", filename);
  const ext = filename.split(".").pop() ?? "mp4";

  try {
    const buffer = await fs.readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
}
