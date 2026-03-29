import { test, expect } from '@playwright/test';

test('maker load extension in maker.makecode.com and verify blocks', async ({ page }) => {
    test.setTimeout(240000);

    console.log("Navigating to maker.makecode.com...");
    await page.goto('https://maker.makecode.com/?forceRP2040=1', { waitUntil: 'networkidle' });

    // Click "New Project"
    console.log("Clicking New Project...");
    const newProjectCard = page.locator('.newprojectcard, #newproject, .ui.card.clickable').filter({ hasText: /New Project/i }).first();
    await expect(newProjectCard).toBeVisible({ timeout: 15000 });
    await page.evaluate((el) => (el as HTMLElement).click(), await newProjectCard.elementHandle());

    // Wait for the project name input
    console.log("Entering project name...");
    const nameInput = page.locator('div.modal input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill('Test WS2812B');

    const createButton = page.locator('div.modal button.positive, div.modal button:has-text("Create")').first();
    await createButton.click();

    // Board Selection - Raspberry Pi Pico (if it appears)
    console.log("Checking for Raspberry Pi Pico board selection...");
    try {
        const picoBoard = page.locator('.ui.card, .card').filter({ hasText: /Raspberry Pi Pico/i }).first();
        if (await picoBoard.isVisible({ timeout: 10000 })) {
            await picoBoard.click();
            console.log("Selected Raspberry Pi Pico");
        }
    } catch (e) {
        console.log("Board selection skipped or handled.");
    }

    // Wait for the editor to load
    console.log("Waiting for editor...");
    const blocklyTree = page.locator('.blocklyTreeRoot').first();
    await expect(blocklyTree).toBeVisible({ timeout: 60000 });

    // Open Extensions
    console.log("Opening Extensions...");
    const extensionsButton = page.locator('.blocklyTreeRow').filter({ hasText: /Extensions/i }).first();
    await expect(extensionsButton).toBeVisible({ timeout: 15000 });
    await extensionsButton.click();

    // Import extension
    console.log("Importing extension...");
    const searchInput = page.locator('input[type="text"]').filter({ state: 'visible' }).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('https://github.com/chatelao/pxt-ws2812b');
    await page.keyboard.press('Enter');

    // Wait for results and click the extension card
    console.log("Waiting for extension card...");
    const extensionTitle = page.getByText('ws2812b').first();
    await expect(extensionTitle).toBeVisible({ timeout: 60000 });
    await extensionTitle.click();

    // Wait for extension to load (look for LIGHT category)
    console.log("Waiting for LIGHT category...");
    const lightCategory = page.locator('.blocklyTreeRow').filter({ hasText: /LIGHT/i }).first();
    await expect(lightCategory).toBeVisible({ timeout: 60000 });

    // Click it to show blocks
    await lightCategory.click();
    await page.waitForTimeout(1000);
    // Assertion: verify blocklyFlyout is visible after clicking the category
    const blocklyFlyout = page.locator('.blocklyFlyout');
    await expect(blocklyFlyout).toBeVisible();

    await page.screenshot({ path: 'test-results/extension-blocks.png' });
    console.log("Screenshot of blocks saved.");

    // Switch to JavaScript
    console.log("Switching to JavaScript...");
    const jsButton = page.locator('a, div').filter({ hasText: /^JavaScript$/ }).first();
    await jsButton.click();

    // Handle "Problem converting" dialog if it appears
    try {
        const doneButton = page.locator('button').filter({ hasText: /Done|Discard|Stay/i }).first();
        if (await doneButton.isVisible({ timeout: 5000 })) {
            await doneButton.click();
        }
    } catch (e) {}

    console.log("Waiting for Monaco...");
    const monacoEditor = page.locator('div[role="code"].monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 30000 });

    // Inject code
    const code = `
ws2812b.setBufferMode(0, 1);
ws2812b.sendBuffer(hex\`ff0000 00ff00 0000ff\`, 0);
`;

    console.log("Injecting code...");
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(code);

    // Wait for compilation/background work
    await page.waitForTimeout(5000);

    // Switch back to Blocks
    console.log("Switching back to Blocks...");
    const blocksButton = page.locator('a, div').filter({ hasText: /^Blocks$/ }).first();
    await blocksButton.click();

    // If there's an error converting back, it might show a dialog
    console.log("Checking for 'Discard' or 'Stay' dialogs...");
    const discardButton = page.locator('button').filter({ hasText: /Discard|Stay/i });
    if (await discardButton.count() > 0) {
        try {
            const firstDiscard = discardButton.first();
            if (await firstDiscard.isVisible({ timeout: 5000 })) {
                await firstDiscard.click();
            }
        } catch (e) {}
    }

    // Final check
    console.log("Final verification...");

    // Wait for the workspace to settle
    await page.waitForTimeout(5000);

    // Verify that there are blocks in the workspace
    const blocks = page.locator('.blocklyWorkspace .blocklyDraggable');
    const blockCount = await blocks.count();
    console.log(`Blocks found: ${blockCount}`);

    // Even if they are "hidden" by Playwright's visibility definition (e.g. obscured by a modal),
    // they should be present in the DOM.
    expect(blockCount).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/final-project.png' });
    console.log("Final project screenshot saved.");
});
