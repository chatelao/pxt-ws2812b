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

    /**
     * Sends a color buffer to a light strip
     */
    //% blockId="ws2812b_send_buffer" block="send buffer %buf on pin %pin" weight=90
    //% shim=light::sendWS2812Buffer
    export function sendWS2812Buffer(buf: Buffer, pin: number) {
    }

    //% shim=light::setMode
    export function setWS2812Mode(pin: number, mode: number) {
    }

    //% shim=light::sendBuffer
    export function sendBufferOther(pin: number, clk: number, mode: number, buf: Buffer) {
    }

    /**
     * Sends a color buffer to a light strip
     */
    //% blockId="ws2812b_send_buffer" block="send buffer %buf on pin %pin" weight=90
    export function sendBuffer(buf: Buffer, pin: number) {
        const l: any = light;
        if (l && l.sendWS2812Buffer) {
            sendWS2812Buffer(buf, pin);
        } else {
            sendBufferOther(pin, 0, _mode, buf);
        }
    }

    /**
     * Sets the buffer mode
     */
    //% blockId="ws2812b_set_buffer_mode" block="set buffer mode on pin %pin to %mode" weight=80
    export function setBufferMode(pin: number, mode: number) {
        _mode = mode;
        const l: any = light;
        if (l && l.setMode) {
            setWS2812Mode(pin, mode);
        }
    }


    export const BUFFER_MODE_RGB = 1
    export const BUFFER_MODE_RGBW = 2
    export const BUFFER_MODE_RGB_RGB = 3
    export const BUFFER_MODE_AP102 = 4

    let _mode = BUFFER_MODE_RGB;
}
