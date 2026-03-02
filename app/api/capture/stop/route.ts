import { NextResponse } from "next/server";
import { cancelCapture } from "@/lib/active-captures";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  const cancelled = cancelCapture(sessionId);
  return NextResponse.json({ cancelled });
}
