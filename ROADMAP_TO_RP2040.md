# Roadmap to RP2040 Port

This document outlines the strategy for porting the `pxt-ws2812b` extension from its micro:bit-centric upstream state to support the RP2040 (Raspberry Pi Pico) and other Maker targets.

## Upstream State Analysis
The upstream repository (`microsoft/pxt-ws2812b`) is tightly coupled to the micro:bit architecture:
- **Assembly Dependency**: Uses `sendBuffer.asm` which contains nRF51/nRF52 specific assembly and mbed register offsets.
- **Type Constraints**: Uses the `DigitalPin` enum, which varies between PXT targets.
- **Limited Scope**: `pxt.json` only lists `microbit` as a supported target.

## Porting Roadmap

### Step 1: Universal Pin Identification
**Objective**: Ensure the extension can reference pins on any board without enum conflicts.

- **Variant A**: Retain `DigitalPin`.
  - *Pros*: Standard for micro:bit.
  - *Cons*: Fails to compile on RP2040 targets where `DigitalPin` is defined differently or not at all.
- **Variant B**: Use `number` for `pinId`.
  - *Pros*: Completely portable; avoids PXT's heuristic "missing pin shim" errors on RP2040.
  - *Cons*: Less type-safe for the user in the code editor (though blocks mitigate this).
- **Variant C**: Use a generic `Pin` type if available in `core`.
  - *Pros*: Semantic.
  - *Cons*: Not consistently available across all PXT target versions.

**Selection: Variant B (Use `number` for `pinId`)**. This is the most reliable method for cross-target compatibility in PXT.

---

### Step 2: Leverage Core Hardware Shims
**Objective**: Replace target-specific assembly with portable core shims.

- **Variant A**: Implement RP2040 PIO assembly in the extension.
  - *Pros*: High performance.
  - *Cons*: High maintenance; duplicates code already present in the RP2040 target core.
- **Variant B**: Use `light::sendBuffer`.
  - *Pros*: Higher level.
  - *Cons*: Not available on all boards (e.g., some RP2040 Maker boards).
- **Variant C**: Use `light::sendWS2812Buffer`.
  - *Pros*: Direct access to the core's optimized WS2812 driver (uses PIO on RP2040, ASM on micro:bit).
  - *Cons*: Requires `core` to provide the shim.

**Selection: Variant C (`light::sendWS2812Buffer`)**. It utilizes the best available driver for each specific hardware target automatically.

---

### Step 3: Package Configuration Clean-up
**Objective**: Optimize `pxt.json` for multi-target support.

- **Variant A**: Keep ASM files in `pxt.json` but wrapped in target-specific folders.
  - *Pros*: Backwards compatible.
  - *Cons*: Complex directory structure; `binaryonly` targets prefer shims.
- **Variant B**: Remove ASM files and set `"binaryonly": true`.
  - *Pros*: Slimmer package; forces the use of core shims which are more stable across updates.
  - *Cons*: Breaks if a target lacks the `light` shim.
- **Variant C**: Maintain separate branches for micro:bit and RP2040.
  - *Pros*: Optimized for each.
  - *Cons*: High maintenance fragmentation.

**Selection: Variant B (Remove ASM, use `binaryonly: true`)**. Modern PXT targets (v7+) provide the necessary shims in their core packages.

---

### Step 4: Verification Strategy
**Objective**: Ensure functionality across simulators and hardware.

- **Variant A**: Physical hardware verification only.
  - *Pros*: 100% certainty on timing.
  - *Cons*: Slow; hard to scale.
- **Variant B**: Playwright E2E tests on `maker.makecode.com`.
  - *Pros*: Verifies the entire toolchain (Compilation -> Simulation -> Blocks UI).
  - *Cons*: Requires CI setup.
- **Variant C**: PXT internal unit tests (`test.ts`).
  - *Pros*: Fast.
  - *Cons*: Doesn't verify actual hardware timing or shim presence.

**Selection: Variant B (Playwright E2E)**. Essential for verifying that the "Raspberry Pi Pico" target specifically accepts the extension and compiles correctly.

## Implementation Checklist
1. [ ] Rename `pin` to `pinId` and change type to `number` in `main.ts`.
2. [ ] Update `//% shim` to `light::sendWS2812Buffer`.
3. [ ] Remove `sendBuffer.asm` and `setBufferMode.asm` from `pxt.json`.
4. [ ] Add `rp2040` to `supportedTargets`.
5. [ ] Set `"binaryonly": true` in `pxt.json`.
6. [ ] Add E2E tests in `tests/maker.spec.ts`.
