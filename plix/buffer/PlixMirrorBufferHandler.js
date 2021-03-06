const colorUtils = require("../utils/color_utils");
const PlixBufferHandler = require('./PlixBufferHandler');

module.exports = class PlixMirrorBufferHandler extends PlixBufferHandler {

    set(part, color) {
        const clr = typeof color === "number" ? color : colorUtils.colorToNumber(color);
        const setColor = (i) => {
            const i2 =  this.length-i;
            this.buffer[i] = this.buffer[i2] = clr;
        };
        if (typeof part === "number") {
            setColor(part)
        } else if (typeof part === "object" && part instanceof Array) {
            part.forEach(setColor);
        } else {
            throw new Error("Part not supported: "+part)
        }
    }
};