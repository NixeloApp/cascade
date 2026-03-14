import { RUNTIME_COLORS } from "../shared/colors";

const BASE_PAGE_STYLES = [
  "font-family: system-ui",
  "max-width: 600px",
  "margin: 100px auto",
  "padding: 20px",
  "text-align: center",
].join("; ");

const PANEL_STYLES = ["padding: 20px", "border-radius: 8px"].join("; ");

const BUTTON_STYLES = [
  "color: white",
  "border: none",
  "padding: 12px 24px",
  "border-radius: 6px",
  "cursor: pointer",
  "font-size: 16px",
  "margin-top: 20px",
].join("; ");

function renderDocument(title: string, styles: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <style>
      ${styles}
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>
`;
}

/** Render a shared OAuth error popup page with neutral failure styling. */
export function renderOAuthErrorPageHtml(
  title: string,
  message: string,
  details = "Please try again or contact support if the problem persists.",
): string {
  return renderDocument(
    title,
    `
      body { ${BASE_PAGE_STYLES}; }
      .error { ${PANEL_STYLES}; background: ${RUNTIME_COLORS.OAUTH_ERROR_BACKGROUND}; border: 1px solid ${RUNTIME_COLORS.OAUTH_ERROR_BORDER}; }
      button { ${BUTTON_STYLES}; background: ${RUNTIME_COLORS.OAUTH_BUTTON_NEUTRAL}; }
      button:hover { background: ${RUNTIME_COLORS.OAUTH_BUTTON_NEUTRAL_HOVER}; }
    `,
    `
      <div class="error">
        <h1>Connection Failed</h1>
        <p>${message}</p>
        <p>${details}</p>
        <button onclick="window.close()">Close Window</button>
      </div>
    `,
  );
}

/** Render the Google Calendar OAuth success popup page. */
export function renderGoogleSuccessPageHtml(email: string, connectionDataJson: string): string {
  return renderDocument(
    "Google Calendar - Connected",
    `
      body { ${BASE_PAGE_STYLES}; }
      .success { ${PANEL_STYLES}; background: ${RUNTIME_COLORS.OAUTH_SUCCESS_BACKGROUND}; border: 1px solid ${RUNTIME_COLORS.OAUTH_SUCCESS_BORDER}; }
      button { ${BUTTON_STYLES}; background: ${RUNTIME_COLORS.INFO}; }
      button:hover { background: ${RUNTIME_COLORS.OAUTH_BUTTON_PRIMARY_HOVER}; }
    `,
    `
      <div class="success">
        <h1>Connected Successfully</h1>
        <p>Your Google Calendar has been connected to Nixelo.</p>
        <p><strong>${email}</strong></p>
        <button onclick="window.close()">Close Window</button>
        <script>
          if (window.opener) {
            const targetOrigin = window.opener.location.origin;
            window.opener.postMessage({
              type: 'google-calendar-connected',
              data: ${connectionDataJson}
            }, targetOrigin);
          }
          setTimeout(() => {
            window.opener?.location.reload();
            window.close();
          }, 3000);
        </script>
      </div>
    `,
  );
}

/** Render the GitHub OAuth success popup page. */
export function renderGitHubSuccessPageHtml(
  githubUsername: string,
  connectionDataJson: string,
): string {
  return renderDocument(
    "GitHub - Connected",
    `
      body { ${BASE_PAGE_STYLES}; background: ${RUNTIME_COLORS.GITHUB_POPUP_BACKGROUND}; color: ${RUNTIME_COLORS.GITHUB_POPUP_TEXT}; }
      .success { ${PANEL_STYLES}; background: ${RUNTIME_COLORS.GITHUB_POPUP_SURFACE}; border: 1px solid ${RUNTIME_COLORS.GITHUB_POPUP_BORDER}; }
      .github-icon { font-size: 48px; margin-bottom: 16px; }
      .username { color: ${RUNTIME_COLORS.GITHUB_ACCENT_TEXT}; font-weight: 600; }
      button { ${BUTTON_STYLES}; background: ${RUNTIME_COLORS.GITHUB_SUCCESS_BUTTON}; }
      button:hover { background: ${RUNTIME_COLORS.GITHUB_SUCCESS_BUTTON_HOVER}; }
    `,
    `
      <div class="success">
        <div class="github-icon">GitHub</div>
        <h1>Connected Successfully</h1>
        <p>Your GitHub account has been connected to Nixelo.</p>
        <p class="username">@${githubUsername}</p>
        <button onclick="window.close()">Close Window</button>
        <script>
          if (window.opener) {
            const targetOrigin = window.opener.location.origin;
            window.opener.postMessage({
              type: 'github-connected',
              data: ${connectionDataJson}
            }, targetOrigin);
          }
          setTimeout(() => {
            window.opener?.location.reload();
            window.close();
          }, 3000);
        </script>
      </div>
    `,
  );
}
