import { execSync } from "child_process";

let cachedResult: boolean | null = null;

export function isFFmpegAvailable(): boolean {
  if (cachedResult !== null) return cachedResult;
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
    cachedResult = true;
  } catch {
    cachedResult = false;
  }
  return cachedResult;
}
