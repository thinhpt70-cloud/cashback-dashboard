from playwright.sync_api import sync_playwright, expect
import time

def verify_add_transaction_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))

        try:
            # 1. Go to the app (assuming it runs on localhost:3000)
            page.goto("http://localhost:3000")

            # Wait for form to load
            page.wait_for_selector("text=Add Transaction Form Test", timeout=10000)

            # --- VERIFY ADD MODE ---
            print("Verifying Add Mode...")

            # 1. Check if Card Selection is visible (not in accordion)
            expect(page.get_by_text("Card", exact=True).first).to_be_visible()

            # 2. Check if Rule Selection is visible
            expect(page.get_by_text("Rule", exact=True).first).to_be_visible()

            # 3. Check if MCC Code input is visible
            expect(page.get_by_label("MCC Code")).to_be_visible()

            # 4. Trigger Recommendations by typing Amount and MCC
            # Enter Amount
            page.locator("input[placeholder='0']").fill("100000")

            # Type an MCC code that exists in our mock data ('5411' -> 'Cửa hàng tiện lợi')
            page.fill("input[type='number'][placeholder='e.g. 5411']", "5411")

            # 5. NOW Check if Recommendations are visible by default
            # It might take a moment for the hook to re-run
            expect(page.get_by_text("Recommended Cards")).to_be_visible()

            # 6. Test MCC Name display
            expect(page.get_by_text("Cửa hàng tiện lợi")).to_be_visible()

            # Take screenshot for Add Mode
            page.screenshot(path="/home/jules/verification/add_mode.png", full_page=True)
            print("Add Mode Verified. Screenshot saved.")


            # --- VERIFY EDIT MODE ---
            print("Verifying Edit Mode...")

            # Click the switch button to toggle to Edit Mode
            page.click("text=Switch to Edit Mode")

            # Wait for re-render
            time.sleep(1)

            # 1. Verify fields are pre-filled (Amount 50,000)
            expect(page.locator("input[placeholder='0']")).to_have_value("50,000")

            # 2. Verify MCC Name is shown for pre-filled data (5812 -> Nhà hàng)
            expect(page.get_by_text("Nhà hàng")).to_be_visible()

            # 3. Verify Recommendations are HIDDEN by default
            # "Recommended Cards" text should NOT be visible
            expect(page.get_by_text("Recommended Cards")).not_to_be_visible()

            # The button to show them SHOULD be visible
            expect(page.get_by_text("Show Card Suggestions")).to_be_visible()

            # 4. Click "Show Card Suggestions" and verify they appear
            page.click("text=Show Card Suggestions")
            expect(page.get_by_text("Recommended Cards")).to_be_visible()

            # Take screenshot for Edit Mode
            page.screenshot(path="/home/jules/verification/edit_mode.png", full_page=True)
            print("Edit Mode Verified. Screenshot saved.")

            print("All verification steps passed!")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="/home/jules/verification/failure.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_add_transaction_form()
