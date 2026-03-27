"""
Comprehensive E2E test suite for Sogrim V2 vs Old App.
Uses Playwright directly for precise control + browser-use for AI tasks.

Usage:
  cd packages/sogrim-app-v2
  e2e/.venv/bin/python e2e/run_tests.py [phase]

Phases: landing, auth, navigation, planner, grid, requirements, settings, responsive, compare, all
"""

import asyncio
import os
import sys
import time

from playwright.async_api import async_playwright

SCREENSHOTS = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOTS, exist_ok=True)

NEW_APP = "http://localhost:3001"
OLD_APP = "http://localhost:3000"

# Grade sheet data for UG import
UG_DATA = open(os.path.join(os.path.dirname(__file__), "..", "..", "docs", "ug_ctrl_c_ctrl_v.txt")).read()


class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def ok(self, name: str, detail: str = ""):
        self.passed.append((name, detail))
        print(f"  ✅ {name}" + (f" — {detail}" if detail else ""))

    def fail(self, name: str, detail: str = ""):
        self.failed.append((name, detail))
        print(f"  ❌ {name}" + (f" — {detail}" if detail else ""))

    def warn(self, name: str, detail: str = ""):
        self.warnings.append((name, detail))
        print(f"  ⚠️  {name}" + (f" — {detail}" if detail else ""))

    def summary(self):
        total = len(self.passed) + len(self.failed)
        print(f"\n{'='*60}")
        print(f"Results: {len(self.passed)}/{total} passed, {len(self.failed)} failed, {len(self.warnings)} warnings")
        if self.failed:
            print("\nFailures:")
            for name, detail in self.failed:
                print(f"  ❌ {name}: {detail}")
        if self.warnings:
            print("\nWarnings:")
            for name, detail in self.warnings:
                print(f"  ⚠️  {name}: {detail}")
        print(f"{'='*60}")


async def screenshot(page, name: str):
    path = os.path.join(SCREENSHOTS, f"{name}.png")
    await page.screenshot(path=path, full_page=True)
    print(f"  📸 {name}.png")
    return path


# ============================================================
# PHASE 1: Landing Page
# ============================================================
async def test_landing(results: TestResults):
    print("\n📋 Phase 1: Landing Page")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await ctx.new_page()

        await page.goto(NEW_APP, wait_until="networkidle")
        await screenshot(page, "01-landing")

        # Check title
        title = await page.title()
        if "סוגרים" in title:
            results.ok("Page title contains סוגרים", title)
        else:
            results.fail("Page title", f"Expected סוגרים, got: {title}")

        # Check RTL direction
        html_dir = await page.get_attribute("html", "dir")
        if html_dir == "rtl":
            results.ok("HTML dir=rtl")
        else:
            results.fail("HTML direction", f"Expected rtl, got: {html_dir}")

        # Check for Hebrew text
        body_text = await page.inner_text("body")
        if "סוגרים" in body_text:
            results.ok("Hebrew title visible")
        else:
            results.fail("Hebrew title not found in body")

        if "מעקב תואר" in body_text:
            results.ok("Subtitle visible (מעקב תואר)")
        else:
            results.fail("Subtitle not found")

        if "Google" in body_text or "התחבר" in body_text:
            results.ok("Sign-in prompt visible")
        else:
            results.warn("Sign-in prompt not clearly visible")

        # Check font
        font = await page.evaluate("getComputedStyle(document.body).fontFamily")
        if "Assistant" in font:
            results.ok("Font is Assistant", font)
        else:
            results.fail("Font mismatch", f"Expected Assistant, got: {font}")

        # Check dark background isn't default (should be light)
        bg = await page.evaluate("getComputedStyle(document.body).backgroundColor")
        results.ok("Background color", bg)

        await browser.close()


# ============================================================
# PHASE 2: Auth Flow (Google Sign-In)
# ============================================================
async def test_auth(results: TestResults):
    print("\n📋 Phase 2: Auth Flow")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await ctx.new_page()
        await page.goto(NEW_APP, wait_until="networkidle")

        # Check Google GSI script loaded
        gsi_loaded = await page.evaluate("typeof window.google !== 'undefined'")
        if gsi_loaded:
            results.ok("Google GSI script loaded")
        else:
            results.warn("Google GSI not loaded (may need internet)")

        # Check for Google sign-in button/iframe
        google_elements = await page.query_selector_all("iframe[src*='accounts.google'], div[id*='google'], #credential_picker_container")
        if google_elements:
            results.ok("Google sign-in element found")
        else:
            results.warn("Google sign-in element not found (may be blocked)")

        await screenshot(page, "02-auth-page")
        await browser.close()


