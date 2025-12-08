from playwright.sync_api import sync_playwright, expect
import time

def verify_cashback_tracker():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Define Mock Data
        mock_cards = [
            {
                "id": "card-1",
                "name": "Visa Platinum",
                "bank": "Bank A",
                "status": "Active",
                "statementDay": 20,
                "overallMonthlyLimit": 500000,
                "tier1PaymentType": "M+1",
                "tier2PaymentType": "M+2"
            }
        ]

        mock_summary = [
            {
                "id": "summary-1",
                "month": "202310",
                "cardId": "card-1",
                "actualCashback": 800000, # > 500k limit
                "adjustment": 0,
                "amountRedeemed": 300000,
                "spend": 10000000
            }
        ]

        # Setup Route Interception
        def handle_cards(route):
            route.fulfill(json=mock_cards)

        def handle_summary(route):
            route.fulfill(json=mock_summary)

        def handle_generic_empty(route):
            route.fulfill(json=[])

        def handle_auth(route):
             route.fulfill(json={"success": True})

        # Intercept requests
        page.route("**/api/cards?includeClosed=true", handle_cards)
        page.route("**/api/monthly-summary", handle_summary)
        page.route("**/api/rules", handle_generic_empty)
        page.route("**/api/mcc-codes", lambda r: r.fulfill(json={}))
        page.route("**/api/monthly-category-summary", handle_generic_empty)
        page.route("**/api/recent-transactions", handle_generic_empty)
        page.route("**/api/categories", handle_generic_empty)
        page.route("**/api/common-vendors", handle_generic_empty)
        # Mock auth check to always pass so we land on dashboard
        page.route("**/api/verify-auth", handle_auth)

        try:
            print("Navigating to dashboard with Mocks...")
            page.goto("http://localhost:3000")

            # Since verify-auth is mocked to return true, we should skip login screen directly to dashboard.

            # Wait for dashboard content
            print("Waiting for dashboard...")
            page.wait_for_selector("text=Overview", timeout=10000)

            # Click on the "Cashback" tab
            print("Clicking Cashback tab...")
            # If "Cashback" is in the sidebar nav items (which are buttons)
            # Find button with text "Cashback"
            page.get_by_role("button", name="Cashback").click()

            # Wait for the Cashback Tracker to load
            print("Waiting for Cashback Tracker...")
            # We expect to see "Unclaimed Cashback" card
            expect(page.get_by_text("Unclaimed Cashback")).to_be_visible()

            # Verify our mock data is rendered
            # 800k total - 300k redeemed = 500k remaining?
            # Split:
            # Tier 1 (Limit 500k) -> 500k. Paid 300k. Remaining 200k.
            # Tier 2 (Rest 300k) -> 300k. Paid 0. Remaining 300k.
            # Total Remaining: 500k.

            # Check table row
            # Expect "Visa Platinum"
            expect(page.get_by_text("Visa Platinum")).to_be_visible()
            # Expect "M+1" badge
            expect(page.get_by_text("M+1")).to_be_visible()
            # Expect "M+2" badge
            expect(page.get_by_text("M+2")).to_be_visible()

            # Take a screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/cashback_tab.png", full_page=True)
            print("Screenshot saved to verification/cashback_tab.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_cashback_tracker()
