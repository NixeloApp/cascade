from playwright.sync_api import Page, expect, sync_playwright

def test_issue_card(page: Page):
    # Go to the verify-issue page
    page.goto("http://localhost:5555/verify-issue")

    # Wait for hydration/render
    page.wait_for_timeout(1000)

    # The card itself (overlay button) should be visible and accessible
    # It has an aria-label that starts with "Bug TEST-123"
    # And should contain "Labels: bug"
    # We can use get_by_label or get_by_role("button", name=...)

    # Using a regex or partial match is safer
    import re
    card = page.get_by_role("button", name=re.compile("Bug TEST-123"))
    expect(card).to_be_visible()

    label = card.get_attribute("aria-label")
    print(f"Card aria-label: {label}")

    if "Labels: bug" not in label:
        raise Exception(f"Expected 'Labels: bug' in aria-label, but got '{label}'")

    # Take screenshot
    page.screenshot(path="/home/jules/verification/issue_card.png")
    print("Screenshot saved to /home/jules/verification/issue_card.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_issue_card(page)
        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
        finally:
            browser.close()
