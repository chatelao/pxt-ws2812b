/**
 * WS2812B driver
 */
//% color="#269a91" icon="\uf0eb" weight=100
namespace ws2812b {
    /**
     * Buffer mode for WS2812B
     */
    export enum BufferMode {
        //% block="RGB"
        RGB = 1,
        //% block="RGBW"
        RGBW = 2,
        //% block="RGB_RGB"
        RGB_RGB = 3,
        //% block="AP102"
        AP102 = 4
    }

    //% shim=light::sendWS2812Buffer
    /**
     * Sends a color buffer to a light strip
     */
    //% blockId="ws2812b_send_buffer" block="send buffer %buf on pin %pin" weight=90
    export function sendBuffer(buf: Buffer, pin: number) {
    }

    /**
     * Sets the buffer mode
     */
    //% blockId="ws2812b_set_buffer_mode" block="set buffer mode on pin %pin to %mode" weight=80
    export function setBufferMode(pin: number, mode: number) {
    }

    export const BUFFER_MODE_RGB = 1
    export const BUFFER_MODE_RGBW = 2
    export const BUFFER_MODE_RGB_RGB = 3
    export const BUFFER_MODE_AP102 = 4
}
