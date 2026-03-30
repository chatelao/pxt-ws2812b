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

    /**
     * A WS2812B strip
     */
    //% fixedInstances
    export class Strip {
        buf: Buffer;
        pinId: number;

        /**
         * Sends the buffer to the strip
         */
        //% blockId="ws2812b_strip_show" block="show %strip" weight=90
        show() {
            sendBuffer(this.buf, this.pinId);
        }

        /**
         * Sets the buffer
         */
        //% blockId="ws2812b_strip_set_buffer" block="set %strip buffer to %buf" weight=80
        setBuffer(buf: Buffer) {
            this.buf = buf;
        }
    }

    /**
     * Creates a new WS2812B strip
     */
    //% blockId="ws2812b_create" block="create strip on pin %pinId with %numleds leds" weight=100
    export function create(pinId: number, numleds: number): Strip {
        let strip = new Strip();
        let stride = _mode == BUFFER_MODE_RGBW ? 4 : 3;
        strip.buf = control.createBuffer(numleds * stride);
        strip.pinId = pinId;
        return strip;
    }
}
