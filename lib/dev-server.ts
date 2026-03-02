import { spawn, ChildProcess } from "child_process";
import http from "http";

export interface ManagedServer {
  process: ChildProcess;
  port: number;
  kill: () => void;
}

export function startDevServer(
  command: string,
  cwd: string,
  port: number
): ManagedServer {
  const [cmd, ...args] = command.split(" ");
  const proc = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: "pipe",
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "development",
      BROWSER: "none",
    },
  });

  return {
    process: proc,
    port,
    kill: () => {
      proc.kill("SIGTERM");
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          // already dead
        }
      }, 5000);
    },
  };
}

export async function pollForReady(
  port: number,
  timeout: number,
  interval: number = 1000
): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
          res.resume();
          resolve();
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          reject(new Error("timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  return false;
}
