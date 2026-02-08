import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../docs/research/library/mintlify/onboarding");
const SECRETS_PATH = path.resolve(__dirname, "../secrets.json");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function screenshot(page, name) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 Screenshot: ${name}.png`);
}

async function main() {
  console.log("\n🚀 MINTLIFY SIGNUP FLOW CAPTURE");
  console.log("================================================");
  console.log("Recording video + screenshots of the full signup experience");
  console.log("================================================\n");

  const secrets = JSON.parse(fs.readFileSync(SECRETS_PATH, "utf-8"));
  const { email, password } = secrets.google;

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what's happening
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

  // Hide automation
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  let step = 1;

  try {
    // Step 1: Go to Mintlify signup
    console.log(`\n[${step}] Opening Mintlify signup page...`);
    await page.goto("https://dashboard.mintlify.com/signup", { waitUntil: "load" });
    await page.waitForTimeout(3000);
    await screenshot(page, `${String(step).padStart(2, "0")}-signup-page`);
    step++;

    // Step 2: Click "Continue with Google"
    console.log(`\n[${step}] Clicking 'Continue with Google'...`);
    const googleButton = page
      .locator('button:has-text("Continue with Google"), a:has-text("Continue with Google")')
      .first();
    if (await googleButton.isVisible()) {
      await googleButton.click();
      await page.waitForTimeout(3000);
    }
    await screenshot(page, `${String(step).padStart(2, "0")}-google-oauth`);
    step++;

    // Step 3: Handle Google login if needed
    if (page.url().includes("accounts.google.com")) {
      console.log(`\n[${step}] Google login - entering email...`);

      // Enter email
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.fill(email);
        await page.click("#identifierNext");
        await page.waitForTimeout(3000);
        await screenshot(page, `${String(step).padStart(2, "0")}-google-email`);
        step++;
      }

      // Enter password
      console.log(`\n[${step}] Google login - entering password...`);
      await page.waitForSelector('input[type="password"]', { timeout: 30000 });
      await page.fill('input[type="password"]', password);
      await screenshot(page, `${String(step).padStart(2, "0")}-google-password`);
      await page.click("#passwordNext");
      await page.waitForTimeout(5000);
      step++;
    }

    // Step 4: Wait for redirect back to Mintlify
    console.log(`\n[${step}] Waiting for Mintlify redirect...`);
    await page.waitForURL("https://dashboard.mintlify.com/**", { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await screenshot(page, `${String(step).padStart(2, "0")}-after-oauth`);
    step++;

    // Step 5: Capture any onboarding modals/flows
    console.log(`\n[${step}] Looking for onboarding elements...`);

    // Wait for page to settle
    await page.waitForTimeout(5000);
    await screenshot(page, `${String(step).padStart(2, "0")}-onboarding-start`);
    step++;

    // Look for "Get Started", "Create", "Next" buttons and click through
    const onboardingButtons = [
      'button:has-text("Get Started")',
      'button:has-text("Next")',
      'button:has-text("Continue")',
      'button:has-text("Create")',
      'button:has-text("Start")',
    ];

    for (let i = 0; i < 10; i++) {
      // Max 10 onboarding steps
      let clicked = false;

      for (const selector of onboardingButtons) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          console.log(`\n[${step}] Clicking onboarding button: ${selector}...`);
          await screenshot(page, `${String(step).padStart(2, "0")}-before-click-${i}`);
          await btn.click();
          await page.waitForTimeout(3000);
          await screenshot(page, `${String(step).padStart(2, "0")}-after-click-${i}`);
          step++;
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        console.log("   No more onboarding buttons found.");
        break;
      }
    }

    // Final dashboard screenshot
    console.log(`\n[${step}] Capturing final state...`);
    await page.waitForTimeout(3000);
    await screenshot(page, `${String(step).padStart(2, "0")}-final-dashboard`);

    // Save session for future use
    await context.storageState({ path: path.join(OUTPUT_DIR, "mintlify_session.json") });
    console.log("\n💾 Session saved to onboarding/mintlify_session.json");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await screenshot(page, "error-state");
  }

  // Close and save video
  console.log("\n📹 Saving video recording...");
  await context.close();
  await browser.close();

  // Rename video
  const files = fs.readdirSync(OUTPUT_DIR);
  const videoFile = files.find((f) => f.endsWith(".webm"));
  if (videoFile) {
    const oldPath = path.join(OUTPUT_DIR, videoFile);
    const newPath = path.join(OUTPUT_DIR, "signup-flow.webm");
    fs.renameSync(oldPath, newPath);
    console.log("✅ Video saved as: signup-flow.webm");
  }

  console.log(`\n🎉 Capture complete! Files saved to: ${OUTPUT_DIR}\n`);
}

main();
