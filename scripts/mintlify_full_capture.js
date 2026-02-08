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
  console.log("\n🚀 MINTLIFY FULL INTERNAL CAPTURE");
  console.log("================================================");
  console.log("Login → Complete Signup → Explore Dashboard");
  console.log("================================================\n");

  const secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, "utf-8"));
  const { email, password } = secrets.google;

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
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

  try {
    // ============ STEP 1: LOGIN ============
    console.log("\n[1] Opening Mintlify login...");
    await page.goto("https://dashboard.mintlify.com/login", { waitUntil: "load" });
    await page.waitForTimeout(2000);
    await screenshot(page, "login-page");

    // Click Google login
    const googleBtn = page
      .locator('button:has-text("Continue with Google"), a:has-text("Continue with Google")')
      .first();
    if (await googleBtn.isVisible()) {
      await googleBtn.click();
      await page.waitForTimeout(3000);
    }

    // Handle Google OAuth
    if (page.url().includes("accounts.google.com")) {
      console.log("[2] Google OAuth...");

      // Check if we need to select account or enter credentials
      const useAnotherBtn = page.locator('text="Use another account"');
      if (await useAnotherBtn.isVisible().catch(() => false)) {
        await useAnotherBtn.click();
        await page.waitForTimeout(2000);
      }

      // Enter email
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(email);
        await page.click("#identifierNext");
        await page.waitForTimeout(3000);
      }

      // Enter password
      const passInput = page.locator('input[type="password"]');
      await passInput.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
      if (await passInput.isVisible().catch(() => false)) {
        await passInput.fill(password);
        await page.click("#passwordNext");
        await page.waitForTimeout(5000);
      }

      await screenshot(page, "google-auth");
    }

    // Wait for redirect back to Mintlify
    console.log("[3] Waiting for Mintlify...");
    await page.waitForURL("https://dashboard.mintlify.com/**", { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await screenshot(page, "after-login");
    await saveHtml(page, "after-login");

    // ============ STEP 2: COMPLETE ONBOARDING ============
    console.log("\n[4] Completing any onboarding...");
    await page.waitForTimeout(3000);

    // Check if we're on the onboarding form
    const pageContent = await page.content();
    if (pageContent.includes("Get Started with Mintlify") || pageContent.includes("First name")) {
      console.log("   Found onboarding form, filling...");

      // Fill first name using ID selector
      const firstNameInput = page.locator("#first-name");
      if (await firstNameInput.isVisible().catch(() => false)) {
        await firstNameInput.clear();
        await firstNameInput.fill("Agent");
        console.log("   Filled first name");
      }
      await page.waitForTimeout(500);

      // Fill last name using ID selector
      const lastNameInput = page.locator("#last-name");
      if (await lastNameInput.isVisible().catch(() => false)) {
        await lastNameInput.clear();
        await lastNameInput.fill("Smith");
        console.log("   Filled last name");
      }
      await page.waitForTimeout(500);

      // Fill company name using ID selector - THIS IS REQUIRED!
      const companyInput = page.locator("#company-name");
      if (await companyInput.isVisible().catch(() => false)) {
        await companyInput.fill("Nixelo Research Lab");
        console.log("   Filled company name");
      }
      await page.waitForTimeout(500);

      await screenshot(page, "onboarding-filled");

      // Wait for button to become enabled
      await page.waitForTimeout(1000);

      // Click Continue button
      console.log("   Clicking Continue...");
      const continueBtn = page.locator('button:has-text("Continue"):not([disabled])').first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(5000);
        console.log("   Clicked Continue!");
      } else {
        // Try clicking even if disabled detection fails
        await page
          .locator('button:has-text("Continue")')
          .first()
          .click()
          .catch(() => {});
        await page.waitForTimeout(5000);
      }

      await screenshot(page, "after-onboarding-submit");
    }

    // Check for any other onboarding steps
    for (let i = 0; i < 5; i++) {
      const nextBtn = page
        .locator(
          'button:has-text("Continue"), button:has-text("Next"), button:has-text("Get Started"), button:has-text("Skip")',
        )
        .first();
      if (await nextBtn.isVisible().catch(() => false)) {
        console.log(`   Clicking through step ${i + 1}...`);
        await screenshot(page, `onboarding-step-${i}`);
        await nextBtn.click();
        await page.waitForTimeout(3000);
      } else {
        break;
      }
    }

    await screenshot(page, "after-onboarding");

    // ============ STEP 3: EXPLORE DASHBOARD ============
    console.log("\n[5] Exploring dashboard...");

    // Capture current page
    await screenshot(page, "dashboard-home");
    await saveHtml(page, "dashboard-home");

    // Discover and capture all nav links
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      const routes = [];
      const seen = new Set();

      for (const el of links) {
        const href = el.getAttribute("href") || "";
        const text = el.innerText.trim().slice(0, 30);

        if (
          (href.startsWith("/") || href.includes("dashboard.mintlify.com")) &&
          !href.includes("logout")
        ) {
          const fullUrl = href.startsWith("/") ? `https://dashboard.mintlify.com${href}` : href;

          if (!seen.has(fullUrl)) {
            routes.push({ url: fullUrl, text: text || href });
            seen.add(fullUrl);
          }
        }
      }
      return routes;
    });

    console.log(`   Found ${navLinks.length} internal links`);

    // Capture each unique page
    const capturedUrls = new Set([page.url()]);

    for (const link of navLinks.slice(0, 25)) {
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
      } catch (err) {
        console.log(`     ⚠️ Skipped: ${err.message.split("\n")[0]}`);
      }
    }

    // Try explicit routes
    const explicitRoutes = [
      "/settings",
      "/settings/general",
      "/settings/team",
      "/settings/billing",
      "/editor",
      "/analytics",
      "/customize",
      "/customize/theme",
    ];

    console.log("\n[6] Trying explicit routes...");
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
      } catch (_err) {
        // Skip
      }
    }

    console.log(`\n✨ Captured ${capturedUrls.size} pages total`);

    // Save session
    await context.storageState({ path: path.join(OUTPUT_DIR, "session.json") });
    console.log("💾 Session saved");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await screenshot(page, "error");
  }

  // Close and rename video
  console.log("\n📹 Saving video...");
  await context.close();
  await browser.close();

  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find((f) => f.endsWith(".webm") && !f.includes("exploration"));
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "full-exploration.webm");
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video: full-exploration.webm");
  }

  console.log(`\n🎉 Done! Files in: ${OUTPUT_DIR}\n`);
}

main();
