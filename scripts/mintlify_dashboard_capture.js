import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../docs/research/library/mintlify/dashboard");
const SESSION_PATH = path.resolve(
  __dirname,
  "../docs/research/library/mintlify/onboarding/mintlify_session.json",
);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 ${name}.png`);
}

async function saveHtml(page, name) {
  const html = await page.content();
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.html`), html);
  console.log(`📄 ${name}.html`);
}

async function main() {
  console.log("\n🚀 MINTLIFY DASHBOARD DEEP CAPTURE");
  console.log("================================================");
  console.log("Capturing all internal pages with video recording");
  console.log("================================================\n");

  // Check for session
  if (!fs.existsSync(SESSION_PATH)) {
    console.error("❌ No Mintlify session found. Run mintlify_signup_capture.js first.");
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    storageState: SESSION_PATH,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Hide automation
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const capturedUrls = new Set();

  async function capturePage(url, name) {
    if (capturedUrls.has(url)) return;
    capturedUrls.add(url);

    console.log(`\n📡 Navigating to: ${url}`);
    try {
      await page.goto(url, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(3000);
      await screenshot(page, name);
      await saveHtml(page, name);
    } catch (err) {
      console.log(`   ⚠️ Error: ${err.message.split("\n")[0]}`);
    }
  }

  try {
    // Start at dashboard home
    await capturePage("https://dashboard.mintlify.com/", "01-dashboard-home");

    // Look for navigation links and capture discovered pages
    console.log("\n🔍 Discovering internal routes...");

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a, button"));
      const routes = [];
      const seen = new Set();

      const _keywords = [
        "settings",
        "project",
        "docs",
        "editor",
        "preview",
        "deploy",
        "api",
        "analytics",
        "team",
        "billing",
        "integrations",
        "domains",
        "customize",
        "theme",
        "navigation",
        "pages",
        "content",
        "seo",
        "search",
        "feedback",
        "changelog",
        "versions",
        "redirects",
        "openapi",
        "components",
        "snippets",
        "variables",
      ];

      for (const el of links) {
        const href = el.getAttribute("href") || "";
        const text = el.innerText.toLowerCase().trim();

        if (href.startsWith("/") || href.includes("dashboard.mintlify.com")) {
          const fullUrl = href.startsWith("/") ? `https://dashboard.mintlify.com${href}` : href;

          if (!seen.has(fullUrl) && !fullUrl.includes("logout")) {
            routes.push({ url: fullUrl, text: text.slice(0, 30) });
            seen.add(fullUrl);
          }
        }
      }

      return routes;
    });

    console.log(`   Found ${navLinks.length} internal routes`);

    // Capture each discovered route
    let idx = 2;
    for (const link of navLinks.slice(0, 30)) {
      // Limit to 30 pages
      const safeName = link.text.replace(/[^a-z0-9]/gi, "-").slice(0, 20) || "page";
      await capturePage(link.url, `${String(idx).padStart(2, "0")}-${safeName}`);
      idx++;
    }

    // Try common dashboard routes explicitly
    const commonRoutes = [
      { path: "/settings", name: "settings" },
      { path: "/settings/general", name: "settings-general" },
      { path: "/settings/team", name: "settings-team" },
      { path: "/settings/billing", name: "settings-billing" },
      { path: "/settings/domains", name: "settings-domains" },
      { path: "/settings/integrations", name: "settings-integrations" },
      { path: "/settings/api-keys", name: "settings-api" },
      { path: "/editor", name: "editor" },
      { path: "/analytics", name: "analytics" },
      { path: "/preview", name: "preview" },
      { path: "/deploy", name: "deploy" },
      { path: "/customize", name: "customize" },
      { path: "/customize/theme", name: "customize-theme" },
      { path: "/customize/navigation", name: "customize-nav" },
      { path: "/pages", name: "pages" },
      { path: "/openapi", name: "openapi" },
      { path: "/redirects", name: "redirects" },
      { path: "/search", name: "search" },
      { path: "/feedback", name: "feedback" },
    ];

    console.log("\n📋 Trying common dashboard routes...");
    for (const route of commonRoutes) {
      await capturePage(`https://dashboard.mintlify.com${route.path}`, `common-${route.name}`);
    }

    // Final summary
    console.log(`\n✨ Captured ${capturedUrls.size} unique pages`);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await screenshot(page, "error-state");
  }

  // Close and save video
  console.log("\n📹 Saving video...");
  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find((f) => f.endsWith(".webm"));
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "dashboard-exploration.webm");
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video: dashboard-exploration.webm");
  }

  console.log(`\n🎉 Done! Files in: ${OUTPUT_DIR}\n`);
}

main();
