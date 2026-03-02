import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { CaptureConfig, SessionManifest, FrameMetadata } from "./types";

export class SessionManager {
  private sessionsDir: string;

  constructor(sessionsDir: string) {
    this.sessionsDir = sessionsDir;
  }

  async create(
    config: CaptureConfig,
    repoName: string,
    totalCommits: number,
    sampledCommits: number
  ): Promise<SessionManifest> {
    const id = uuidv4();
    const sessionDir = path.join(this.sessionsDir, id);
    await fs.mkdir(path.join(sessionDir, "frames"), { recursive: true });
    await fs.mkdir(path.join(sessionDir, "exports"), { recursive: true });

    const manifest: SessionManifest = {
      id,
      createdAt: new Date().toISOString(),
      config,
      repoName,
      totalCommits,
      sampledCommits,
      frames: [],
      status: "capturing",
    };

    await fs.writeFile(
      path.join(sessionDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    return manifest;
  }

  async list(): Promise<SessionManifest[]> {
    try {
      const entries = await fs.readdir(this.sessionsDir, { withFileTypes: true });
      const sessions: SessionManifest[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const manifest = await this.get(entry.name);
          if (manifest) sessions.push(manifest);
        }
      }
      return sessions.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  async get(id: string): Promise<SessionManifest | null> {
    try {
      const data = await fs.readFile(
        path.join(this.sessionsDir, id, "manifest.json"), "utf-8"
      );
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async update(id: string, updates: Partial<SessionManifest>): Promise<void> {
    const manifest = await this.get(id);
    if (!manifest) throw new Error(`Session ${id} not found`);
    const updated = { ...manifest, ...updates };
    await fs.writeFile(
      path.join(this.sessionsDir, id, "manifest.json"),
      JSON.stringify(updated, null, 2)
    );
  }

  async addFrame(id: string, frame: FrameMetadata): Promise<void> {
    const manifest = await this.get(id);
    if (!manifest) throw new Error(`Session ${id} not found`);
    manifest.frames.push(frame);
    await fs.writeFile(
      path.join(this.sessionsDir, id, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
  }

  async delete(id: string): Promise<void> {
    await fs.rm(path.join(this.sessionsDir, id), { recursive: true, force: true });
  }

  getFramesDir(id: string): string {
    return path.join(this.sessionsDir, id, "frames");
  }

  getExportsDir(id: string): string {
    return path.join(this.sessionsDir, id, "exports");
  }
}