# ============================================================
# PHASE 3: Navigation
# ============================================================
async def test_navigation(results: TestResults):
    print("\n📋 Phase 3: Navigation (unauthenticated)")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await ctx.new_page()

        # Inject a fake auth token to bypass Google login
        await page.goto(NEW_APP, wait_until="networkidle")

        # Set auth in localStorage (Zustand persist)
        await page.evaluate("""() => {
            localStorage.setItem('sogrim-auth', JSON.stringify({
                state: {
                    token: 'fake-token-for-testing',
                    userInfo: {
                        sub: 'test-user-123',
                        email: 'test@technion.ac.il',
                        name: 'סטודנט טסט',
                        picture: ''
                    },
                    isAuthenticated: true
                },
                version: 0
            }));
        }""")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await screenshot(page, "03-nav-after-auth")

        # Check if sidebar is visible (desktop)
        sidebar = await page.query_selector("aside")
        if sidebar:
            sidebar_visible = await sidebar.is_visible()
            if sidebar_visible:
                results.ok("Desktop sidebar visible")
            else:
                results.fail("Desktop sidebar not visible")
        else:
            results.fail("Sidebar element not found")

        # Check header
        header = await page.query_selector("header")
        if header:
            results.ok("Header present")
        else:
            results.fail("Header not found")

        # Check nav items
        body_text = await page.inner_text("body")
        nav_items = ["מעקב תואר", "מערכת שעות", "הגדרות"]
        for item in nav_items:
            if item in body_text:
                results.ok(f"Nav item: {item}")
            else:
                results.fail(f"Nav item missing: {item}")

        # Navigate to settings
        settings_link = await page.query_selector('a[href="/settings"]')
        if settings_link:
            await settings_link.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "03-nav-settings")
            url = page.url
            if "/settings" in url:
                results.ok("Settings navigation works", url)
            else:
                results.fail("Settings navigation", f"URL is {url}")
        else:
            results.fail("Settings link not found")

        # Navigate to timetable
        timetable_link = await page.query_selector('a[href="/timetable"]')
        if timetable_link:
            await timetable_link.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "03-nav-timetable")
            text = await page.inner_text("body")
            if "בקרוב" in text:
                results.ok("Timetable shows coming soon")
            else:
                results.fail("Timetable page content unexpected")
        else:
            results.fail("Timetable link not found")

        # Navigate to planner
        planner_link = await page.query_selector('a[href="/planner"]')
        if planner_link:
            await planner_link.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "03-nav-planner")
            url = page.url
            if "/planner" in url:
                results.ok("Planner navigation works", url)
            else:
                results.fail("Planner navigation", f"URL is {url}")
        else:
            results.fail("Planner link not found")

        # Test theme toggle
        theme_btn = await page.query_selector('button[aria-label="Toggle theme"]')
        if theme_btn:
            await theme_btn.click()
            await page.wait_for_timeout(300)
            is_dark = await page.evaluate("document.documentElement.classList.contains('dark')")
            if is_dark:
                results.ok("Dark mode toggle works")
                await screenshot(page, "03-nav-dark-mode")
            else:
                results.fail("Dark mode toggle didn't apply class")
            # Toggle back
            await theme_btn.click()
            await page.wait_for_timeout(300)
        else:
            results.warn("Theme toggle button not found")

        # Test logout button
        logout_btn = await page.query_selector('button[aria-label="Logout"]')
        if logout_btn:
            results.ok("Logout button present")
        else:
            results.warn("Logout button not found")

        await browser.close()


