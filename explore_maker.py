import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        print("Navigating to maker.makecode.com...")
        await page.goto("https://maker.makecode.com/?ignorecache=1")

        # Wait for any loading to finish
        await asyncio.sleep(5)
        await page.screenshot(path="maker_home.png")

        # Try to find "New Project" button. It might be a div with an icon.
        # Often it has a class like "focused" or "card"
        new_project = page.locator(".card", has_text="New Project")
        if await new_project.count() == 0:
             new_project = page.locator("text=New Project")

        print(f"Found {await new_project.count()} New Project elements")

        # Click the first visible one
        for i in range(await new_project.count()):
            loc = new_project.nth(i)
            if await loc.is_visible():
                print(f"Clicking New Project element {i}")
                await loc.click()
                break

        await asyncio.sleep(2)
        await page.screenshot(path="new_project_dialog.png")

        # Fill project name
        await page.fill("input[placeholder='Project Name']", "PicoTest")
        await page.click("button:has-text('Create')")

        await asyncio.sleep(5)
        await page.screenshot(path="after_create.png")

        # If board picker appears
        pico = page.locator("text=Raspberry Pi Pico")
        if await pico.count() > 0:
            print("Pico found, clicking...")
            await pico.first.click()
            await asyncio.sleep(5)
            await page.screenshot(path="editor_loaded.png")
        else:
            print("Pico not found immediately. Checking if we are already in editor.")
            await page.screenshot(path="not_pico.png")

        await browser.close()

asyncio.run(run())
