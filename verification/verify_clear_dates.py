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
    # page.on("requestfailed", lambda req: print(f"Request failed: {req.url} {req.failure}"))

    # Mock APIs
    page.route("**/api/rules", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))
    page.route("**/api/mcc-codes", lambda route: route.fulfill(
        status=200, content_type="application/json", body='{}'
    ))
    page.route("**/api/common-vendors", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))
    page.route("**/api/definitions", lambda route: route.fulfill(
        status=200, content_type="application/json", body='{}'
    ))
    page.route("**/api/cards*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[{"id": "card-1", "name": "Test Card"}]'
    ))

    # Mock monthly-category-summary to prevent infinite loop
    page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[{"month": "2024-01", "cardId": "card-1", "spend": 0, "cashback": 0}]'
    ))

    page.route("**/api/monthly-summary*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))
    page.route("**/api/recent-transactions*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))
    page.route("**/api/transactions/query*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='{"results": [], "hasMore": false}'
    ))

    # Add init script to bypass auth
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

        # Find Date Input (Start Date)
        start_date_input = page.locator('input[aria-label="Start Date"]')

        print("Setting Start Date...")
        start_date_input.fill("2024-01-01")

        # Verify Clear Button appears
        print("Checking for Clear Button...")
        clear_btn = page.locator('button[aria-label="Clear dates"]')
        clear_btn.wait_for(state="visible", timeout=2000)
        print("Clear Button Found.")

        # Take screenshot with button
        page.screenshot(path="verification/mobile_filters_with_clear.png")

        # Click Clear
        print("Clicking Clear...")
        clear_btn.click()

        # Verify input is empty
        print("Verifying date cleared...")
        val = start_date_input.input_value()
        if val == "":
            print("Date cleared successfully.")
        else:
            print(f"Date NOT cleared. Value: {val}")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error_clear_dates.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