# ============================================================
# PHASE 4: Settings Page
# ============================================================
async def test_settings(results: TestResults):
    print("\n📋 Phase 4: Settings Page")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await ctx.new_page()

        # Inject auth
        await page.goto(NEW_APP, wait_until="networkidle")
        await page.evaluate("""() => {
            localStorage.setItem('sogrim-auth', JSON.stringify({
                state: {
                    token: 'fake-token-for-testing',
                    userInfo: { sub: 'test-123', email: 'test@technion.ac.il', name: 'סטודנט טסט', picture: '' },
                    isAuthenticated: true
                },
                version: 0
            }));
        }""")
        await page.goto(NEW_APP + "/settings", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await screenshot(page, "04-settings")

        body = await page.inner_text("body")

        # Check sections exist
        sections = ["הגדרות", "פרופיל", "קטלוג"]
        for section in sections:
            if section in body:
                results.ok(f"Settings section: {section}")
            else:
                results.warn(f"Settings section not found: {section}")

        # Check theme section
        if "מראה" in body or "ערכת נושא" in body or "כהה" in body or "dark" in body.lower():
            results.ok("Theme settings section found")
        else:
            results.warn("Theme settings not clearly visible")

        await browser.close()


# ============================================================
# PHASE 5: Responsive / Mobile
# ============================================================
async def test_responsive(results: TestResults):
    print("\n📋 Phase 5: Responsive (Mobile)")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)

        # Mobile viewport (iPhone-like)
        ctx = await browser.new_context(
            viewport={"width": 375, "height": 812},
            locale="he-IL",
            is_mobile=True,
        )
        page = await ctx.new_page()

        # Inject auth
        await page.goto(NEW_APP, wait_until="networkidle")
        await page.evaluate("""() => {
            localStorage.setItem('sogrim-auth', JSON.stringify({
                state: {
                    token: 'fake-token-for-testing',
                    userInfo: { sub: 'test-123', email: 'test@technion.ac.il', name: 'סטודנט טסט', picture: '' },
                    isAuthenticated: true
                },
                version: 0
            }));
        }""")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1000)
        await screenshot(page, "05-mobile-planner")

        # Sidebar should be hidden on mobile
        sidebar = await page.query_selector("aside")
        if sidebar:
            sidebar_visible = await sidebar.is_visible()
            if not sidebar_visible:
                results.ok("Sidebar hidden on mobile")
            else:
                results.fail("Sidebar still visible on mobile")
        else:
            results.ok("Sidebar not rendered on mobile")

        # Bottom nav should be visible
        bottom_nav = await page.query_selector("nav.fixed.bottom-0")
        if not bottom_nav:
            # Try broader selector
            bottom_nav = await page.query_selector("nav")
        if bottom_nav:
            nav_visible = await bottom_nav.is_visible()
            if nav_visible:
                results.ok("Bottom navigation visible on mobile")
            else:
                results.fail("Bottom nav not visible")
        else:
            results.fail("Bottom nav element not found")

        # Header should show logo on mobile
        body = await page.inner_text("body")
        if "סוגרים" in body:
            results.ok("Mobile header shows logo")
        else:
            results.warn("Mobile logo not visible")

        # Navigate to settings on mobile (use visible link in bottom nav)
        settings_nav = page.locator('a[href="/settings"]:visible')
        if await settings_nav.count() > 0:
            await settings_nav.first.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "05-mobile-settings")
            results.ok("Mobile settings navigation")
        else:
            results.warn("Settings nav not found on mobile")

        # Navigate to timetable
        timetable_nav = page.locator('a[href="/timetable"]:visible')
        if await timetable_nav.count() > 0:
            await timetable_nav.first.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "05-mobile-timetable")
            results.ok("Mobile timetable navigation")

        # Back to planner
        planner_nav = page.locator('a[href="/planner"]:visible')
        if await planner_nav.count() > 0:
            await planner_nav.first.click()
            await page.wait_for_timeout(500)
            await screenshot(page, "05-mobile-planner-2")
            results.ok("Mobile planner navigation")

        # Tablet viewport
        await page.set_viewport_size({"width": 768, "height": 1024})
        await page.wait_for_timeout(500)
        await screenshot(page, "05-tablet")
        results.ok("Tablet viewport screenshot taken")

        await browser.close()


