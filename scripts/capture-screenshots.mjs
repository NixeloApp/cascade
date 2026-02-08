import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotDir = join(__dirname, "..", "e2e", "screenshots", "design-review");

mkdirSync(screenshotDir, { recursive: true });

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  const pages = [
    { url: "http://localhost:5173/", name: "01-landing" },
    { url: "http://localhost:5173/signin", name: "02-signin" },
    { url: "http://localhost:5173/signup", name: "03-signup" },
  ];

  for (const p of pages) {
    try {
      await page.goto(p.url, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: join(screenshotDir, `${p.name}.png`),
        fullPage: false,
      });
      console.log(`Captured: ${p.name}`);
    } catch (e) {
      console.log(`Failed: ${p.name} - ${e.message}`);
    }
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${screenshotDir}`);
}

captureScreenshots();
