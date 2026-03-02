import { describe, it, expect } from "vitest";
import { pollForReady } from "../dev-server";
import http from "http";

describe("Dev Server Manager", () => {
  it("polls until server is ready", async () => {
    const server = http.createServer((_, res) => {
      res.writeHead(200);
      res.end("ok");
    });
    await new Promise<void>((resolve) => server.listen(4199, resolve));

    try {
      const ready = await pollForReady(4199, 5000, 500);
      expect(ready).toBe(true);
    } finally {
      server.close();
    }
  });

  it("returns false when server never starts", async () => {
    const ready = await pollForReady(4198, 2000, 500);
    expect(ready).toBe(false);
  });
});
