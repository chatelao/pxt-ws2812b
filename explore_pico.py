import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        print("Navigating to maker.makecode.com...")
        await page.goto("https://maker.makecode.com/")

        print("Clicking 'New Project'...")
        await page.click("text=New Project")

        print("Entering project name...")
        await page.fill("input[placeholder='Project Name']", "PicoTest")

        print("Clicking 'Create'...")
        await page.click("button:has-text('Create')")

        print("Waiting for board selection...")
        await page.wait_for_selector("text=Boards")
        await page.screenshot(path="/home/jules/verification/boards_list.png")

        # Try to find Raspberry Pi Pico
        print("Searching for Raspberry Pi Pico...")
        # We might need to scroll
        pico_card = page.locator("text=Raspberry Pi Pico")
        if await pico_card.count() == 0:
            print("Pico not found, scrolling...")
            for i in range(5):
                await page.mouse.wheel(0, 1000)
                await asyncio.sleep(0.5)
                if await pico_card.count() > 0:
                    break

        if await pico_card.count() > 0:
            print("Found Pico, clicking...")
            await pico_card.click()
        else:
            print("Pico still not found after scrolling.")
            await page.screenshot(path="/home/jules/verification/boards_list_scrolled.png")
            await browser.close()
            return

        print("Waiting for editor to load...")
        # The editor has a toolbox
        await page.wait_for_selector(".blocklyToolboxDiv", timeout=30000)
        await page.screenshot(path="/home/jules/verification/editor_pico.png")

        print("Looking for Extensions...")
        # Extensions is often under "Advanced" or at the bottom of the toolbox
        # In Maker it might be different. Let's try to click "Advanced" first if it exists.
        advanced = page.locator("text=Advanced")
        if await advanced.count() > 0:
            print("Clicking Advanced...")
            await advanced.click()
            await asyncio.sleep(1)

        extensions = page.locator("text=Extensions")
        if await extensions.count() > 0:
            print("Found Extensions, clicking...")
            await extensions.click()
        else:
            print("Extensions not found in toolbox.")
            # Maybe it's in the gear menu?
            await page.click("#editortools .item[role='button'] i.settings") # Gear icon
            await asyncio.sleep(1)
            await page.screenshot(path="/home/jules/verification/settings_menu.png")
            extensions_in_menu = page.locator("text=Extensions")
            if await extensions_in_menu.count() > 0:
                print("Found Extensions in settings menu.")
                await extensions_in_menu.click()
            else:
                print("Extensions still not found.")

        await asyncio.sleep(2)
        await page.screenshot(path="/home/jules/verification/extensions_dialog.png")

        await browser.close()

asyncio.run(run())
