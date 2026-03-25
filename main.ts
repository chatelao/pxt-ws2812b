namespace ws2812b {
    //% shim=sendBufferAsm
    /**
     * Sends a color buffer to a light strip
     */
    export function sendBuffer(buf: Buffer, pin: number) {
    }

    //% shim=setBufferMode
    /**
     * Sets the buffer mode
     */
    export function setBufferMode(pin: number, mode: number) {

    }

    export const BUFFER_MODE_RGB = 1
    export const BUFFER_MODE_RGBW = 2
    export const BUFFER_MODE_RGB_RGB = 3
    export const BUFFER_MODE_AP102 = 4
}
