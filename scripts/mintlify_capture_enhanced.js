import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../docs/research/library/mintlify/dashboard");
const SECRETS_PATH = path.resolve(__dirname, "../secrets.json");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Clear old screenshots
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
  return filePath;
}

async function saveHtml(page, name) {
  const html = await page.content();
  fs.writeFileSync(path.join(OUTPUT_DIR, `${name}.html`), html);
}

async function waitAndClick(page, selector, description) {
  console.log(`   Waiting for: ${description}...`);
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1000);
  await el.click();
  console.log(`   ✓ Clicked: ${description}`);
  await page.waitForTimeout(2000);
}

async function main() {
  console.log("\n🚀 MINTLIFY DASHBOARD CAPTURE - ENHANCED");
  console.log("================================================");
  console.log("Using slow, careful Google OAuth flow");
  console.log("================================================\n");

  const secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, "utf-8"));
  const { email, password } = secrets.google;

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Slow down all actions
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    locale: "en-US",
    timezoneId: "America/Chicago",
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 900 },
    },
  });

  const page = await context.newPage();

  // Hide automation indicators
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    window.chrome = { runtime: {} };
  });

  try {
    // ============ STEP 1: MINTLIFY LOGIN PAGE ============
    console.log("[1] Opening Mintlify login...");
    await page.goto("https://dashboard.mintlify.com/login", {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);
    await screenshot(page, "mintlify-login");

    // ============ STEP 2: CLICK GOOGLE LOGIN ============
    console.log("\n[2] Clicking Google login...");
    await waitAndClick(
      page,
      'button:has-text("Continue with Google"), button:has-text("Sign in with Google")',
      "Google login button",
    );
    await page.waitForTimeout(3000);
    await screenshot(page, "google-redirect");

    // ============ STEP 3: GOOGLE OAUTH FLOW ============
    console.log("\n[3] Handling Google OAuth...");

    // Wait for Google page
    await page.waitForURL(/accounts\.google\.com/, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await screenshot(page, "google-page");

    // Check if we need to enter email or select account
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // Try "Use another account" first if visible
    const useAnotherBtn = page.locator('text="Use another account"');
    if (await useAnotherBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await useAnotherBtn.click();
      await page.waitForTimeout(2000);
    }

    // Enter email if needed
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("   Entering email...");
      await emailInput.fill(email);
      await page.waitForTimeout(1000);
      await screenshot(page, "google-email-filled");

      // Click Next
      await page.locator('#identifierNext, button:has-text("Next")').first().click();
      await page.waitForTimeout(5000);
      await screenshot(page, "after-email-next");
    }

    // Enter password if needed
    const passInput = page.locator('input[type="password"]:visible');
    await passInput.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});

    if (await passInput.isVisible().catch(() => false)) {
      console.log("   Entering password...");
      await passInput.fill(password);
      await page.waitForTimeout(1000);
      await screenshot(page, "google-password-filled");

      // Click Next
      await page.locator('#passwordNext, button:has-text("Next")').first().click();
      await page.waitForTimeout(5000);
      await screenshot(page, "after-password-next");
    }

    // Handle consent/allow if prompted
    const allowBtn = page.locator('button:has-text("Allow"), button:has-text("Continue")');
    if (await allowBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("   Clicking Allow/Continue...");
      await allowBtn.first().click();
      await page.waitForTimeout(5000);
    }

    await screenshot(page, "after-google-auth");

    // ============ STEP 4: WAIT FOR MINTLIFY REDIRECT ============
    console.log("\n[4] Waiting for Mintlify redirect...");
    await page.waitForURL(/dashboard\.mintlify\.com/, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(5000);
    await screenshot(page, "mintlify-after-oauth");

    // ============ STEP 5: COMPLETE ONBOARDING IF PRESENT ============
    console.log("\n[5] Checking for onboarding...");
    const pageContent = await page.content();

    if (
      pageContent.includes("Get Started") ||
      pageContent.includes("First name") ||
      pageContent.includes("Company name")
    ) {
      console.log("   Found onboarding form!");

      // Fill company name (first/last name should be pre-filled from Google)
      const companyInput = page
        .locator('#company-name, input[placeholder*="Company"], input[name*="company"]')
        .first();
      if (await companyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyInput.fill("Nixelo Research Lab");
        console.log("   ✓ Filled company name");
        await page.waitForTimeout(1000);
      }

      await screenshot(page, "onboarding-filled");

      // Click Continue
      const continueBtn = page.locator('button:has-text("Continue"):not([disabled])').first();
      if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await continueBtn.click();
        console.log("   ✓ Clicked Continue");
        await page.waitForTimeout(5000);
      }

      await screenshot(page, "after-onboarding");

      // Handle additional onboarding steps
      for (let i = 0; i < 5; i++) {
        const nextBtn = page
          .locator(
            'button:has-text("Continue"), button:has-text("Next"), button:has-text("Get Started"), button:has-text("Skip")',
          )
          .first();
        if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   Onboarding step ${i + 1}...`);
          await screenshot(page, `onboarding-step-${i}`);
          await nextBtn.click();
          await page.waitForTimeout(3000);
        } else {
          break;
        }
      }
    }

    // ============ STEP 6: CAPTURE DASHBOARD ============
    console.log("\n[6] Capturing dashboard...");
    await page.waitForTimeout(3000);
    await screenshot(page, "dashboard-home");
    await saveHtml(page, "dashboard-home");

    // Discover links
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

    console.log(`   Found ${navLinks.length} internal links`);

    // Capture each page
    const capturedUrls = new Set([page.url()]);

    for (const link of navLinks.slice(0, 30)) {
      if (capturedUrls.has(link.url)) continue;
      capturedUrls.add(link.url);

      const safeName =
        link.text
          .replace(/[^a-z0-9]/gi, "-")
          .toLowerCase()
          .slice(0, 25) || "page";
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

    // Save session
    await context.storageState({ path: path.join(OUTPUT_DIR, "mintlify_session.json") });
    console.log("\n💾 Session saved");

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
  const videoFile = files.find(
    (f) => f.endsWith(".webm") && !f.includes("dashboard") && !f.includes("exploration"),
  );
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "dashboard-capture.webm");
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video: dashboard-capture.webm");
  }

  console.log(`\n🎉 Done! Files in: ${OUTPUT_DIR}\n`);
}

main();
