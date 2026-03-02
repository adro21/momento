import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function takeScreenshot(options: {
  url: string;
  outputPath: string;
  viewport: { width: number; height: number };
  waitTimeout?: number;
}): Promise<void> {
  const b = await getBrowser();
  const page = await b.newPage({
    viewport: options.viewport,
  });

  try {
    await page.goto(options.url, {
      waitUntil: "networkidle",
      timeout: options.waitTimeout ?? 30_000,
    });

    // Extra stability wait — let animations/renders settle
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: options.outputPath,
      fullPage: false,
      type: "png",
    });
  } finally {
    await page.close();
  }
}
