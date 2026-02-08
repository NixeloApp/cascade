import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.resolve(__dirname, "../e2e/.auth");
const GOOGLE_AUTH_PATH = path.join(AUTH_DIR, "google.json");

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function main() {
  console.log("\n🚀 MINTLIFY AUTH SETUP");
  console.log("--------------------------------------------------");
  console.log("This will use your existing Google session to login to Mintlify.");
  console.log("A browser window will open - please complete any prompts.");
  console.log("--------------------------------------------------\n");

  // Check for existing Google auth
  if (!fs.existsSync(GOOGLE_AUTH_PATH)) {
    console.error("❌ No Google session found. Run 'node scripts/manual_handshake.js' first.");
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    storageState: GOOGLE_AUTH_PATH, // Use existing Google session
  });

  const page = await context.newPage();

  try {
    // Go to Mintlify signup/login
    console.log("📡 Opening Mintlify...");
    await page.goto("https://dashboard.mintlify.com/", { waitUntil: "load" });
    await page.waitForTimeout(3000);

    // Check if we're already logged in
    const currentUrl = page.url();
    if (currentUrl.includes("dashboard.mintlify.com") && !currentUrl.includes("login")) {
      console.log("✅ Already logged in to Mintlify!");
    } else {
      // Need to login - click Google
      console.log("🔐 Clicking 'Continue with Google'...");

      const googleButton = page.locator(
        'button:has-text("Continue with Google"), a:has-text("Continue with Google")',
      );
      if (await googleButton.isVisible()) {
        await googleButton.click();
        await page.waitForTimeout(5000);
      }

      // Wait for OAuth redirect back
      console.log("⏳ Waiting for Google OAuth (up to 2 minutes)...");
      console.log("   If prompted, select your Google account.");

      await page.waitForURL("https://dashboard.mintlify.com/**", { timeout: 120000 });
      console.log("✅ Logged in to Mintlify!");
    }

    // Save Mintlify session
    const statePath = path.join(AUTH_DIR, "mintlify.json");
    await context.storageState({ path: statePath });
    console.log(`📂 Mintlify session saved to: ${statePath}`);

    // Wait a bit so user can see the dashboard
    console.log("\n📸 Keeping browser open for 10 seconds...");
    await page.waitForTimeout(10000);
  } catch (err) {
    console.error("\n❌ Error:", err.message);
    await page.screenshot({ path: path.join(AUTH_DIR, "mintlify_auth_debug.png") });
  } finally {
    await browser.close();
  }
}

main();
