/**
 * WS2812B driver
 */
//% color="#269a91" icon="\uf0eb" weight=100 category="WS2812B"
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

    /**
     * Sends a color buffer to a light strip
     */
    //% shim=light::sendWS2812Buffer
    export function sendWS2812Buffer(buf: Buffer, pinId: number) {
    }

    /**
     * Sends a color buffer to a light strip
     */
    //% blockId="ws2812b_send_buffer" block="send buffer %buf on pin %pinId" weight=90
    export function sendBuffer(buf: Buffer, pinId: number) {
        sendWS2812Buffer(buf, pinId);
    }

    /**
     * Sets the buffer mode
     */
    //% blockId="ws2812b_set_buffer_mode" block="set buffer mode on pin %pinId to %mode" weight=80
    export function setBufferMode(pinId: number, mode: number) {
        _mode = mode;
    }


    export const BUFFER_MODE_RGB = 1
    export const BUFFER_MODE_RGBW = 2
    export const BUFFER_MODE_RGB_RGB = 3
    export const BUFFER_MODE_AP102 = 4

    let _mode = BUFFER_MODE_RGB;
}
