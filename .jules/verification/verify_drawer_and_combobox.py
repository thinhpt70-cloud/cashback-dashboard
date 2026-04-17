from playwright.sync_api import Page, expect, sync_playwright
import time

def test_drawer_and_combobox(page: Page):
  page.set_viewport_size({"width": 375, "height": 812})
  page.goto("http://localhost:5173")

  page.wait_for_selector("text=Enter PIN")
  page.keyboard.type("123456")

  time.sleep(4)

  add_btn = page.get_by_label("Add transaction")
  expect(add_btn).to_be_visible()
  add_btn.click()

  drawer_title = page.get_by_text("Add Transaction", exact=True)
  expect(drawer_title).to_be_visible(timeout=5000)

  print("Scroll down drawer to see more content")

  drawer_scroll = page.locator(".flex-1.min-h-0.px-4.pb-4.overflow-y-auto")
  drawer_scroll.focus()
  page.keyboard.press("PageDown")

  time.sleep(1) # Let the scroll happen
  page.screenshot(path=".jules/verification/drawer_scroll.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_drawer_and_combobox(page)
    except Exception as e:
      print(f"Error: {e}")
      page.screenshot(path=".jules/verification/error.png")
    finally:
      browser.close()
