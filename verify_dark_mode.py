
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        try:
            await page.goto("http://localhost:3000/", wait_until="networkidle", timeout=60000)

            # Wait for the PIN input fields to be visible
            await page.wait_for_selector('input[aria-label="Please enter your pin."]', timeout=60000)

            # Enter the PIN
            pin_digits = "192001"
            for i, digit in enumerate(pin_digits):
                await page.locator(f'input[aria-label="Please enter your pin."]:nth-of-type({i + 1})').fill(digit)

            # Wait for navigation to the dashboard after login
            await page.wait_for_url("http://localhost:3000/dashboard", timeout=60000)

            # Now on the dashboard, wait for the theme toggle button
            await page.wait_for_selector('button:has-text("Toggle theme")', timeout=60000)

            # Click the theme toggle button to switch to dark mode
            await page.click('button:has-text("Toggle theme")')

            # Wait for the theme to change
            await page.wait_for_timeout(1000)

            # Take a screenshot
            screenshot_path = "/home/jules/verification/dark_mode_ui.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="/home/jules/verification/error.png")
        finally:
            await browser.close()

asyncio.run(main())
