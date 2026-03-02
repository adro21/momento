import fs from "fs/promises";
import { SESSIONS_DIR } from "./constants";

let initialized = false;

export async function ensureDirs(): Promise<void> {
  if (initialized) return;
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
  initialized = true;
}