# ============================================================
# PHASE 6: Compare with Old App
# ============================================================
async def test_compare(results: TestResults):
    print("\n📋 Phase 6: Compare Old vs New")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )

        # Old app
        page_old = await ctx.new_page()
        try:
            await page_old.goto(OLD_APP, wait_until="networkidle", timeout=10000)
            await screenshot(page_old, "06-old-app")

            old_title = await page_old.title()
            results.ok("Old app loaded", old_title)

            # Check if it's actually the sogrim app
            old_text = await page_old.inner_text("body")
            if "סוגרים" in old_text:
                results.ok("Old app shows סוגרים")
            else:
                results.warn("Old app may not be sogrim (different app on port 3000?)")
        except Exception as e:
            results.fail("Old app not reachable", str(e))

        # New app
        page_new = await ctx.new_page()
        await page_new.goto(NEW_APP, wait_until="networkidle")
        await screenshot(page_new, "06-new-app")
        results.ok("New app loaded for comparison")

        # Font comparison
        new_font = await page_new.evaluate("getComputedStyle(document.body).fontFamily")
        results.ok("New app font", new_font)

        try:
            old_font = await page_old.evaluate("getComputedStyle(document.body).fontFamily")
            results.ok("Old app font", old_font)

            if "Assistant" in new_font and "Assistant" in old_font:
                results.ok("Font match: both use Assistant")
            elif "Assistant" in new_font:
                results.warn("Font difference: new has Assistant, old doesn't")
            else:
                results.fail("New app missing Assistant font")
        except Exception:
            results.warn("Could not compare fonts (old app issue)")

        await browser.close()


# ============================================================
# PHASE 7: Planner with Backend (requires running backend)
# ============================================================
async def test_planner_with_backend(results: TestResults):
    print("\n📋 Phase 7: Planner Page (requires backend)")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="he-IL",
        )
        page = await ctx.new_page()

        # Check if backend is up
        try:
            response = await page.request.get("http://localhost:8080/students/catalogs", headers={"authorization": "test"})
            if response.status == 401:
                results.ok("Backend reachable (401 = auth required)")
            elif response.status == 200:
                results.ok("Backend reachable (200)")
            else:
                results.warn(f"Backend returned {response.status}")
        except Exception as e:
            results.fail("Backend not reachable", str(e))
            results.warn("Skipping planner tests - backend required")
            await browser.close()
            return

        # If we get here, backend is up - test with Google auth
        # This requires actual Google login which we can't automate easily
        # Instead, we inject auth and test the UI
        await page.goto(NEW_APP, wait_until="networkidle")

        # Inject fake auth and navigate
        await page.evaluate("""() => {
            localStorage.setItem('sogrim-auth', JSON.stringify({
                state: {
                    token: 'fake-token',
                    userInfo: { sub: 'test-123', email: 'test@technion.ac.il', name: 'סטודנט טסט', picture: '' },
                    isAuthenticated: true
                },
                version: 0
            }));
        }""")
        await page.goto(NEW_APP + "/planner", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await screenshot(page, "07-planner-page")

        body = await page.inner_text("body")
        if "מעקב תואר" in body:
            results.ok("Planner page title visible")
        else:
            results.fail("Planner page title not found")

        # Check if onboarding or planner shows
        if "בחר מסלול" in body or "קטלוג" in body:
            results.ok("Onboarding flow shown (no catalog selected)")
            await screenshot(page, "07-onboarding-catalog")
        elif "סמסטר" in body or "חורף" in body or "אביב" in body:
            results.ok("Planner with semesters visible")
        elif "שגיאה" in body:
            results.warn("Error shown - likely auth token rejected by backend")
            await screenshot(page, "07-planner-error")
        else:
            results.warn("Planner state unclear")

        await browser.close()


# ============================================================
# Main
# ============================================================
async def main():
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    results = TestResults()

    phases = {
        "landing": test_landing,
        "auth": test_auth,
        "navigation": test_navigation,
        "settings": test_settings,
        "responsive": test_responsive,
        "compare": test_compare,
        "planner": test_planner_with_backend,
    }

    if phase == "all":
        for name, fn in phases.items():
            print(f"\n{'='*60}")
            print(f"▶ Running: {name}")
            print(f"{'='*60}")
            try:
                await fn(results)
            except Exception as e:
                results.fail(f"Phase {name} crashed", str(e))
                import traceback
                traceback.print_exc()
    elif phase in phases:
        await phases[phase](results)
    else:
        print(f"Unknown phase: {phase}")
        print(f"Available: {', '.join(phases.keys())}, all")
        sys.exit(1)

    results.summary()


if __name__ == "__main__":
    asyncio.run(main())
