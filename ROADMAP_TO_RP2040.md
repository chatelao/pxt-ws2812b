# Roadmap to RP2040 Porting

This document outlines the steps required to port the upstream `pxt-ws2812b` repository (optimized for micro:bit) to support the RP2040 (Raspberry Pi Pico).

## Step 1: Replace Platform-Specific Assembly

The upstream repo uses `sendBuffer.asm` and `setBufferMode.asm` which contain Cortex-M0 assembly specific to the micro:bit's memory-mapped I/O.

*   **Variant A: Port Assembly to RP2040.** Write new assembly files using RP2040-specific register addresses or PIO instructions.
*   **Variant B: Use Core Shims.** Replace the custom assembly shims with the built-in `light::sendWS2812Buffer` shim provided by the PXT core.
*   **Variant C: C++ Bit-banging.** Implement the timing logic in C++ within the extension.

**Selection: Variant B.** Using `light::sendWS2812Buffer` is the most portable approach. It leverages the underlying platform's best implementation (e.g., PIO on RP2040, DMA where available) without maintaining architecture-specific code in this extension.

## Step 2: Generalize Pin Parameter Type

Upstream uses the `DigitalPin` enum, which is target-specific and can cause compilation errors on RP2040 due to different pin mapping logic.

*   **Variant A: Maintain `DigitalPin`.** Keep the enum and rely on PXT to map it correctly across targets.
*   **Variant B: Use `number` type.** Change the parameter type to `number`.
*   **Variant C: Use `number` and rename to `pinId`.** Change the type to `number` and rename the parameter from `pin` to `pinId`.

**Selection: Variant C.** Renaming to `pinId` prevents the PXT compiler's heuristic "Pin Fixup" from attempting to convert the value into a native pointer/address, which is a common cause of "unknown label" or "function not found" errors on RP2040.

## Step 3: Update Package Configuration (`pxt.json`)

The `pxt.json` must be updated to include the RP2040 target and ensure the compiler doesn't attempt to include the old assembly files.

*   **Variant A: Add `rp2040` to `supportedTargets`.** Simply expand the target list.
*   **Variant B: Set `binaryonly: true`.** Force the compiler to skip native C++/ASM compilation for this package, relying entirely on shims.
*   **Variant C: Both A and B, and remove `.asm` from `files`.** Comprehensive update of the manifest.

**Selection: Variant C.** This ensures the extension is marked as compatible, prevents the micro:bit assembly from breaking RP2040 builds, and optimizes the extension for cross-target compatibility.

## Step 4: Testing & Verification

Verification is needed to ensure the blocks generate correct code for the RP2040.

*   **Variant A: Unit tests in `test.ts`.** Basic logic checks using `pxt test`.
*   **Variant B: Manual verification in Maker Editor.** Manually import and test blocks on `maker.makecode.com`.
*   **Variant C: Automated E2E tests with Playwright.** Use Playwright to automate the Maker Editor, switch to RP2040 (Pico), and verify block-to-code compilation.

**Selection: Variant C.** Automated E2E testing provides the highest confidence that the extension works within the actual user environment (the web editor) for the specific RP2040 target.

## Summary of Ported State (Target)

1.  `main.ts` uses `//% shim=light::sendWS2812Buffer`.
2.  Functions use `pinId: number` instead of `pin: DigitalPin`.
3.  `pxt.json` includes `"binaryonly": true` and `"supportedTargets": ["microbit", "rp2040"]`.
4.  Assembly files are removed or excluded.
