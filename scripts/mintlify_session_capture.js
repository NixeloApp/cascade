import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../docs/research/library/mintlify/dashboard");
const SESSION_PATH = path.join(OUTPUT_DIR, "mintlify_session.json");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let screenshotIdx = 1;

async function screenshot(page, name) {
  const prefix = String(screenshotIdx++).padStart(2, "0");
  const filePath = path.join(OUTPUT_DIR, `${prefix}-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 ${prefix}-${name}.png`);
}

async function saveHtml(page, name) {
  const html = await page.content();
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.html`), html);
}

async function main() {
  console.log("\n🚀 MINTLIFY DASHBOARD CAPTURE WITH SESSION");
  console.log("============================================\n");

  if (!fs.existsSync(SESSION_PATH)) {
    console.error("❌ No session file found! Run mintlify_manual_capture.js first.");
    process.exit(1);
  }

  console.log("📂 Using saved session...\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    storageState: SESSION_PATH,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  try {
    // Navigate to dashboard home
    console.log("[1] Opening dashboard...");
    await page.goto("https://dashboard.mintlify.com", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(5000);
    await screenshot(page, "home");
    await saveHtml(page, "home");

    // Check if we're logged in
    const url = page.url();
    console.log(`   Current URL: ${url}`);

    if (url.includes("login")) {
      console.log("❌ Session expired - not logged in!");
      await browser.close();
      return;
    }

    // Click through navigation items
    const navItems = [
      { selector: 'a[href*="settings"], button:has-text("Settings")', name: "settings" },
      { selector: 'a[href*="editor"], button:has-text("Editor")', name: "editor" },
      { selector: 'a[href*="analytics"], button:has-text("Analytics")', name: "analytics" },
      { selector: 'a[href*="customize"], button:has-text("Customize")', name: "customize" },
      { selector: 'a[href*="pages"], button:has-text("Pages")', name: "pages" },
      { selector: 'a[href*="openapi"], button:has-text("OpenAPI")', name: "openapi" },
      {
        selector: 'a[href*="integrations"], button:has-text("Integrations")',
        name: "integrations",
      },
    ];

    for (const item of navItems) {
      try {
        const el = page.locator(item.selector).first();
        if (await el.isVisible({ timeout: 3000 })) {
          console.log(`   Clicking ${item.name}...`);
          await el.click();
          await page.waitForTimeout(3000);
          await screenshot(page, item.name);
          await saveHtml(page, item.name);

          // Go back to main for next click
          await page.goto("https://dashboard.mintlify.com", { waitUntil: "load", timeout: 30000 });
          await page.waitForTimeout(2000);
        }
      } catch (_err) {
        console.log(`   ⚠️ Could not capture ${item.name}`);
      }
    }

    // Capture settings sub-pages
    console.log("\n[2] Capturing settings...");
    await page.goto("https://dashboard.mintlify.com/settings", {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    await screenshot(page, "settings-main");

    const settingsTabs = ["general", "team", "billing", "domains", "integrations"];
    for (const tab of settingsTabs) {
      try {
        const tabEl = page.locator(`a[href*="${tab}"], button:has-text("${tab}")`).first();
        if (await tabEl.isVisible({ timeout: 2000 })) {
          await tabEl.click();
          await page.waitForTimeout(2000);
          await screenshot(page, `settings-${tab}`);
          await saveHtml(page, `settings-${tab}`);
        }
      } catch (_err) {
        console.log(`   ⚠️ Could not capture settings/${tab}`);
      }
    }

    console.log(`\n✨ Done! Screenshots saved to: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await screenshot(page, "error");
  }

  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find((f) => f.endsWith(".webm") && f.length > 30);
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "session-capture.webm");
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video: session-capture.webm");
  }
}

main();
