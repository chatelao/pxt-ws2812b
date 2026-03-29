# Code to Signal: WS2812B Implementation Details

This document describes how a call in TypeScript translates to an electrical signal on a pin for the supported platforms.

## General Flow

1.  **TypeScript Layer**: The user calls `ws2812b.sendBuffer(buf, pinId)`.
2.  **Shim Layer**: The TypeScript function is a wrapper for a C++ shim defined as `light::sendWS2812Buffer`.
3.  **C++ Layer**: The PXT (MakeCode) runtime dispatches this call to the platform-specific implementation of the `light` namespace.
4.  **Hardware Layer**: The platform-specific code uses either assembly-based bit-banging or hardware peripherals (like PIO) to generate the timed signal.

---

## Micro:bit (nRF52)

The micro:bit implementation relies on precise assembly timing to meet the WS2812B requirements (800kHz signal).

1.  **C++ Shim**: In `pxt-microbit`, `light::sendWS2812Buffer` calls a static `neopixel_send_buffer` function.
2.  **Interrupt Management**: To ensure timing accuracy, the C++ code calls `__disable_irq()` before sending the data and `__enable_irq()` afterwards.
3.  **Assembly Bit-Banging**: The core work is done in `sendbuffernrf52.s`.
    -   It calculates a bit-mask for the target pin.
    -   It iterates through each byte in the buffer.
    -   For each bit, it sets the pin HIGH, waits for a specific number of cycles (using `nop` or `subs` loops), then sets the pin LOW and waits again.
    -   The number of cycles is tuned for the 64MHz clock of the nRF52833/nRF52832 to match the WS2812B protocol (T0H, T0L, T1H, T1L).
4.  **Electrical Signal**: The assembly `str` instructions write directly to the `NRF_P0->OUTSET` and `NRF_P0->OUTCLR` registers (or P1), which causes the GPIO pin to change voltage almost instantly.

---

## RP2040 (Raspberry Pi Pico)

The RP2040 implementation leverages its unique Programmable I/O (PIO) peripheral, which is much more efficient than bit-banging.

1.  **C++ Shim**: The `light` shim for RP2040 interfaces with the RP2040's hardware abstraction layer.
2.  **PIO Configuration**: A PIO state machine is dedicated to WS2812B output. A small PIO program (usually 3-4 instructions) is loaded into the PIO instruction memory.
3.  **Data Transfer**: The C++ code writes the buffer data into the PIO's Transmit FIFO (TX FIFO). This can be done via the CPU or DMA (Direct Memory Access).
4.  **Signal Generation**:
    -   The PIO state machine pulls data from the FIFO.
    -   It executes the PIO program which handles the HIGH/LOW transitions and timing internally, independent of the main CPU.
    -   This allows the CPU to continue other tasks while the signal is being "shifted out".
5.  **Electrical Signal**: The PIO mapped GPO (Output) pins reflect the state defined by the PIO instructions, providing a jitter-free 800kHz signal to the WS2812B LEDs.
