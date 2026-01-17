
from playwright.sync_api import sync_playwright
import time

def verify_live_view_and_search():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # --- MOCKS ---

        # Auth
        page.route("**/api/verify-auth", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"isAuthenticated": true}'
        ))

        # Basic Shell Data
        page.route("**/api/cards?includeClosed=true", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[{"id": "card1", "name": "Test Card", "status": "Active"}]'
        ))
        page.route("**/api/rules", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[]'
        ))
        page.route("**/api/mcc-codes", lambda route: route.fulfill(
            status=200, content_type="application/json", body='{}'
        ))
        page.route("**/api/definitions", lambda route: route.fulfill(
            status=200, content_type="application/json", body='{"categories": ["Food"], "methods": ["POS"]}'
        ))
        page.route("**/api/monthly-summary", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[]'
        ))
        page.route("**/api/monthly-category-summary?**", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[]'
        ))
        page.route("**/api/common-vendors", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[]'
        ))

        # Recent Transactions (Legacy/Widget use)
        page.route("**/api/recent-transactions", lambda route: route.fulfill(
            status=200, content_type="application/json", body='[]'
        ))

        # --- TEST TARGETS: /api/transactions/query ---

        # 1. Initial Load (Page 1)
        mock_page_1 = {
            "results": [
                {
                    "id": "tx1",
                    "Transaction Name": "Transaction 1",
                    "Amount": 100,
                    "Transaction Date": "2024-01-01",
                    "Card": ["card1"]
                },
                {
                    "id": "tx2",
                    "Transaction Name": "Transaction 2",
                    "Amount": 200,
                    "Transaction Date": "2024-01-02",
                    "Card": ["card1"]
                }
            ],
            "nextCursor": "cursor_page_2",
            "hasMore": True
        }

        # 2. Page 2
        mock_page_2 = {
            "results": [
                {
                    "id": "tx3",
                    "Transaction Name": "Transaction 3",
                    "Amount": 300,
                    "Transaction Date": "2024-01-03",
                    "Card": ["card1"]
                }
            ],
            "nextCursor": None,
            "hasMore": False
        }

        # 3. Search Results
        mock_search_results = {
            "results": [
                {
                    "id": "txSearch",
                    "Transaction Name": "Searched Item",
                    "Amount": 999,
                    "Transaction Date": "2024-01-01",
                    "Card": ["card1"]
                }
            ],
            "nextCursor": None,
            "hasMore": False
        }

        def handle_query(route):
            request = route.request
            url = request.url
            print(f"Handling query: {url}")

            if "search=Searched" in url:
                route.fulfill(status=200, content_type="application/json", body=str(mock_search_results).replace("'", '"').replace("True", "true").replace("False", "false").replace("None", "null"))
            elif "cursor=cursor_page_2" in url:
                route.fulfill(status=200, content_type="application/json", body=str(mock_page_2).replace("'", '"').replace("True", "true").replace("False", "false").replace("None", "null"))
            else:
                # Default Page 1
                route.fulfill(status=200, content_type="application/json", body=str(mock_page_1).replace("'", '"').replace("True", "true").replace("False", "false").replace("None", "null"))

        page.route("**/api/transactions/query?**", handle_query)


        # --- ACTION ---
        print("Navigating to home...")
        page.goto("http://localhost:3001")

        # Wait for dashboard to load
        print("Waiting for dashboard...")
        page.wait_for_selector("text=Overview", timeout=10000)

        # Go to Transactions Tab
        print("Clicking Transactions tab...")
        page.click("text=Transactions")

        # Verify Live View (Initial Load)
        print("Verifying Page 1...")
        page.wait_for_selector("text=Transaction 1", timeout=5000)
        page.wait_for_selector("text=Transaction 2")

        # Verify Load More Button
        load_more_btn = page.locator("button:has-text('Load More')")
        if load_more_btn.is_visible():
            print("Load More button visible. Clicking...")
            load_more_btn.click()

            # Verify Page 2 Load
            print("Verifying Page 2...")
            page.wait_for_selector("text=Transaction 3")
        else:
            print("ERROR: Load More button not found!")

        # Verify Search
        print("Testing Search...")
        # TransactionsList has search input.
        # There might be multiple search inputs (Desktop/Mobile).
        # We target the one in the main view (Desktop assumed for headless default size, or just use first)
        search_input = page.locator("input[placeholder='Search...']").first
        search_input.fill("Searched")

        # Wait for debounce and fetch
        print("Waiting for search results...")
        page.wait_for_selector("text=Searched Item", timeout=5000)

        # Verify "Transaction 1" is GONE (replaced by search results)
        if page.locator("text=Transaction 1").is_visible():
             print("WARNING: Transaction 1 still visible after search replace?")
             # It might be visible if the mock search results appended? No, logic is replace.

        # Take Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png")

        browser.close()
        print("Done!")

if __name__ == "__main__":
    verify_live_view_and_search()
