import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)

        page = await browser.new_page()
        await page.goto("https://example.com")

        title = await page.title()

        print("Browser opened successfully!")
        print("Website title:", title)

        await browser.close()


asyncio.run(main())