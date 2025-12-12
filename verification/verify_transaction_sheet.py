import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log console messages
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

    # Mock all API calls to avoid 431 errors
    page.route("**/api/verify-auth", lambda route: route.fulfill(status=200, body='{"status":"ok"}'))

    mock_transactions = [
        {
            "id": "tx1",
            "Transaction Name": "Test Transaction",
            "Transaction Date": "2023-10-27",
            "Amount": 150000,
            "estCashback": 7500,
            "Method": "International",
            "MCC Code": "5812",
            "Card": ["card1"],
            "Card Name": "Test Card",
            "Category": "Dining",
            "foreignCurrencyAmount": 50,
            "conversionFee": 3000,
            "notes": "Test notes"
        }
    ]
    # IMPORTANT: Route for all transaction queries
    # The frontend filters by date, so we need to return this list for any query
    page.route("**/api/transactions*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=str(mock_transactions).replace("'", '"')
    ))

    # Mock empty returns for others to keep dashboard happy
    page.route("**/api/monthly-summary*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/cards*", lambda route: route.fulfill(status=200, body='[{"id": "card1", "name": "Test Card", "status": "Active"}]'))
    page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/recent-transactions*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/rules*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/mcc-codes*", lambda route: route.fulfill(status=200, body="{}"))
    page.route("**/api/categories*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/common-vendors*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/transaction-reviews*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/cashback-categories*", lambda route: route.fulfill(status=200, body="[]"))
    page.route("**/api/live-summary*", lambda route: route.fulfill(status=200, body="{}"))

    page.goto("http://localhost:3000")

    # Wait for transactions tab to be clickable
    page.wait_for_selector("text=Overview", state="visible", timeout=60000)
    page.click("text=Transactions")

    # Wait for the transaction to appear
    # If filter defaults to "recent" or "this month", we might need to adjust mock data date
    # But mock returns it regardless of query params, so it should appear
    # Wait a bit for React to update
    page.wait_for_timeout(2000)

    # Try finding it
    if not page.is_visible("text=Test Transaction"):
        print("Test Transaction not found. Changing month filter...")
        # Try to change filter or wait more
        # Maybe it needs to click "Live View" or select another month?
        # But we mock API, so any request should return our data
        page.screenshot(path="verification/transactions_failed.png")
        # Let's try to proceed anyway just in case it appears

    page.wait_for_selector("text=Test Transaction", timeout=10000)

    # Click the dropdown trigger (MoreVertical icon) in the row
    # In Shadcn table, actions are usually in the last cell
    row = page.locator("tr", has_text="Test Transaction")
    dropdown_trigger = row.locator("button.h-8.w-8")
    dropdown_trigger.click()

    # Click "View Details" in the menu
    page.click("text=View Details")

    # Wait for sheet to open (look for the unique text "Transaction Info" in the sheet)
    page.wait_for_selector("text=Transaction Info")

    # Wait for animations to settle
    page.wait_for_timeout(1000)

    # Take screenshot of the sheet
    page.screenshot(path="verification/transaction_sheet.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
