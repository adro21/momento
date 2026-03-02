import { NextResponse } from "next/server";
import { isFFmpegAvailable } from "@/lib/ffmpeg-check";

export async function GET() {
  return NextResponse.json({ ffmpeg: isFFmpegAvailable() });
}
