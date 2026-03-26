import { test, expect } from '@playwright/test';

test('maker load extension in maker.makecode.com and verify blocks', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(180000);

    // Navigate to maker.makecode.com
    console.log("Navigating to maker.makecode.com...");
    await page.goto('https://maker.makecode.com/', { waitUntil: 'networkidle' });

    // Click "New Project"
    console.log("Clicking New Project...");
    const newProjectCard = page.locator('.newprojectcard, #newproject, .ui.card.clickable').filter({ hasText: /New Project/i }).first();
    await newProjectCard.waitFor({ state: 'visible' });
    // Use evaluate click as it's more reliable for these cards
    await page.evaluate((el) => (el as HTMLElement).click(), await newProjectCard.elementHandle());

    // Wait for the project name input
    console.log("Entering project name...");
    const nameInput = page.locator('div.modal input[type="text"]').first();
    await nameInput.waitFor({ state: 'visible', timeout: 15000 });
    await nameInput.fill('Test WS2812B');

    const createButton = page.locator('div.modal button.positive, div.modal button:has-text("Create")').first();
    await createButton.click();

    // Board Selection - Raspberry Pi Pico
    console.log("Selecting Raspberry Pi Pico...");
    try {
        // Wait for board selection cards
        await page.waitForSelector('.ui.card, .card', { timeout: 15000 });
        const picoBoard = page.locator('.ui.card, .card').filter({ hasText: /Raspberry Pi Pico/i }).first();
        await picoBoard.waitFor({ state: 'visible', timeout: 5000 });
        await picoBoard.click();
        console.log("Selected Raspberry Pi Pico");
    } catch (e) {
        console.log("Raspberry Pi Pico board selection not found or already selected. Continuing...");
    }

    // Wait for the editor to load (Monaco or Toolbox)
    console.log("Waiting for editor...");
    await page.waitForSelector('.blocklyTreeRow, .monaco-editor', { timeout: 60000 });

    // Open Extensions
    console.log("Opening Extensions...");
    const extensionsButton = page.locator('.blocklyTreeRow').filter({ hasText: /Extensions/i }).first();
    await extensionsButton.waitFor({ state: 'visible', timeout: 15000 });
    await extensionsButton.click();

    // Import extension
    console.log("Importing extension...");
    const searchInput = page.locator('.extensions-browser input[type="text"]').first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.click();
    await searchInput.fill('https://github.com/chatelao/pxt-ws2812b');
    await page.keyboard.press('Enter');

    // Wait for results
    console.log("Waiting for extension card...");
    // Wait for any card that contains "ws2812b"
    const extensionCard = page.locator('.extensions-browser .card, .extensions-browser .ui.card, .extensions-browser .item').filter({ hasText: /ws2812b/i }).first();

    // Increased wait time and using attached state as it might be partially visible
    await extensionCard.waitFor({ state: 'attached', timeout: 60000 });

    // Force click via JS
    console.log("Clicking extension card via evaluate...");
    await page.evaluate((selector) => {
        const elements = Array.from(document.querySelectorAll(selector));
        const target = elements.find(el => /ws2812b/i.test(el.textContent || ""));
        if (target) {
            (target as HTMLElement).click();
            return true;
        }
        return false;
    }, '.extensions-browser .card, .extensions-browser .ui.card, .extensions-browser .item');

    // Wait for editor to reload
    console.log("Waiting for editor to reload after extension import...");
    // After clicking, the modal should close and toolbox should reappear
    await page.waitForSelector('.blocklyToolboxDiv', { timeout: 60000 });

    // Switch to JavaScript/TypeScript tab to inject code
    console.log("Switching to JavaScript/TypeScript...");
    const tsTab = page.locator('a.item').filter({ hasText: /JavaScript|TypeScript/ }).first();
    await tsTab.click();

    await page.waitForSelector('.monaco-editor');

    // Inject code using WS2812B blocks
    const code = `
let strip = ws2812b.create(DigitalPin.GP2, 10, NumberFormat.UInt8_BE);
strip.setPixelColor(0, 0xff0000);
strip.show();
`;

    console.log("Injecting code...");
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(code);

    await page.waitForTimeout(2000);

    // Switch back to Blocks to verify it's working
    console.log("Switching back to Blocks...");
    const blocksTab = page.locator('a.item').filter({ hasText: /Blocks/ }).first();
    await blocksTab.click();

    // Wait for blockly to render
    await page.waitForSelector('.blocklyBlockCanvas', { timeout: 30000 });

    // Take a screenshot to verify
    await page.screenshot({ path: 'test-results/blocks-verified.png' });
    console.log("Screenshot saved to test-results/blocks-verified.png");
});
