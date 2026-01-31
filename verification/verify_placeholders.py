from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    )
    page = context.new_page()

    # Log console messages
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser Error: {err}"))

    # Mock APIs
    page.route("**/api/rules", lambda route: route.fulfill(status=200, content_type="application/json", body='[]'))
    page.route("**/api/mcc-codes", lambda route: route.fulfill(status=200, content_type="application/json", body='{}'))
    page.route("**/api/common-vendors", lambda route: route.fulfill(status=200, content_type="application/json", body='[]'))
    page.route("**/api/definitions", lambda route: route.fulfill(status=200, content_type="application/json", body='{}'))
    page.route("**/api/cards*", lambda route: route.fulfill(status=200, content_type="application/json", body='[{"id": "card-1", "name": "Test Card"}]'))
    page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(status=200, content_type="application/json", body='[]'))
    page.route("**/api/monthly-summary*", lambda route: route.fulfill(status=200, content_type="application/json", body='[]'))
    page.route("**/api/recent-transactions*", lambda route: route.fulfill(status=200, content_type="application/json", body='[]'))
    page.route("**/api/transactions/query*", lambda route: route.fulfill(status=200, content_type="application/json", body='{"results": [], "hasMore": false}'))

    # Bypass Auth
    page.add_init_script("""
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0].toString();
            if (url.includes('/api/verify-auth')) {
                return new Response(JSON.stringify({isAuthenticated: true, user: {id: 'user1'}}), {
                    status: 200,
                    headers: {'Content-Type': 'application/json'}
                });
            }
            return originalFetch(...args);
        };
    """)

    try:
        print("Navigating to home...")
        page.goto("http://localhost:3000")

        print("Waiting for Overview...")
        page.wait_for_selector("h1:has-text('Cardifer')", timeout=10000)

        print("Opening Menu...")
        menu_btn = page.locator("button:has(svg.lucide-menu)")
        menu_btn.wait_for(state="visible", timeout=5000)
        menu_btn.click()

        print("Clicking Transactions...")
        page.get_by_role("button", name="Transactions").click()

        print("Waiting for Transactions List...")
        page.wait_for_selector("input[placeholder*='Search']", timeout=5000)

        # Scroll to filters
        print("Scrolling to filters...")
        filter_container = page.locator("input[placeholder*='Search']").locator("xpath=../..")
        filter_container.evaluate("(element) => element.scrollLeft = 500")

        # Verify Placeholders
        print("Checking placeholders...")
        # Note: 'placeholder' attribute exists in DOM even if visually obscured by date mask
        from_input = page.locator('input[placeholder="From"]')
        to_input = page.locator('input[placeholder="To"]')

        if from_input.count() > 0 and to_input.count() > 0:
            print("Placeholders found in DOM.")
        else:
            print("Placeholders NOT found.")

        # Take screenshot
        page.screenshot(path="verification/mobile_filters_placeholders.png")
        print("Screenshot taken.")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_placeholders.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
