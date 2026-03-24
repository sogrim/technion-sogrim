"""
E2E tests for Sogrim V2 using browser-use.

Prerequisites:
  1. Start the old app:  cd packages/sogrim-app && npm start  (port 3000)
  2. Start the new app:  cd packages/sogrim-app-v2 && npm run dev  (port 3001)
  3. Start the backend:  cargo run --manifest-path packages/server/Cargo.toml
  4. Set ANTHROPIC_API_KEY environment variable

Usage:
  cd packages/sogrim-app-v2
  e2e/.venv/bin/python e2e/test_app.py
"""

import asyncio
import os
import sys

from browser_use import Agent, Browser, BrowserConfig
from langchain_anthropic import ChatAnthropic


OLD_APP_URL = "http://localhost:3000"
NEW_APP_URL = "http://localhost:3001"


async def test_new_app_loads():
    """Test that the new app loads and shows the login page."""
    browser = Browser(config=BrowserConfig(headless=False))

    llm = ChatAnthropic(
        model_name="claude-sonnet-4-20250514",
        timeout=60,
        stop=None,
    )

    agent = Agent(
        task=f"""
        Go to {NEW_APP_URL}

        Verify the following:
        1. The page loads successfully
        2. You can see the app title "סוגרים" (Sogrim)
        3. There is a Google sign-in button or prompt
        4. The page is in Hebrew (RTL layout)
        5. Take a screenshot and describe what you see

        Report what you see on the page.
        """,
        llm=llm,
        browser=browser,
    )

    result = await agent.run()
    print("=== New App Load Test ===")
    print(result)
    await browser.close()
    return result


async def test_responsive_layout():
    """Test responsive layout at different viewport sizes."""
    browser = Browser(config=BrowserConfig(headless=False))

    llm = ChatAnthropic(
        model_name="claude-sonnet-4-20250514",
        timeout=60,
        stop=None,
    )

    agent = Agent(
        task=f"""
        Go to {NEW_APP_URL}

        Test responsive design:
        1. At desktop size (1280x800): verify sidebar navigation is visible
        2. Resize to mobile (375x812): verify bottom navigation appears and sidebar hides
        3. Check that all text is readable at both sizes
        4. Take screenshots at each viewport size

        Report your findings.
        """,
        llm=llm,
        browser=browser,
    )

    result = await agent.run()
    print("=== Responsive Layout Test ===")
    print(result)
    await browser.close()
    return result


async def test_navigation():
    """Test navigation between pages."""
    browser = Browser(config=BrowserConfig(headless=False))

    llm = ChatAnthropic(
        model_name="claude-sonnet-4-20250514",
        timeout=60,
        stop=None,
    )

    agent = Agent(
        task=f"""
        Go to {NEW_APP_URL}

        Test navigation:
        1. Click on "הגדרות" (Settings) in the navigation
        2. Verify the settings page loads with sections for profile, catalog, and theme
        3. Click on "מערכת שעות" (Timetable)
        4. Verify it shows a "coming soon" placeholder
        5. Click on "מעקב תואר" (Degree Planner)
        6. Verify you're back on the main planner page

        Report what you see at each step.
        """,
        llm=llm,
        browser=browser,
    )

    result = await agent.run()
    print("=== Navigation Test ===")
    print(result)
    await browser.close()
    return result


async def test_compare_old_and_new():
    """Open both apps side by side and compare."""
    browser = Browser(config=BrowserConfig(headless=False))

    llm = ChatAnthropic(
        model_name="claude-sonnet-4-20250514",
        timeout=120,
        stop=None,
    )

    agent = Agent(
        task=f"""
        Compare the old and new Sogrim apps:

        1. Open a new tab and go to {OLD_APP_URL}
        2. Take a screenshot of the old app
        3. Open another tab and go to {NEW_APP_URL}
        4. Take a screenshot of the new app
        5. Compare and report:
           - What features are visible in both?
           - What looks different?
           - Which has a more modern UI?
           - Is the Hebrew text readable in both?

        Provide a detailed comparison.
        """,
        llm=llm,
        browser=browser,
    )

    result = await agent.run()
    print("=== Old vs New Comparison ===")
    print(result)
    await browser.close()
    return result


async def main():
    """Run all tests."""
    test_name = sys.argv[1] if len(sys.argv) > 1 else "all"

    tests = {
        "load": test_new_app_loads,
        "responsive": test_responsive_layout,
        "navigation": test_navigation,
        "compare": test_compare_old_and_new,
    }

    if test_name == "all":
        for name, test_fn in tests.items():
            print(f"\n{'='*60}")
            print(f"Running: {name}")
            print(f"{'='*60}\n")
            try:
                await test_fn()
            except Exception as e:
                print(f"FAILED: {name} - {e}")
    elif test_name in tests:
        await tests[test_name]()
    else:
        print(f"Unknown test: {test_name}")
        print(f"Available: {', '.join(tests.keys())}, all")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
