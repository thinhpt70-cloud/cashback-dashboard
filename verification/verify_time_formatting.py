import json
from playwright.sync_api import sync_playwright

def verify_time_formatting(page):
    # Log console messages
    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"Page Error: {err}"))
    page.on("requestfailed", lambda req: print(f"Request failed: {req.url} {req.failure}"))

    # Mock APIs
    page.route("**/api/verify-auth*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"isAuthenticated": True})
    ))

    page.route("**/api/definitions*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"categories": ["Groceries", "Dining"]})
    ))

    page.route("**/api/cards*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([{"id": "card1", "name": "VIB Supercard", "statementDay": 1, "useStatementMonthForPayments": True}])
    ))

    page.route("**/api/rules*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    page.route("**/api/mcc-codes*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({})
    ))

    # Mock Transactions for Review
    page.route("**/api/transactions/needs-review*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([
            {
                "id": "tx1",
                "Transaction Date": "2026-02-07T14:42:00.000+00:00",
                "Transaction Name": "Test Format",
                "Amount": 500000,
                "status": "Review Needed",
                "MCC Code": "1234",
                "Card": ["card1"],
                "Match": False,
                "Automated": False,
                "Category": "Uncategorized",
                "Applicable Rule": []
            }
        ])
    ))

    # Other mocks
    page.route("**/api/monthly-summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))
    page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))
    page.route("**/api/recent-transactions*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))
    page.route("**/api/common-vendors*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps([])
    ))

    # Navigate
    print("Navigating to dashboard...")
    page.goto("http://localhost:3001")

    # Wait for loading
    print("Waiting for page to load...")
    page.wait_for_timeout(5000)

    # Click Transactions Tab
    print("Clicking Transactions Tab...")
    try:
        page.get_by_role("button", name="Transactions").click()
    except Exception as e:
        print(f"Transactions tab not found: {e}")

    page.wait_for_timeout(2000)

    # Expand Review Needed
    print("Expanding Review Needed...")
    try:
        # It's an accordion trigger
        page.locator("button:has-text('Review Needed')").click()
    except Exception as e:
        print(f"Review Needed button not found or error: {e}")

    page.wait_for_timeout(2000)

    # Change Group By to Date
    print("Changing Group By to Date...")
    # Try to find the dropdown
    try:
        # The select trigger usually has "Group" text or similar
        # Based on the code: Group: Date
        # If it's already date, we don't need to change it.
        pass
    except Exception as e:
        print(f"Error changing group: {e}")

    # Take screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_time_formatting(page)
        finally:
            browser.close()
