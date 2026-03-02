import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import type { SessionManifest } from "./types";

export interface ExportOptions {
  format: "mp4" | "webm" | "gif";
  fps: number;
  resolution?: { width: number; height: number };
}

export async function exportVideo(
  session: SessionManifest,
  sessionsDir: string,
  options: ExportOptions
): Promise<string> {
  const framesDir = path.join(sessionsDir, session.id, "frames");
  const exportsDir = path.join(sessionsDir, session.id, "exports");
  await fs.mkdir(exportsDir, { recursive: true });

  const capturedFrames = session.frames
    .filter((f) => f.status === "captured")
    .sort((a, b) => a.index - b.index);

  if (capturedFrames.length === 0) {
    throw new Error("No captured frames to export");
  }

  // Create a temporary file list for ffmpeg concat
  const listPath = path.join(exportsDir, "frames.txt");
  const listContent = capturedFrames
    .map((f) => {
      const framePath = path.join(framesDir, f.filename);
      const duration = 1 / options.fps;
      return `file '${framePath}'\nduration ${duration}`;
    })
    .join("\n");
  const lastFrame = capturedFrames[capturedFrames.length - 1];
  const fullList = `${listContent}\nfile '${path.join(framesDir, lastFrame.filename)}'`;
  await fs.writeFile(listPath, fullList);

  const ext = options.format === "gif" ? "gif" : options.format;
  const outputFilename = `timelapse-${Date.now()}.${ext}`;
  const outputPath = path.join(exportsDir, outputFilename);

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg()
      .input(listPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-pix_fmt", "yuv420p"]);

    if (options.resolution) {
      cmd = cmd.size(`${options.resolution.width}x${options.resolution.height}`);
    }

    if (options.format === "gif") {
      cmd = cmd.outputOptions(["-vf", `fps=${options.fps},scale=640:-1:flags=lanczos`]);
    } else {
      cmd = cmd.videoCodec(options.format === "webm" ? "libvpx-vp9" : "libx264");
    }

    cmd
      .output(outputPath)
      .on("end", async () => {
        try { await fs.unlink(listPath); } catch {}
        resolve(`/api/sessions/${session.id}/exports/${outputFilename}`);
      })
      .on("error", (err) => reject(err))
      .run();
  });
}
