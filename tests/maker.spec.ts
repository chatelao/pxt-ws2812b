import { test, expect } from '@playwright/test';

test('maker load extension in maker.makecode.com and verify blocks', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    console.log("Navigating to maker.makecode.com...");
    // Force RP2040 and bypass some tutorials/popups if possible
    await page.goto('https://maker.makecode.com/?forceRP2040=1&nosandbox=1', { waitUntil: 'networkidle' });

    // Click "New Project"
    console.log("Clicking New Project...");
    const newProjectCard = page.locator('.newprojectcard, #newproject, .ui.card.clickable').filter({ hasText: /New Project/i }).first();
    await expect(newProjectCard).toBeVisible({ timeout: 30000 });
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
        // Wait a bit for board selection to appear
        const picoBoard = page.locator('.ui.card, .card').filter({ hasText: /Raspberry Pi Pico/i }).first();
        if (await picoBoard.isVisible({ timeout: 15000 })) {
            await picoBoard.click();
            console.log("Selected Raspberry Pi Pico");
        }
    } catch (e) {
        console.log("Board selection skipped or handled.");
    }

    // Wait for the editor to load
    console.log("Waiting for editor...");
    const blocklyTree = page.locator('.blocklyTreeRoot').first();
    await expect(blocklyTree).toBeVisible({ timeout: 90000 });

    // Open Extensions
    console.log("Opening Extensions...");
    const extensionsButton = page.locator('.blocklyTreeRow').filter({ hasText: /Extensions/i }).first();
    await expect(extensionsButton).toBeVisible({ timeout: 30000 });
    await extensionsButton.click();

    // Import extension
    console.log("Importing extension...");
    const searchInput = page.locator('input[type="text"]').filter({ state: 'visible' }).first();
    await expect(searchInput).toBeVisible();
    // Use the current repository URL if provided, otherwise default to the repo
    const extensionUrl = process.env.EXTENSION_URL || 'https://github.com/chatelao/pxt-ws2812b';
    console.log(`Using extension URL: ${extensionUrl}`);
    await searchInput.fill(extensionUrl);
    await page.keyboard.press('Enter');

    // Wait for results and click the extension card
    console.log("Waiting for extension card...");
    const extensionTitle = page.getByText('ws2812b').first();
    await expect(extensionTitle).toBeVisible({ timeout: 60000 });
    await extensionTitle.click();

    // Wait for extension to load (it shows a loading overlay)
    console.log("Waiting for extension to finish loading...");
    await page.waitForTimeout(5000); // Give it some time to start loading

    // Wait for the toolbox to update. We expect "WS2812B" or at least "LIGHT"
    console.log("Waiting for WS2812B or LIGHT category...");
    const wsCategory = page.locator('.blocklyTreeRow').filter({ hasText: /WS2812B|LIGHT/i }).first();
    await expect(wsCategory).toBeVisible({ timeout: 90000 });

    // Click it to show blocks
    await wsCategory.click();
    await page.waitForTimeout(2000);

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
        if (await doneButton.isVisible({ timeout: 10000 })) {
            console.log("Handling conversion dialog...");
            await doneButton.click();
        }
    } catch (e) {}

    console.log("Waiting for Monaco...");
    const monacoEditor = page.locator('div[role="code"].monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 60000 });

    // Inject code
    const code = `
ws2812b.setBufferMode(0, 1);
ws2812b.sendBuffer(hex\`ff0000 00ff00 0000ff\`, 0);
`;

    console.log("Injecting code...");
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    // Slow down typing to avoid issues
    await page.keyboard.type(code, { delay: 50 });

    // Wait for compilation/background work
    console.log("Waiting for compilation...");
    await page.waitForTimeout(10000);

    // Switch back to Blocks
    console.log("Switching back to Blocks...");
    const blocksButton = page.locator('a, div').filter({ hasText: /^Blocks$/ }).first();
    await blocksButton.click();

    // If there's an error converting back, it might show a dialog
    console.log("Checking for 'Discard' or 'Stay' dialogs...");
    await page.waitForTimeout(2000);
    const discardButton = page.locator('button').filter({ hasText: /Discard|Stay/i });
    if (await discardButton.count() > 0) {
        try {
            const firstDiscard = discardButton.first();
            if (await firstDiscard.isVisible({ timeout: 10000 })) {
                console.log("Clicking discard/stay button...");
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

    // Take a screenshot even if it fails
    await page.screenshot({ path: 'test-results/final-project.png' });

    expect(blockCount).toBeGreaterThan(0);
    console.log("Final project screenshot saved. Test passed!");
});
