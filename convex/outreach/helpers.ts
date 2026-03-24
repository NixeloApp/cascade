/**
 * Outreach Helpers — Pure functions for template rendering, tracking injection, and compliance
 *
 * Exported for testability. Used by sendEngine.ts during pre-send processing.
 */

// =============================================================================
// Template Rendering
// =============================================================================

export interface TemplateContact {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  customFields?: Record<string, string>;
}

/** Replace {{variable}} placeholders with contact data */
export function renderTemplate(template: string, contact: TemplateContact): string {
  let result = template;

  // Standard variables
  result = result.replace(/\{\{email\}\}/gi, contact.email);
  result = result.replace(/\{\{firstName\}\}/gi, contact.firstName ?? "");
  result = result.replace(/\{\{lastName\}\}/gi, contact.lastName ?? "");
  result = result.replace(/\{\{company\}\}/gi, contact.company ?? "");

  // Custom fields — escape regex metacharacters in key names
  if (contact.customFields) {
    for (const [key, value] of Object.entries(contact.customFields)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\{\\{${escapedKey}\\}\\}`, "gi");
      result = result.replace(pattern, value);
    }
  }

  // Clean up any remaining unresolved variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result;
}

// =============================================================================
// Tracking Injection
// =============================================================================

export interface TrackingLink {
  originalUrl: string;
  trackingId: string;
}

/**
 * Rewrite URLs in email HTML body for click tracking.
 *
 * Finds all href="..." attributes and replaces the URL with a tracking redirect.
 * Returns the modified HTML and the list of tracking links to persist.
 *
 * Skips mailto: links and unsubscribe links (already tracked separately).
 */
/**
 * Extract trackable URLs from HTML (phase 1 of click tracking).
 * Returns the list of URLs that should be tracked. Does NOT rewrite the HTML.
 */
export function extractTrackableUrls(html: string): string[] {
  const urls: string[] = [];
  html.replace(/href="(https?:\/\/[^"]+)"/gi, (fullMatch, url: string) => {
    if (url.startsWith("mailto:")) return fullMatch;
    if (url.includes("/t/u/")) return fullMatch;
    urls.push(url);
    return fullMatch;
  });
  return urls;
}

/**
 * Rewrite trackable URLs in HTML with tracking redirect links (phase 2).
 * Takes a map of originalUrl -> trackingId (the persisted document _id).
 */
export function rewriteUrlsWithTrackingIds(
  html: string,
  urlToTrackingId: Map<string, string>,
  trackingDomain: string,
): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (fullMatch, url: string) => {
    const trackingId = urlToTrackingId.get(url);
    if (!trackingId) return fullMatch;
    return `href="https://${trackingDomain}/t/c/${trackingId}"`;
  });
}

/**
 * Inject open tracking pixel into email HTML body.
 *
 * Appends a 1x1 transparent GIF image tag before the closing </body> or at the end.
 */
export function injectOpenTrackingPixel(
  html: string,
  enrollmentId: string,
  trackingDomain: string,
): string {
  const pixelTag = `<img src="https://${trackingDomain}/t/o/${enrollmentId}" width="1" height="1" alt="" style="display:none;" />`;

  // Insert before </body> if present, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelTag}</body>`);
  }
  return html + pixelTag;
}

// =============================================================================
// Compliance Footer
// =============================================================================

/** Build the compliance footer (unsubscribe link + physical address) */
export function buildComplianceFooter(
  physicalAddress: string,
  enrollmentId: string,
  trackingDomain: string,
): string {
  const unsubUrl = `https://${trackingDomain}/t/u/${enrollmentId}`;

  return `
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#888;line-height:1.4;">
  <p>${physicalAddress}</p>
  <p><a href="${unsubUrl}" style="color:#888;">Unsubscribe</a></p>
</div>`;
}

// =============================================================================
// Auto-Reply Detection
// =============================================================================

/** Headers that indicate an auto-reply (OOO, bounce, auto-responder) */
const AUTO_REPLY_HEADERS: Record<string, string[]> = {
  "Auto-Submitted": ["auto-replied", "auto-generated", "auto-notified"],
  "X-Auto-Response-Suppress": ["All", "OOF", "AutoReply"],
  "X-Autoreply": ["yes"],
  "X-Autorespond": ["yes"],
  Precedence: ["bulk", "auto_reply", "junk"],
};

/** Body patterns that indicate an out-of-office or auto-reply */
const AUTO_REPLY_BODY_PATTERNS = [
  /out of (the )?office/i,
  /on vacation/i,
  /auto[- ]?reply/i,
  /auto[- ]?response/i,
  /I am currently (away|unavailable|out)/i,
  /away from (my )?(desk|email|office)/i,
  /will (be back|return|respond) (on|after|by)/i,
  /limited access to email/i,
  /this is an automated (message|response|reply)/i,
  /do not reply to this (email|message)/i,
];

/**
 * Check if a message is an auto-reply based on headers and/or body.
 *
 * Used by reply detection to skip OOO messages — they should NOT stop the sequence.
 */
export function isAutoReply(
  headers: Array<{ name: string; value: string }>,
  bodySnippet?: string,
): boolean {
  // Check headers
  for (const header of headers) {
    const patterns = AUTO_REPLY_HEADERS[header.name];
    if (patterns) {
      const value = header.value.toLowerCase();
      if (patterns.some((p) => value.includes(p.toLowerCase()))) {
        return true;
      }
    }
  }

  // Check body patterns (if snippet provided)
  if (bodySnippet) {
    for (const pattern of AUTO_REPLY_BODY_PATTERNS) {
      if (pattern.test(bodySnippet)) {
        return true;
      }
    }
  }

  return false;
}
