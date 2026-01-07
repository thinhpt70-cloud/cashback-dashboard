from playwright.sync_api import sync_playwright, expect
import time
from datetime import datetime

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Calculate dynamic current month to ensure mock data matches the dashboard's view
    now = datetime.now()
    current_month = now.strftime("%Y%m") # e.g., "202405"

    # Route authentication verification to skip login
    page.route("**/api/verify-auth", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"isAuthenticated": true}'
    ))

    # Mock critical endpoints
    page.route("**/api/cards?includeClosed=true", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''[
            {"id": "card1", "name": "VIB Super Card", "status": "Active", "overallMonthlyLimit": 1000000, "cashbackType": "Fixed", "statementDay": 20, "useStatementMonthForPayments": false},
            {"id": "card2", "name": "HSBC Visa Platinum", "status": "Active", "overallMonthlyLimit": 2000000, "cashbackType": "2 Tier", "tier2MinSpend": 5000000, "tier2Limit": 2000000, "statementDay": 5, "useStatementMonthForPayments": true}
        ]'''
    ))

    # Mock Rules
    page.route("**/api/rules", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='''[
            {"id": "rule1", "cardId": "card1", "ruleName": "Online Shopping", "rate": 0.15, "categoryLimit": 600000, "status": "Active", "category": ["Shopping"]},
            {"id": "rule2", "cardId": "card2", "ruleName": "Supermarket", "rate": 0.05, "categoryLimit": 1000000, "status": "Active", "category": ["Grocery"]}
        ]'''
    ))

    # Mock MCC Codes
    page.route("**/api/mcc-codes", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"mccDescriptionMap": {}}'
    ))

    # Mock Definitions
    page.route("**/api/definitions", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"categories": ["Shopping", "Grocery"]}'
    ))

    # Mock Monthly Summary - Scenario: Card limit reached for Card 1
    # Card 1 Limit: 1,000,000
    # Spend: 10,000,000
    # Cashback: 950,000 (Limit is 1M, so 50k remaining)
    # Category Limit: 600,000
    # Category Cashback: 200,000 (400k remaining)
    # Result: Should show 50k remaining (Card Limit Bottleneck), not 400k (Category Limit).

    summary_response = f'''[
            {{"id": "summary1", "cardId": "card1", "month": "{current_month}", "spend": 10000000, "cashback": 950000, "monthlyCashbackLimit": 0}}
        ]'''

    page.route("**/api/monthly-summary", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=summary_response
    ))

    page.route("**/api/recent-transactions", lambda route: route.fulfill(
        status=200, body='[]'
    ))

    cat_summary_response = f'''[
            {{"id": "catSum1", "cardId": "card1", "month": "{current_month}", "summaryId": "Online Shopping", "cashback": 200000}}
        ]'''

    page.route("**/api/monthly-category-summary*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=cat_summary_response
    ))

    page.route("**/api/common-vendors", lambda route: route.fulfill(status=200, body='[]'))


    # Navigate
    try:
        # Port 3001 as seen in logs
        page.goto("http://localhost:3001")

        # Wait for the dashboard to load
        expect(page.get_by_text("Top Cashback Opportunities")).to_be_visible(timeout=10000)

        # Click on the top pick to expand if it's an accordion (it is now)
        # Assuming VIB Super Card is the top pick because of high rate (15%)
        # and it has remaining cap.

        # Wait for accordion trigger and click
        # The trigger contains "VIB Super Card" text
        trigger = page.get_by_text("VIB Super Card")
        if trigger.is_visible():
            trigger.click()
            time.sleep(1) # Allow animation

        # Take screenshot
        page.screenshot(path=".jules/verification/enhanced_suggestions_fixed.png", full_page=True)
        print("Screenshot taken at .jules/verification/enhanced_suggestions_fixed.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path=".jules/verification/error.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
