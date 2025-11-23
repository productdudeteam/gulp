from typing import Dict
import logging
import subprocess
import sys

logger = logging.getLogger(__name__)


class PlaywrightFetcher:
    def __init__(self, timeout_ms: int = 20000):
        self.timeout_ms = timeout_ms
        self._browsers_checked = False

    def _ensure_browsers_installed(self):
        """Check if Playwright browsers are installed, install if missing"""
        if self._browsers_checked:
            return
        
        try:
            from playwright.sync_api import sync_playwright
            # Try to launch to verify browsers are installed
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                browser.close()
            self._browsers_checked = True
            logger.debug("Playwright browsers verified")
        except Exception as e:
            logger.warning(f"Playwright browsers not found, attempting installation: {e}")
            try:
                # Try to install chromium
                subprocess.run(
                    [sys.executable, "-m", "playwright", "install", "chromium"],
                    check=True,
                    capture_output=True,
                    timeout=300  # 5 minute timeout
                )
                logger.info("Playwright browsers installed successfully")
                self._browsers_checked = True
            except subprocess.TimeoutExpired:
                logger.error("Playwright browser installation timed out")
                raise RuntimeError(
                    "Playwright browsers installation timed out. "
                    "Please install manually: playwright install chromium"
                )
            except Exception as install_error:
                logger.error(f"Failed to install Playwright browsers: {install_error}")
                raise RuntimeError(
                    "Playwright browsers are not installed and automatic installation failed. "
                    "Please install manually: playwright install chromium"
                ) from install_error

    def fetch(self, url: str) -> Dict:
        try:
            from playwright.sync_api import sync_playwright
        except Exception as e:
            raise RuntimeError(
                "Playwright is not installed. Install with `pip install playwright` and run `playwright install`."
            ) from e

        # Ensure browsers are installed before attempting to use them
        self._ensure_browsers_installed()

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            # Use a realistic desktop user-agent for Next.js sites
            ua = (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
            context = browser.new_context(user_agent=ua, viewport={"width": 1366, "height": 900})
            page = context.new_page()
            page.set_default_timeout(self.timeout_ms)
            try:
                # Step 1: initial load
                page.goto(url, wait_until="domcontentloaded")
                # Step 2: wait for network to be idle (hydration, data fetching)
                page.wait_for_load_state("networkidle")
                # Step 3: ensure body is visible
                page.wait_for_selector("body", state="visible")
                # Small post-hydration delay for late scripts/components
                page.wait_for_timeout(1200)
                # Optionally scroll to trigger lazy content
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(400)
                content = page.content()
                body_text = page.evaluate("document.body.innerText") or ""
                final_url = page.url
            finally:
                browser.close()

            headers = {"Content-Type": "text/html; charset=utf-8"}
            return {
                "status": 200,
                "headers": headers,
                "content": content,
                "body_text": body_text,
                "final_url": final_url,
            }


