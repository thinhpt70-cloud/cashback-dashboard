from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Mock API - General
        page.route("**/api/verify-auth", lambda route: route.fulfill(json={"isAuthenticated": True, "user": {"user": "admin"}}))
        page.route("**/api/cards*", lambda route: route.fulfill(json=[{"id": "c1", "name": "Test Card", "bank": "Test Bank"}]))
        page.route("**/api/categories*", lambda route: route.fulfill(json=["Shopping", "Food"]))
        page.route("**/api/rules*", lambda route: route.fulfill(json=[]))
        page.route("**/api/mcc-codes*", lambda route: route.fulfill(json={}))
        page.route("**/api/common-vendors*", lambda route: route.fulfill(json=[]))
        page.route("**/api/recent-transactions*", lambda route: route.fulfill(json=[]))
        page.route("**/api/transactions/needs-review*", lambda route: route.fulfill(json=[]))
        page.route("**/api/definitions*", lambda route: route.fulfill(json={"categories": [], "methods": [], "paidFor": [], "foreignCurrencies": [], "subCategories": []}))
        page.route("**/api/monthly-summary*", lambda route: route.fulfill(json=[]))
        page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(json=[]))

        # Mock Transactions Query
        transactions = [
            {
                "id": "tx1",
                "Transaction Name": "DateOnlyTx",
                "Amount": 100000,
                "Transaction Date": "2023-10-26",
                "Card": ["c1"],
                "Category": "Shopping",
                "estCashback": 1000,
                "rate": 0.01,
            },
            {
                "id": "tx2",
                "Transaction Name": "DateTimeTx",
                "Amount": 200000,
                "Transaction Date": "2023-10-26T14:30:00",
                "Card": ["c1"],
                "Category": "Food",
                "estCashback": 2000,
                "rate": 0.01,
            }
        ]

        page.route("**/api/transactions/query*", lambda route: route.fulfill(json={"results": transactions, "nextCursor": None, "hasMore": False}))


        try:
            print("Navigating...")
            page.goto("http://localhost:3001", timeout=60000)

            print("Waiting for dashboard...")
            # Wait for dashboard load (Check for Overview text or something unique)
            page.wait_for_selector("text=Overview", timeout=30000)

            print("Clicking Transactions tab...")
            # Click Transactions Tab
            page.click("text=Transactions")

            print("Waiting for transactions table...")
            # Wait for table to load
            page.wait_for_selector("text=DateOnlyTx", timeout=30000)

            print("Taking screenshot...")
            page.screenshot(path="verification/date_format_verification.png", full_page=True)
            print("Screenshot saved to verification/date_format_verification.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    run()
