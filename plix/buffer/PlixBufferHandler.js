const colorUtils = require("../utils/color_utils");

module.exports = class PlixBufferHandler {

    constructor(length){
        this.length = length;
        this.reset();
    }

    reset(){
        this.buffer = new Array(this.length).fill(null);
    }

    set(leds, color) {
        const clr = colorUtils.colorToNumber(color);
        const typeOfPart = typeof  leds;
        if (typeOfPart === "number") {
            this.buffer[leds] = clr;
        } else if (typeOfPart === "object" && leds instanceof Array) {
            leds.forEach((p) => this.buffer[p] = clr)
        } else {
            throw new Error("Bad leds specified: "+leds)
        }
    }

    combineWith(bufferHandler, method="just") {
        const bufferB = bufferHandler.buffer;
        let mapFunction;
        switch (method) {
            case "sum":
            case "dif":
                mapFunction = (val, i) => {
                    const valB = bufferB[i];
                    if (val === null && valB === null) return null;
                    const currentColor = colorUtils.numberToColor(val);
                    const colorB = colorUtils.numberToColor(valB);
                    const colorMethod = colorUtils[method];
                    const resColor = colorMethod(currentColor,colorB);
                    return colorUtils.colorToNumber(resColor);
                };
                break;
            case "min":
            case "max":
            case "min_components":
            case "max_components":
                mapFunction = (val, i) => {
                    const valB = bufferB[i];
                    if (val === null || valB === null) {
                        if (val === null) return valB;
                        return val;
                    }
                    const currentColor = colorUtils.numberToColor(val);
                    const colorB = colorUtils.numberToColor(valB);
                    const colorMethod = colorUtils[method];
                    const resColor = colorMethod(currentColor,colorB);
                    return colorUtils.colorToNumber(resColor);
                };
                break;
            case "just":
            default:
                mapFunction = (val,i) => {
                    if (bufferB[i] !== null) return bufferB[i];
                    return val;
                };
                break;
        }
        this.buffer = this.buffer.map(mapFunction)
    }

    getEmpty(){
        return new PlixBufferHandler(this.length);
    }

    getPixels() {
        return new Uint32Array(this.buffer);
    }
};