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
  console.log("\n🚀 MINTLIFY MANUAL LOGIN + DASHBOARD CAPTURE");
  console.log("================================================");
  console.log("STEP 1: A browser will open - YOU log in manually");
  console.log("STEP 2: Once logged in to dashboard, press ENTER here");
  console.log("STEP 3: Script will capture all dashboard pages");
  console.log("================================================\n");

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled", "--start-maximized"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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

  // Open Mintlify login
  console.log("📡 Opening Mintlify login page...\n");
  await page.goto("https://dashboard.mintlify.com/login", { waitUntil: "load" });

  // Wait for user to login
  console.log("👆 Please log in manually in the browser window.");
  console.log("   Use agent.smith.starthub@gmail.com or any account with Mintlify access.");
  console.log("   Complete all onboarding steps if prompted.");
  console.log("\n⏳ Press ENTER here once you're on the dashboard...\n");

  // Wait for user input
  await new Promise((resolve) => {
    process.stdin.once("data", resolve);
  });

  console.log("\n✅ Capturing dashboard...\n");

  // Save session first
  await context.storageState({ path: SESSION_PATH });
  console.log("💾 Session saved to mintlify_session.json\n");

  try {
    // Capture current page (should be dashboard)
    await screenshot(page, "dashboard-home");
    await saveHtml(page, "dashboard-home");

    // Discover all nav links
    console.log("🔍 Discovering internal routes...");

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      const routes = [];
      const seen = new Set();

      for (const el of links) {
        const href = el.getAttribute("href") || "";
        const text = el.innerText.trim().slice(0, 40);

        if (
          (href.startsWith("/") || href.includes("dashboard.mintlify.com")) &&
          !href.includes("logout") &&
          !href.includes("login")
        ) {
          const fullUrl = href.startsWith("/") ? `https://dashboard.mintlify.com${href}` : href;

          if (!seen.has(fullUrl)) {
            routes.push({ url: fullUrl, text: text || href.split("/").pop() });
            seen.add(fullUrl);
          }
        }
      }
      return routes;
    });

    console.log(`   Found ${navLinks.length} internal links\n`);

    // Capture each page
    const capturedUrls = new Set([page.url()]);

    for (const link of navLinks.slice(0, 40)) {
      if (capturedUrls.has(link.url)) continue;
      capturedUrls.add(link.url);

      const safeName =
        link.text
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()
          .slice(0, 30) || "page";
      console.log(`   → ${safeName}`);

      try {
        await page.goto(link.url, { waitUntil: "load", timeout: 20000 });
        await page.waitForTimeout(2000);
        await screenshot(page, safeName);
        await saveHtml(page, safeName);
      } catch (_err) {
        console.log(`     ⚠️ Skipped`);
      }
    }

    // Also try explicit common routes
    const explicitRoutes = [
      "/settings",
      "/settings/general",
      "/settings/team",
      "/settings/billing",
      "/settings/domains",
      "/settings/integrations",
      "/editor",
      "/analytics",
      "/customize",
      "/customize/theme",
      "/customize/navigation",
      "/pages",
      "/openapi",
      "/redirects",
      "/search",
      "/feedback",
    ];

    console.log("\n📋 Trying explicit routes...");
    for (const route of explicitRoutes) {
      const url = `https://dashboard.mintlify.com${route}`;
      if (capturedUrls.has(url)) continue;
      capturedUrls.add(url);

      try {
        await page.goto(url, { waitUntil: "load", timeout: 15000 });
        await page.waitForTimeout(2000);
        const name = route.replace(/\//g, "-").slice(1) || "root";
        await screenshot(page, name);
        await saveHtml(page, name);
        console.log(`   ✓ ${name}`);
      } catch (_err) {
        console.log(`   ✗ ${route.slice(1)}`);
      }
    }

    console.log(`\n✨ Captured ${capturedUrls.size} unique pages`);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await screenshot(page, "error");
  }

  // Close and save video
  console.log("\n📹 Saving video...");
  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find(
    (f) => f.endsWith(".webm") && !f.includes("exploration") && !f.includes("dashboard"),
  );
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "dashboard-manual.webm");
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video: dashboard-manual.webm");
  }

  console.log(`\n🎉 Done! Files in: ${OUTPUT_DIR}\n`);
}

main();
