import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../docs/research/library/mintlify/dashboard");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Clear old numbered screenshots
const oldFiles = fs.readdirSync(OUTPUT_DIR).filter((f) => f.match(/^\d+-.*\.png$/));
for (const f of oldFiles) {
  fs.unlinkSync(path.join(OUTPUT_DIR, f));
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
  console.log("\n🚀 MINTLIFY AUTO-CAPTURE");
  console.log("========================");
  console.log("1. A browser will open");
  console.log("2. Login and complete onboarding");
  console.log("3. Script will AUTO-DETECT when you're on dashboard");
  console.log("4. It will then capture everything automatically");
  console.log("========================\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled", "--start-maximized"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  console.log("📡 Opening Mintlify...\n");
  await page.goto("https://dashboard.mintlify.com/login", { waitUntil: "load" });

  // Wait for user to reach dashboard (auto-detect)
  console.log("⏳ Waiting for you to login and reach the dashboard...");
  console.log("   (Looking for dashboard URL pattern)\n");

  let attempts = 0;
  const maxAttempts = 120; // 2 minutes max wait

  while (attempts < maxAttempts) {
    try {
      const url = page.url();
      const content = await page.content();

      // Check if we're on dashboard (not login, not onboarding)
      const isOnDashboard =
        url.includes("dashboard.mintlify.com") &&
        !url.includes("/login") &&
        !content.includes("Get Started with Mintlify") &&
        !content.includes("First name") &&
        (content.includes("Overview") ||
          content.includes("Settings") ||
          content.includes("Documentation") ||
          content.includes("Analytics") ||
          content.includes("Deployments"));

      if (isOnDashboard) {
        console.log("✅ Dashboard detected! Starting capture...\n");
        break;
      }

      await page.waitForTimeout(1000);
      attempts++;

      if (attempts % 10 === 0) {
        console.log(
          `   Still waiting... (${attempts}s) - Current: ${url.split("/").slice(3).join("/") || "/"}`,
        );
      }
    } catch (_err) {
      console.log("   Browser closed or navigating...");
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
    }
  }

  if (attempts >= maxAttempts) {
    console.log("⏰ Timeout waiting for dashboard. Capturing current state anyway...\n");
  }

  try {
    // Save session
    await context.storageState({ path: path.join(OUTPUT_DIR, "session.json") });
    console.log("💾 Session saved\n");

    // Capture current page
    await screenshot(page, "dashboard");
    await saveHtml(page, "dashboard");

    // Find and click navigation items
    console.log("🔍 Exploring navigation...\n");

    const navSelectors = [
      { text: "Settings", name: "settings" },
      { text: "Editor", name: "editor" },
      { text: "Analytics", name: "analytics" },
      { text: "Customize", name: "customize" },
      { text: "Pages", name: "pages" },
    ];

    for (const nav of navSelectors) {
      try {
        const link = page
          .locator(`a:has-text("${nav.text}"), button:has-text("${nav.text}")`)
          .first();
        if (await link.isVisible({ timeout: 2000 })) {
          await link.click();
          await page.waitForTimeout(2000);
          await screenshot(page, nav.name);
          await saveHtml(page, nav.name);
          console.log(`   ✓ Captured ${nav.name}`);
        }
      } catch (_err) {
        console.log(`   ✗ Could not find ${nav.name}`);
      }
    }

    // Look for settings sub-nav
    console.log("\n📋 Checking settings tabs...");
    try {
      await page.goto("https://dashboard.mintlify.com/settings", {
        waitUntil: "load",
        timeout: 15000,
      });
      await page.waitForTimeout(2000);

      const settingsTabs = ["General", "Team", "Billing", "Domains", "Integrations"];
      for (const tab of settingsTabs) {
        try {
          const tabEl = page.locator(`button:has-text("${tab}"), a:has-text("${tab}")`).first();
          if (await tabEl.isVisible({ timeout: 1500 })) {
            await tabEl.click();
            await page.waitForTimeout(1500);
            await screenshot(page, `settings-${tab.toLowerCase()}`);
            console.log(`   ✓ settings/${tab.toLowerCase()}`);
          }
        } catch (_err) {
          // skip
        }
      }
    } catch (_err) {
      console.log("   Could not navigate to settings");
    }

    console.log(`\n✅ Capture complete!`);
    console.log(`📁 Files saved to: ${OUTPUT_DIR}\n`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    await screenshot(page, "error");
  }

  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find((f) => f.endsWith(".webm") && f.length > 30);
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "auto-capture.webm");
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log("📹 Video: auto-capture.webm");
  }
}

main();
