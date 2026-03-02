import fs from "fs/promises";
import path from "path";

export interface ServerConfig {
  command: string;
  framework: "nextjs" | "vite" | "unknown";
  port: number;
}

export async function detectServerCommand(
  projectPath: string,
  port: number
): Promise<ServerConfig | null> {
  const pkgPath = path.join(projectPath, "package.json");
  let hasPackageJson = false;
  try {
    await fs.access(pkgPath);
    hasPackageJson = true;
  } catch {
    return null;
  }

  // Check for Next.js
  const nextConfigs = ["next.config.js", "next.config.mjs", "next.config.ts"];
  for (const config of nextConfigs) {
    try {
      await fs.access(path.join(projectPath, config));
      return { command: `npx next dev -p ${port}`, framework: "nextjs", port };
    } catch {
      continue;
    }
  }

  // Check for Vite
  const viteConfigs = ["vite.config.ts", "vite.config.js", "vite.config.mjs"];
  for (const config of viteConfigs) {
    try {
      await fs.access(path.join(projectPath, config));
      return { command: `npx vite --port ${port}`, framework: "vite", port };
    } catch {
      continue;
    }
  }

  // Fallback: check for dev script in package.json
  if (hasPackageJson) {
    try {
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
      if (pkg.scripts?.dev) {
        return { command: `npm run dev -- --port ${port}`, framework: "unknown", port };
      }
    } catch {}
  }

  return null;
}
